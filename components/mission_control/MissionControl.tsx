// components/mission_control/MissionControl.tsx
import React, { useState, useCallback, lazy, Suspense, useEffect } from 'react';
import {
    SparklesIcon, BrainIcon, BookIcon, HistoryIcon,
    ChatBubbleLeftRightIcon, PhotoIcon, DocumentIcon, Cog6ToothIcon, StarIcon,
    TerminalIcon, GlobeAltIcon, BranchingIcon, ServerStackIcon, MenuIcon, DeveloperIcon, CpuChipIcon
} from '../icons';
import { MissionControlTab, MissionControlTabKey } from '../../types';
import Loader from '../Loader';
import SidebarNav from './SidebarNav';
import { ActiveTabProvider } from '../../context/ActiveTabContext';
import HeaderActions from './HeaderActions';
import FeedbackModal from '../common/FeedbackModal';
import MailboxModal from '../weaver/MailboxModal';
import { audioService } from '../../services/audioService';
import { useMediaQuery } from '../../hooks/useMediaQuery';

// Lazy load components for code splitting and on-demand loading
const Shunt = lazy(() => import('../shunt/Shunt'));
const Weaver = lazy(() => import('../weaver/Weaver'));
const Foundry = lazy(() => import('../foundry/Foundry'));
const HumanityLastTool = lazy(() => import('../foundry/HumanityLastTool'));
const Chat = lazy(() => import('../chat/Chat'));
const ImageAnalysis = lazy(() => import('../image_analysis/ImageAnalysis'));
const Oraculum = lazy(() => import('../oraculum/Oraculum'));
const Subscription = lazy(() => import('../subscription/Subscription'));
const Documentation = lazy(() => import('../documentation/Documentation'));
const Settings = lazy(() => import('../settings/Settings'));
const Terminal = lazy(() => import('../terminal/Terminal'));
const Chronicle = lazy(() => import('../chronicle/Chronicle'));
const Deploy = lazy(() => import('../deploy/Deploy'));
const ToolforAI = lazy(() => import('../tool_for_ai/ToolforAI'));
const Framework = lazy(() => import('../framework/Framework'));


const tabs: MissionControlTab[] = [
    { key: 'shunt', label: 'Shunt', icon: <SparklesIcon className="w-5 h-5" />, component: Shunt },
    { key: 'weaver', label: 'Weaver', icon: <BrainIcon className="w-5 h-5" />, component: Weaver },
    {
        key: 'foundry',
        label: 'Foundry',
        icon: <BranchingIcon className="w-5 h-5" />,
        component: Foundry,
        children: [
            {
                key: 'foundry_humanity_last_tool',
                label: "Humanity's Last Tool",
                icon: <StarIcon className="w-4 h-4" />,
                component: HumanityLastTool,
                requiredTier: 'Pro',
                parent: 'foundry'
            }
        ]
    },
    { key: 'framework', label: 'Framework', icon: <CpuChipIcon className="w-5 h-5" />, component: Framework },
    { key: 'deploy', label: 'Deploy', icon: <ServerStackIcon className="w-5 h-5" />, component: Deploy },
    { key: 'chat', label: 'Chat', icon: <ChatBubbleLeftRightIcon className="w-5 h-5" />, component: Chat },
    { key: 'image_analysis', label: 'Image Analysis', icon: <PhotoIcon className="w-5 h-5" />, component: ImageAnalysis },
    { key: 'terminal', label: 'Terminal', icon: <TerminalIcon className="w-5 h-5" />, component: Terminal },
    { key: 'oraculum', label: 'Oraculum', icon: <GlobeAltIcon className="w-5 h-5" />, component: Oraculum },
    { key: 'chronicle', label: 'Chronicle', icon: <HistoryIcon className="w-5 h-5" />, component: Chronicle },
    { key: 'tool_for_ai', label: 'Tool for AI', icon: <DeveloperIcon className="w-5 h-5" />, component: ToolforAI },
    { key: 'subscription', label: 'Subscription', icon: <StarIcon className="w-5 h-5" />, component: Subscription },
    { key: 'documentation', label: 'Documentation', icon: <DocumentIcon className="w-5 h-5" />, component: Documentation },
    { key: 'settings', label: 'Settings', icon: <Cog6ToothIcon className="w-5 h-5" />, component: Settings },
];

// Helper function to find a tab (including nested tabs)
const findTab = (tabs: MissionControlTab[], key: MissionControlTabKey): MissionControlTab | undefined => {
    for (const tab of tabs) {
        if (tab.key === key) return tab;
        if (tab.children) {
            const found = findTab(tab.children, key);
            if (found) return found;
        }
    }
    return undefined;
};

const LoadingFallback = () => (
    <div className="flex h-full w-full items-center justify-center bg-gray-800/30">
        <div className="flex flex-col items-center gap-4">
            <Loader />
            <p className="text-gray-400">Loading Module...</p>
        </div>
    </div>
);

