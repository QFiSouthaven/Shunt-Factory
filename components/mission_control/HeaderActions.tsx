import React from 'react';
import { useMailbox } from '../../context/MailboxContext';
import { FeedbackIcon, MailboxIcon } from '../icons';

interface HeaderActionsProps {
    onOpenFeedback: () => void;
    onOpenMailbox: () => void;
}

const HeaderActions: React.FC<HeaderActionsProps> = ({
    onOpenFeedback,
    onOpenMailbox,
}) => {
    const { unreadCount } = useMailbox();

    return (
        <div className="flex items-center gap-2">
            <button
                onClick={onOpenFeedback}
                className="p-2 rounded-full hover:bg-gray-700/50 transition-colors"
                aria-label="Provide Feedback"
            >
                <FeedbackIcon className="w-6 h-6 text-gray-300" />
            </button>
            <button
                onClick={onOpenMailbox}
                className="relative p-2 rounded-full hover:bg-gray-700/50 transition-colors"
                aria-label={`Open Mailbox (${unreadCount} unread)`}
            >
                <MailboxIcon className="w-6 h-6 text-gray-300" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-fuchsia-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-gray-800">
                        {unreadCount}
                    </span>
                )}
            </button>
        </div>
    );
};

export default React.memo(HeaderActions);