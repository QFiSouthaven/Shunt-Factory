/**
 * Feature Tier Configuration
 *
 * Defines which features are Pro-only, free, or greyed out (low value).
 * Free users get 3 uses of Pro features before being locked.
 */

import { ShuntAction, MissionControlTabKey } from '../types';

export type FeatureTier = 'pro' | 'free' | 'greyed';

export interface FeatureTierConfig {
  tier: FeatureTier;
  freeUsesAllowed: number; // 0 = unlimited, -1 = disabled
  description: string;
}

// Tab-level feature tiers
export const tabTiers: Record<MissionControlTabKey, FeatureTierConfig> = {
  // PRO TIER - 3 free uses
  weaver: {
    tier: 'pro',
    freeUsesAllowed: 3,
    description: 'Multi-step AI workflow orchestration'
  },
  foundry: {
    tier: 'pro',
    freeUsesAllowed: 3,
    description: 'Multi-agent code review system (7 agents)'
  },
  framework: {
    tier: 'pro',
    freeUsesAllowed: 3,
    description: 'Architecture visualization and Foundry multi-agent system'
  },
  foundry_humanity_last_tool: {
    tier: 'pro',
    freeUsesAllowed: 3,
    description: 'Elite 6-agent strategic task force'
  },
  tool_for_ai: {
    tier: 'pro',
    freeUsesAllowed: 3,
    description: 'Job queue and AI tool execution system'
  },
  ui_builder: {
    tier: 'pro',
    freeUsesAllowed: 3,
    description: 'Visual UI component builder'
  },
  orchestrator: {
    tier: 'pro',
    freeUsesAllowed: 3,
    description: 'Multi-agent orchestration system'
  },
  serendipity_engine: {
    tier: 'pro',
    freeUsesAllowed: 3,
    description: 'AI-driven creative exploration engine'
  },

  // FREE TIER - Unlimited
  shunt: {
    tier: 'free',
    freeUsesAllowed: 0,
    description: 'Core text transformation engine'
  },
  chat: {
    tier: 'free',
    freeUsesAllowed: 0,
    description: 'Direct AI chat interface'
  },
  anthropic_chat: {
    tier: 'free',
    freeUsesAllowed: 0,
    description: 'Anthropic Claude chat interface'
  },
  developers: {
    tier: 'free',
    freeUsesAllowed: 0,
    description: 'Developer tools and utilities'
  },
  settings: {
    tier: 'free',
    freeUsesAllowed: 0,
    description: 'User preferences and configuration'
  },
  subscription: {
    tier: 'free',
    freeUsesAllowed: 0,
    description: 'Subscription management'
  },
  documentation: {
    tier: 'free',
    freeUsesAllowed: 0,
    description: 'Project documentation'
  },

  // GREYED OUT - Low value/inefficient
  terminal: {
    tier: 'greyed',
    freeUsesAllowed: 0,
    description: 'In-browser terminal emulation (niche use case)'
  },
  chronicle: {
    tier: 'greyed',
    freeUsesAllowed: 0,
    description: 'Session history and logging'
  },
  oraculum: {
    tier: 'greyed',
    freeUsesAllowed: 0,
    description: 'Knowledge base and query system'
  },
  image_analysis: {
    tier: 'greyed',
    freeUsesAllowed: 0,
    description: 'Image processing and analysis'
  },
  deploy: {
    tier: 'greyed',
    freeUsesAllowed: 0,
    description: 'Deployment management (backend not ready)'
  },
};

// Shunt action tiers
export const shuntActionTiers: Partial<Record<ShuntAction, FeatureTierConfig>> = {
  // PRO TIER - 3 free uses
  [ShuntAction.AMPLIFY]: {
    tier: 'pro',
    freeUsesAllowed: 3,
    description: 'Expand and elaborate on content'
  },
  [ShuntAction.AMPLIFY_X2]: {
    tier: 'pro',
    freeUsesAllowed: 3,
    description: 'Double expansion of content'
  },
  [ShuntAction.MAKE_ACTIONABLE]: {
    tier: 'pro',
    freeUsesAllowed: 3,
    description: 'Convert to actionable tasks'
  },
  [ShuntAction.BUILD_A_SKILL]: {
    tier: 'pro',
    freeUsesAllowed: 3,
    description: 'Generate skill implementations'
  },
  [ShuntAction.REFINE_PROMPT]: {
    tier: 'pro',
    freeUsesAllowed: 3,
    description: 'Optimize prompts for better results'
  },
};

// Usage tracking keys for localStorage
export const USAGE_STORAGE_KEY = 'shunt_factory_feature_usage';

export interface FeatureUsage {
  [featureKey: string]: number;
}

// Get current usage from localStorage
export function getFeatureUsage(): FeatureUsage {
  try {
    const stored = localStorage.getItem(USAGE_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

// Increment usage for a feature
export function incrementFeatureUsage(featureKey: string): number {
  const usage = getFeatureUsage();
  usage[featureKey] = (usage[featureKey] || 0) + 1;
  localStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(usage));
  return usage[featureKey];
}

// Check if feature is locked for free users
export function isFeatureLocked(featureKey: string, isPro: boolean): boolean {
  if (isPro) return false;

  // Check tab tiers
  const tabConfig = tabTiers[featureKey as MissionControlTabKey];
  if (tabConfig && tabConfig.tier === 'pro') {
    const usage = getFeatureUsage();
    return (usage[featureKey] || 0) >= tabConfig.freeUsesAllowed;
  }

  // Check shunt action tiers
  const actionConfig = shuntActionTiers[featureKey as ShuntAction];
  if (actionConfig && actionConfig.tier === 'pro') {
    const usage = getFeatureUsage();
    return (usage[featureKey] || 0) >= actionConfig.freeUsesAllowed;
  }

  return false;
}

// Get remaining uses for a feature
export function getRemainingUses(featureKey: string, isPro: boolean): number {
  if (isPro) return Infinity;

  const tabConfig = tabTiers[featureKey as MissionControlTabKey];
  const actionConfig = shuntActionTiers[featureKey as ShuntAction];
  const config = tabConfig || actionConfig;

  if (!config || config.tier !== 'pro') return Infinity;

  const usage = getFeatureUsage();
  const used = usage[featureKey] || 0;
  return Math.max(0, config.freeUsesAllowed - used);
}

// Reset all usage (for testing or subscription changes)
export function resetFeatureUsage(): void {
  localStorage.removeItem(USAGE_STORAGE_KEY);
}

// Get tier styling classes
export function getTierClasses(tier: FeatureTier): string {
  switch (tier) {
    case 'pro':
      return 'border-amber-500/30 bg-amber-500/5';
    case 'greyed':
      return 'opacity-10 pointer-events-none';
    case 'free':
    default:
      return '';
  }
}

// Get tier badge
export function getTierBadge(tier: FeatureTier): string | null {
  switch (tier) {
    case 'pro':
      return 'PRO';
    case 'greyed':
      return null;
    case 'free':
    default:
      return null;
  }
}
