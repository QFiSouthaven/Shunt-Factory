// services/telemetry.service.ts
//
// PERFORMANCE FIX: Implements circuit breaker and kill switch per security audit
// - Circuit breaker prevents infinite 404 retries when backend unavailable
// - Environment variable kill switch for production (VITE_ENABLE_TELEMETRY)
// - Bounded queue (ring buffer) prevents memory leaks during long sessions

import {
    InteractionEvent,
    TelemetryConfig,
    GlobalTelemetryContext,
} from '../types/telemetry';
import { appEventBus } from '../lib/eventBus';

// Check if telemetry is enabled via environment variable
const TELEMETRY_ENABLED = import.meta.env.VITE_ENABLE_TELEMETRY !== 'false';

// Sensible defaults to ensure the service is operational even with minimal configuration
const DEFAULT_CONFIG: TelemetryConfig = {
    backendEndpoint: '/api/telemetry/events', // Standardized API endpoint for telemetry ingestion
    batchSize: 10, // Optimize network traffic by grouping events
    batchIntervalMs: 5000, // Ensure timely data transmission even for sparse event streams
    maxQueueSize: 100, // Safeguard against excessive memory consumption (ring buffer)
};

// Circuit breaker configuration
const CIRCUIT_BREAKER_THRESHOLD = 5; // Number of consecutive failures before opening circuit
const CIRCUIT_BREAKER_RESET_MS = 60000; // 1 minute before attempting to close circuit

/**
 * A robust, performance-optimized Telemetry Service for capturing and
 * persistently sending structured interaction events. It intelligently handles
 * event enrichment, resilient queuing, and asynchronous batch transmission
 * to prevent any degradation of frontend responsiveness.
 *
 * SECURITY AUDIT FIXES:
 * - Implements circuit breaker to stop retries when backend unavailable (404/500 errors)
 * - Environment variable kill switch (VITE_ENABLE_TELEMETRY=false)
 * - Bounded queue prevents unbounded memory growth during long sessions
 */
export class TelemetryService {
    private config: TelemetryConfig;
    private globalContext: GlobalTelemetryContext;
    private eventQueue: InteractionEvent[] = []; // In-memory queue for accumulating events
    private sendTimeout: ReturnType<typeof setTimeout> | null = null; // Manages timed dispatches
    private isSending: boolean = false; // Flag to prevent concurrent network requests and race conditions

    // Circuit breaker state
    private consecutiveFailures: number = 0;
    private circuitOpen: boolean = false;
    private circuitOpenedAt: number | null = null;

    constructor(globalContext: GlobalTelemetryContext, config?: Partial<TelemetryConfig>) {
        if (!TELEMETRY_ENABLED) {
            console.log('TelemetryService: Telemetry disabled via VITE_ENABLE_TELEMETRY environment variable.');
            return;
        }

        if (!globalContext.userID || !globalContext.sessionID) {
            console.warn('TelemetryService initialized without valid userID or sessionID. Events may lack crucial context, impacting analytical insights.');
        }
        this.globalContext = globalContext;
        this.config = { ...DEFAULT_CONFIG, ...config };

        // Proactively start the periodic send interval to ensure data freshness
        this.startSendInterval();
    }

    public updateGlobalContext(newContext: Partial<GlobalTelemetryContext>): void {
        this.globalContext = { ...this.globalContext, ...newContext };
        console.log('TelemetryService global context dynamically updated:', this.globalContext);
    }

    public getGlobalContext(): GlobalTelemetryContext {
        return this.globalContext;
    }

    public recordEvent(partialEvent: Omit<InteractionEvent, 'id' | 'timestamp' | 'userID' | 'sessionID'>): void {
        // Kill switch: Early return if telemetry is disabled
        if (!TELEMETRY_ENABLED) {
            return;
        }

        // Circuit breaker: Drop events when circuit is open
        if (this.circuitOpen) {
            console.warn(`TelemetryService: Circuit breaker OPEN. Dropping event of type: ${partialEvent.eventType}`);
            return;
        }

        if (this.eventQueue.length >= this.config.maxQueueSize!) {
            console.warn(`TelemetryService queue is full (max: ${this.config.maxQueueSize}). Dropping event of type: ${partialEvent.eventType}. Consider increasing maxQueueSize or optimizing event frequency.`);
            return;
        }

        const enrichedEvent: InteractionEvent = {
            id: crypto.randomUUID(), // Assign a universally unique identifier
            timestamp: new Date().toISOString(), // Capture precise moment of event creation in ISO 8601
            ...this.globalContext, // Incorporate all static global context attributes
            ...partialEvent, // Overlay event-specific data
            contextDetails: { // Smartly merge contextDetails to avoid overwriting
                ...this.globalContext.contextDetails,
                ...partialEvent.contextDetails,
            }
        };

        this.eventQueue.push(enrichedEvent);
        console.log(`TelemetryService: Event '${enrichedEvent.eventType}' queued. Current queue size: ${this.eventQueue.length}.`);

        // Emit the event on the bus for live listeners like Oraculum
        appEventBus.emit('telemetry', { type: 'interaction_event', data: enrichedEvent });

        // Trigger an immediate send if the batch size threshold is met
        if (this.eventQueue.length >= this.config.batchSize!) {
            this.sendQueuedEvents();
        }
    }

