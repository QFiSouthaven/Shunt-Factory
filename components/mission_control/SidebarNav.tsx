import React, { useState } from 'react';
import { MissionControlTab, MissionControlTabKey } from '../../types';
import { AppIcon, ChevronDownIcon, ChevronRightIcon, LockClosedIcon, StarIcon } from '../icons';
import { useSubscription } from '../../context/SubscriptionContext';
import {
    tabTiers,
    isFeatureLocked,
    getRemainingUses,
    incrementFeatureUsage
} from '../../config/featureTiers';

interface SidebarNavProps {
    tabs: MissionControlTab[];
    activeTab: MissionControlTabKey;
    onTabClick: (tabKey: MissionControlTabKey) => void;
    isOpen: boolean;
}

interface TabItemProps {
    tab: MissionControlTab;
    activeTab: MissionControlTabKey;
    onTabClick: (tabKey: MissionControlTabKey) => void;
    isOpen: boolean;
    tier: 'Free' | 'Pro' | 'Enterprise';
    onShowUpgrade?: () => void;
}

const TabItem: React.FC<TabItemProps> = ({ tab, activeTab, onTabClick, isOpen, tier, onShowUpgrade }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const hasChildren = tab.children && tab.children.length > 0;

    // Get feature tier config
    const featureConfig = tabTiers[tab.key];
    const featureTier = featureConfig?.tier || 'free';
    const isPro = tier === 'Pro' || tier === 'Enterprise';

    // Check if feature is greyed out (low value)
    const isGreyedOut = featureTier === 'greyed';

    // Check if feature is locked (pro feature with no remaining uses)
    const isLocked = featureTier === 'pro' && isFeatureLocked(tab.key, isPro);
    const remainingUses = featureTier === 'pro' ? getRemainingUses(tab.key, isPro) : Infinity;

    // Check if user has access
    const hasAccess = !isGreyedOut && !isLocked;

    const isActive = activeTab === tab.key ||
                     (tab.children?.some(child => child.key === activeTab) ?? false);

    const handleClick = () => {
        if (isGreyedOut) {
            // Greyed out features are disabled
            return;
        }

        if (isLocked) {
            // Show upgrade modal
            onShowUpgrade?.();
            return;
        }

        if (hasChildren) {
            setIsExpanded(!isExpanded);
        } else {
            // Track usage for pro features
            if (featureTier === 'pro' && !isPro) {
                incrementFeatureUsage(tab.key);
            }
            onTabClick(tab.key);
        }
    };

    // Generate tooltip text
    const getTooltip = () => {
        if (isGreyedOut) return `${tab.label} - Coming soon`;
        if (isLocked) return `${tab.label} - Upgrade to Pro`;
        if (featureTier === 'pro' && !isPro) return `${tab.label} (${remainingUses} uses left)`;
        return tab.label;
    };

    return (
        <li>
            <button
                onClick={handleClick}
                title={getTooltip()}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors
                    ${isGreyedOut
                        ? 'opacity-10 cursor-not-allowed text-gray-600'
                        : isActive
                            ? 'bg-fuchsia-500/10 text-fuchsia-300'
                            : isLocked
                                ? 'text-gray-600 cursor-not-allowed'
                                : 'text-gray-400 hover:bg-gray-700/50 hover:text-gray-200'
                    }
                    ${!isOpen ? 'justify-center' : ''}
                `}
            >
                {tab.icon}
                {isOpen && (
                    <>
                        <span className="flex-grow text-left">{tab.label}</span>
                        {/* PRO badge */}
                        {featureTier === 'pro' && !isPro && !isLocked && (
                            <span className="px-1.5 py-0.5 text-xs bg-amber-500/20 text-amber-400 rounded">
                                {remainingUses}
                            </span>
                        )}
                        {/* Locked icon */}
                        {isLocked && <LockClosedIcon className="w-4 h-4 text-gray-500" />}
                        {/* PRO star for pro users */}
                        {featureTier === 'pro' && isPro && (
                            <StarIcon className="w-4 h-4 text-amber-400" />
                        )}
                        {hasChildren && hasAccess && (
                            isExpanded
                                ? <ChevronDownIcon className="w-4 h-4" />
                                : <ChevronRightIcon className="w-4 h-4" />
                        )}
                    </>
                )}
            </button>

            {/* Render children if expanded */}
            {hasChildren && isExpanded && isOpen && (
                <ul className="ml-6 mt-1 space-y-1 border-l-2 border-gray-700/50 pl-2">
                    {tab.children!.map(child => (
                        <TabItem
                            key={child.key}
                            tab={child}
                            activeTab={activeTab}
                            onTabClick={onTabClick}
                            isOpen={isOpen}
                            tier={tier}
                            onShowUpgrade={onShowUpgrade}
                        />
                    ))}
                </ul>
            )}
        </li>
    );
};

const SidebarNav: React.FC<SidebarNavProps> = ({ tabs, activeTab, onTabClick, isOpen }) => {
    const { tier } = useSubscription();

    // Navigate to subscription page when user needs to upgrade
    const handleShowUpgrade = () => {
        onTabClick('subscription');
    };

    return (
        <nav
            className={`bg-gray-900/50 border border-gray-700/50 flex-shrink-0 flex flex-col h-full
                       transition-all duration-300 ease-in-out overflow-hidden rounded-lg
                       ${isOpen ? 'w-64' : 'w-12'}
            `}
        >
            <div className={`border-b border-gray-700/50 flex items-center gap-3 ${isOpen ? 'p-5' : 'py-3 px-2 justify-center'}`}>
                <AppIcon className="w-8 h-8 text-fuchsia-400 flex-shrink-0" />
                {isOpen && (
                    <h1 className="text-xl font-bold tracking-wider text-gray-100 whitespace-nowrap">
                        Aether <span className="text-fuchsia-400">Shunt</span>
                    </h1>
                )}
            </div>
            <ul className={`flex-grow space-y-1 overflow-y-auto ${isOpen ? 'p-3' : 'py-3 px-1'}`}>
                {tabs.map(tab => (
                    <TabItem
                        key={tab.key}
                        tab={tab}
                        activeTab={activeTab}
                        onTabClick={onTabClick}
                        isOpen={isOpen}
                        tier={tier}
                        onShowUpgrade={handleShowUpgrade}
                    />
                ))}
            </ul>
        </nav>
    );
};

export default React.memo(SidebarNav);