const MissionControl: React.FC = () => {
    const [activeTabKey, setActiveTabKey] = useState<MissionControlTabKey>('shunt');
    const [exitingTabKey, setExitingTabKey] = useState<MissionControlTabKey | null>(null);
    const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
    const [isMailboxModalOpen, setIsMailboxModalOpen] = useState(false);
    
    const isDesktop = useMediaQuery('(min-width: 1024px)');
    // isSidebarOpen is for the mobile overlay
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    // isSidebarExpanded is for the desktop expanded state
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

    const handleTabClick = useCallback((tabKey: MissionControlTabKey) => {
        if (tabKey === activeTabKey || exitingTabKey) {
            return;
        }

        setExitingTabKey(activeTabKey);
        setActiveTabKey(tabKey);
        audioService.playSound('tab_switch');
        
        // On mobile, close sidebar on navigation
        if (!isDesktop) {
            setIsSidebarOpen(false);
        }
        
        setTimeout(() => {
            setExitingTabKey(null);
        }, 500); // Match CSS animation duration
    }, [activeTabKey, exitingTabKey, isDesktop]);

    const activeTab = findTab(tabs, activeTabKey);
    const ActiveComponent = activeTab ? activeTab.component : null;

    const exitingTab = exitingTabKey ? findTab(tabs, exitingTabKey) : null;
    const ExitingComponent = exitingTab ? exitingTab.component : null;

    const mainMarginClass = isDesktop ? (isSidebarExpanded ? 'ml-64' : 'ml-12') : 'ml-0';

    const handleOpenFeedback = useCallback(() => setIsFeedbackModalOpen(true), []);
    const handleOpenMailbox = useCallback(() => setIsMailboxModalOpen(true), []);

    return (
        <div className="flex h-screen w-full lg:p-4 bg-gray-900 text-gray-200">
            {/* --- Sidebar --- */}

            {/* Desktop: Fixed, expands on hover */}
            <div 
                className="hidden lg:flex fixed left-4 top-4 bottom-4 z-50 flex-shrink-0"
                onMouseEnter={() => setIsSidebarExpanded(true)}
                onMouseLeave={() => setIsSidebarExpanded(false)}
            >
                <SidebarNav tabs={tabs} activeTab={activeTabKey} onTabClick={handleTabClick} isOpen={isSidebarExpanded} />
            </div>

            {/* Mobile: Overlay, toggled by button */}
            <div className="lg:hidden">
                {/* Backdrop */}
                <div 
                    className={`fixed inset-0 bg-black/60 z-30 transition-opacity ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                    onClick={() => setIsSidebarOpen(false)}
                />
                {/* Panel */}
                <div className={`fixed top-0 left-0 bottom-0 z-40 transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    <SidebarNav tabs={tabs} activeTab={activeTabKey} onTabClick={handleTabClick} isOpen={true} />
                </div>
            </div>
            
            <main className={`flex-grow flex flex-col bg-gray-800/50 border-gray-700/50 
                             lg:rounded-r-lg lg:border 
                             transition-all duration-300 ease-in-out
                             ${mainMarginClass}
                             ${!isDesktop ? 'rounded-none' : ''}`}>
                <header className="flex items-center justify-between p-4 border-b border-gray-700/50 flex-shrink-0 bg-gradient-to-t from-gray-900 to-gray-700">
                     <div className="flex items-center gap-2">
                        {/* Hamburger Menu for Mobile */}
                        <button onClick={() => setIsSidebarOpen(true)} className="p-1 text-gray-300 lg:hidden">
                            <MenuIcon className="w-6 h-6" />
                        </button>
                        <h2 className="text-lg font-semibold">{activeTab?.label}</h2>
                    </div>
                    <HeaderActions 
                        onOpenFeedback={handleOpenFeedback}
                        onOpenMailbox={handleOpenMailbox}
                    />
                </header>
                <div className="flex-grow relative overflow-hidden tab-container">
                    <ActiveTabProvider activeTab={activeTabKey}>
                        <Suspense fallback={<LoadingFallback />}>
                            {ExitingComponent && (
                                <div key={exitingTabKey} className="tab-pane tab-exit">
                                    <ExitingComponent />
                                </div>
                            )}
                            {ActiveComponent && (
                                <div key={activeTabKey} className={`tab-pane ${exitingTabKey ? 'tab-enter' : ''}`}>
                                    <ActiveComponent />
                                </div>
                            )}
                        </Suspense>
                    </ActiveTabProvider>
                </div>
            </main>
            <FeedbackModal isOpen={isFeedbackModalOpen} onClose={() => setIsFeedbackModalOpen(false)} />
            <MailboxModal isOpen={isMailboxModalOpen} onClose={() => setIsMailboxModalOpen(false)} />
        </div>
    );
};

export default MissionControl;