    private async sendQueuedEvents(): Promise<void> {
        if (!TELEMETRY_ENABLED) {
            return; // Kill switch check
        }

        // Circuit breaker: Check if we should attempt to reset the circuit
        if (this.circuitOpen) {
            const now = Date.now();
            if (this.circuitOpenedAt && (now - this.circuitOpenedAt) >= CIRCUIT_BREAKER_RESET_MS) {
                console.log('TelemetryService: Attempting to close circuit breaker...');
                this.circuitOpen = false;
                this.consecutiveFailures = 0;
                this.circuitOpenedAt = null;
            } else {
                return; // Circuit still open, don't send
            }
        }

        if (this.isSending || this.eventQueue.length === 0) {
            return; // Prevent redundant or concurrent dispatches
        }

        this.isSending = true;
        const eventsToSend = [...this.eventQueue]; // Capture current queue state
        this.eventQueue = []; // Clear the queue immediately

        // Clear any pending timed send to avoid duplicates
        if (this.sendTimeout) {
            clearTimeout(this.sendTimeout);
            this.sendTimeout = null;
        }

        try {
            console.log(`TelemetryService: Attempting to send ${eventsToSend.length} events to ${this.config.backendEndpoint}...`);
            const response = await fetch(this.config.backendEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(eventsToSend),
                keepalive: true, // Crucial for ensuring requests complete on page navigation/closure
            });

            if (!response.ok) {
                // Log non-2xx responses, but don't re-queue to prevent infinite loops for bad data
                console.error(`TelemetryService: Failed to send events. Status: ${response.status}. Response: ${await response.text()}`);
                this.handleSendFailure();
            } else {
                console.log(`TelemetryService: Successfully dispatched ${eventsToSend.length} events.`);
                this.handleSendSuccess();
            }
        } catch (error) {
            console.error('TelemetryService: Network error encountered while sending events. Data might be lost:', error);
            this.handleSendFailure();
        } finally {
            this.isSending = false;
            this.startSendInterval(); // Re-arm the periodic sender
        }
    }

    /**
     * Circuit breaker: Handle successful send
     */
    private handleSendSuccess(): void {
        this.consecutiveFailures = 0;
        if (this.circuitOpen) {
            console.log('TelemetryService: Circuit breaker CLOSED after successful send.');
            this.circuitOpen = false;
            this.circuitOpenedAt = null;
        }
    }

    /**
     * Circuit breaker: Handle failed send
     */
    private handleSendFailure(): void {
        this.consecutiveFailures++;
        console.warn(`TelemetryService: Consecutive failures: ${this.consecutiveFailures}/${CIRCUIT_BREAKER_THRESHOLD}`);

        if (this.consecutiveFailures >= CIRCUIT_BREAKER_THRESHOLD) {
            this.circuitOpen = true;
            this.circuitOpenedAt = Date.now();
            console.error(`TelemetryService: Circuit breaker OPENED after ${CIRCUIT_BREAKER_THRESHOLD} consecutive failures. Will retry in ${CIRCUIT_BREAKER_RESET_MS / 1000}s.`);
        }
    }

    private startSendInterval(): void {
        if (this.sendTimeout) clearTimeout(this.sendTimeout); // Clear existing timer to prevent duplicates
        this.sendTimeout = setTimeout(() => {
            if (this.eventQueue.length > 0) {
                this.sendQueuedEvents(); // Send if there are events
            } else {
                this.startSendInterval(); // If no events, re-arm the timer
            }
        }, this.config.batchIntervalMs);
    }

    public flushOnUnload(): void {
        if (!TELEMETRY_ENABLED || this.eventQueue.length === 0) {
            return;
        }

        const eventsToFlush = [...this.eventQueue];
        this.eventQueue = []; // Clear the queue

        console.log(`TelemetryService: Attempting to flush ${eventsToFlush.length} events on application unload...`);

        if (navigator.sendBeacon) {
            // sendBeacon is ideal for analytics as it doesn't block page unload
            const success = navigator.sendBeacon(
                this.config.backendEndpoint,
                new Blob([JSON.stringify(eventsToFlush)], { type: 'application/json' })
            );
            if (!success) {
                 console.warn('TelemetryService: navigator.sendBeacon failed. Data may not have been sent reliably.');
            } else {
                 console.log(`TelemetryService: Successfully initiated sendBeacon for ${eventsToFlush.length} events.`);
            }
        } else {
            // Fallback for older browsers: use fetch with keepalive, which is less reliable on unload
             fetch(this.config.backendEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(eventsToFlush),
                keepalive: true,
            }).catch(e => console.error('TelemetryService: Fallback fetch on unload failed:', e));
        }
    }

    /**
     * Get circuit breaker status for debugging
     */
    public getCircuitBreakerStatus(): { open: boolean; consecutiveFailures: number } {
        return {
            open: this.circuitOpen,
            consecutiveFailures: this.consecutiveFailures,
        };
    }
}