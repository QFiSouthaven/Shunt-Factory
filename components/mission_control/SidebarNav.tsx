import React, { useState } from 'react';
import { MissionControlTab, MissionControlTabKey } from '../../types';
import { AppIcon, ChevronDownIcon, ChevronRightIcon, LockClosedIcon } from '../icons';
import { useSubscription } from '../../context/SubscriptionContext';

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
}

const TabItem: React.FC<TabItemProps> = ({ tab, activeTab, onTabClick, isOpen, tier }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const hasChildren = tab.children && tab.children.length > 0;

    // Check if user has required tier
    const hasAccess = !tab.requiredTier ||
                      tier === 'Enterprise' ||
                      (tier === 'Pro' && tab.requiredTier === 'Pro');

    const isActive = activeTab === tab.key ||
                     (tab.children?.some(child => child.key === activeTab) ?? false);

    const handleClick = () => {
        if (!hasAccess) {
            // Could open upgrade modal here
            return;
        }

        if (hasChildren) {
            setIsExpanded(!isExpanded);
        } else {
            onTabClick(tab.key);
        }
    };

    return (
        <li>
            <button
                onClick={handleClick}
                title={!hasAccess ? `${tab.label} (${tab.requiredTier} tier required)` : tab.label}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors
                    ${isActive
                    ? 'bg-fuchsia-500/10 text-fuchsia-300'
                    : hasAccess
                        ? 'text-gray-400 hover:bg-gray-700/50 hover:text-gray-200'
                        : 'text-gray-600 cursor-not-allowed'
                    }
                    ${!isOpen ? 'justify-center' : ''}
                `}
            >
                {tab.icon}
                {isOpen && (
                    <>
                        <span className="flex-grow text-left">{tab.label}</span>
                        {!hasAccess && <LockClosedIcon className="w-4 h-4" />}
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
                        />
                    ))}
                </ul>
            )}
        </li>
    );
};

const SidebarNav: React.FC<SidebarNavProps> = ({ tabs, activeTab, onTabClick, isOpen }) => {
    const { tier } = useSubscription();

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
                    />
                ))}
            </ul>
        </nav>
    );
};

export default React.memo(SidebarNav);
