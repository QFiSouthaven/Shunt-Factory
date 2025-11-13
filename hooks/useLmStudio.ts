// hooks/useLmStudio.ts
import { useState, useCallback } from 'react';

interface LmStudioResponse {
  resultText: string;
}

export const useLmStudio = () => {
    const [isLmStudioLoading, setIsLoading] = useState(false);
    const [lmStudioError, setLmStudioError] = useState<string | null>(null);

    const callLmStudio = useCallback(async (prompt: string, endpoint: string): Promise<LmStudioResponse> => {
        setIsLoading(true);
        setLmStudioError(null);

        if (!endpoint) {
            const errorMsg = 'LM Studio endpoint is not configured in settings.';
            setLmStudioError(errorMsg);
            setIsLoading(false);
            throw new Error(errorMsg);
        }

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'local-model', // Model name is often ignored by LM Studio server
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.7,
                    stream: false,
                }),
            });

            if (!response.ok) {
                throw new Error(`LM Studio server responded with status: ${response.status}. Make sure the server is running and accessible at the configured endpoint.`);
            }

            const data = await response.json();
            const resultText = data.choices?.[0]?.message?.content || '';

            if (!resultText) {
                throw new Error("Received an empty or malformed response from LM Studio.");
            }

            return { resultText };

        } catch (error) {
            console.error("LM Studio connection error:", error);
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
            // Provide a user-friendly error message
            if (errorMessage.includes('Failed to fetch')) {
                 const friendlyError = `Could not connect to LM Studio at ${endpoint}. Please ensure the local server is running and the endpoint is configured correctly in Settings.`;
                 setLmStudioError(friendlyError);
                 throw new Error(friendlyError);
            }
            setLmStudioError(errorMessage);
            throw error; // Re-throw to be caught by the calling function
        } finally {
            setIsLoading(false);
        }
    }, []);

    return { callLmStudio, isLmStudioLoading, lmStudioError };
};