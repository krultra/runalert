'use client';

import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, BellOff, Filter, X, CheckCircle, Eye, EyeOff, Archive, ArchiveRestore } from 'lucide-react';
import { designSystem } from '@/app/styles/design-system';
import { MessageItem, type MessagePriority } from './MessageItem';
import MessageTypeIcon, { MessageType } from './MessageTypeIcon';

// Mock data type for messages
export interface Message {
  id: string;
  title: string;
  content: string;
  timestamp: Date;
  priority: MessagePriority;
  isRead: boolean;
  category?: string;
  dismissed?: boolean;
}

interface MessageFeedProps {
  initialMessages: Message[];
  isLoading?: boolean;
  onMessageRead?: (id: string) => void;
  onMessageDismiss?: (id: string) => void;
  onRefresh?: () => void;
  isVolunteer?: boolean;
}

export function MessageFeed({
  initialMessages,
  isLoading = false,
  onMessageRead,
  onMessageDismiss,
  onRefresh,
  isVolunteer = false,
}: MessageFeedProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  // By default, don't show dismissed messages
  const [showDismissed, setShowDismissed] = useState<boolean>(false);
  // Track dismissed messages separately
  const [dismissedMessages, setDismissedMessages] = useState<Message[]>([]);
  const [hasUnread, setHasUnread] = useState(false);
  const [undoState, setUndoState] = useState<{msg: Message, timeoutId: NodeJS.Timeout} | null>(null);
  const [viewMode, setViewMode] = useState<'volunteer' | 'runner'>('volunteer');

  const { colors, spacing, shadows, borderRadius } = designSystem;

  // Update messages when initialMessages prop changes
  useEffect(() => {
    setMessages(initialMessages);
    setHasUnread(initialMessages.some(msg => !msg.isRead));
  }, [initialMessages]);

  const handleMarkAsRead = (messageId: string) => {
    setMessages(prevMessages => 
      prevMessages.map(msg => 
        msg.id === messageId ? { ...msg, isRead: true } : msg
      )
    );
    onMessageRead?.(messageId);
  };

  // Undoable dismiss
  const handleDismiss = (messageId: string) => {
    const msgToRemove = messages.find(msg => msg.id === messageId);
    if (!msgToRemove) return;

    // Mark as dismissed and move to dismissed list
    const dismissedMsg = { ...msgToRemove, dismissed: true };
    setDismissedMessages(prev => [...prev, dismissedMsg]);
    
    // Remove the message from the active list
    setMessages(prevMessages => prevMessages.filter(msg => msg.id !== messageId));
    
    // Setup undo state with timeout
    const timeoutId = setTimeout(() => {
      setUndoState(null);
      onMessageDismiss?.(messageId);
    }, 5000);
    
    setUndoState({ msg: msgToRemove, timeoutId });
  };

  const handleUndoDismiss = () => {
    if (!undoState) return;
    
    clearTimeout(undoState.timeoutId);
    
    // Remove from dismissed list if it was added there
    setDismissedMessages(prev => prev.filter(msg => msg.id !== undoState.msg.id));
    
    // Add back to active messages
    setMessages(prevMessages => [...prevMessages, undoState.msg]);
    setUndoState(null);
  };

  const markAllAsRead = () => {
    const updatedMessages = messages.map(msg => ({ ...msg, isRead: true }));
    setMessages(updatedMessages);
    updatedMessages
      .filter(msg => !msg.isRead)
      .forEach(msg => onMessageRead?.(msg.id));
  };

  // Priority order for inclusive filtering
  const priorityOrder: MessagePriority[] = ['low', 'normal', 'high', 'critical'];

  // Combine active messages with dismissed messages if needed
  const allMessagesToDisplay = showDismissed 
    ? [...messages, ...dismissedMessages]
    : messages;
    
  // Filtered messages: show all messages at the selected priority and higher
  const filteredMessages = allMessagesToDisplay.filter((msg) => {
    if (activeFilter === 'all') return true;
    const idx = priorityOrder.indexOf(activeFilter as MessagePriority);
    const msgIdx = priorityOrder.indexOf(msg.priority as MessagePriority);
    return msgIdx >= idx;
  });

  // Group messages by date
  const groupedMessages = filteredMessages.reduce<Record<string, Message[]>>((groups, message) => {
    const date = message.timestamp.toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {});

  const priorityFilters: { id: MessagePriority | 'all'; label: string; color: string }[] = [
    { id: 'all', label: 'All', color: colors.gray500 },
    { id: 'critical', label: 'Critical', color: colors.error },
    { id: 'high', label: 'High', color: colors.warning },
    { id: 'normal', label: 'Normal', color: colors.primary },
    { id: 'low', label: 'Low', color: colors.gray500 },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* We removed the header with icons as requested */}

      {/* Message Type Filter Bar (Always Visible) */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 py-3 flex justify-between items-center shadow-sm filter-bar">
        <div className="flex gap-3 overflow-x-auto">
        {[
          { id: 'info', icon: 'info', label: 'Info & Above', color: '#3B82F6', darkModeColor: '#60A5FA' },
          { id: 'normal', icon: 'normal', label: 'General & Above', color: '#6366F1', darkModeColor: '#818CF8' },
          { id: 'high', icon: 'high', label: 'High & Above', color: '#F59E0B', darkModeColor: '#FBBF24' },
          { id: 'critical', icon: 'critical', label: 'Critical Only', color: '#EF4444', darkModeColor: '#F87171' },
        ].map((filter, index) => {
          // Calculate if this filter is highlighted based on the filter that's active
          let isHighlighted = false;
          
          // Logic for highlighting based on active filter
          if (activeFilter === 'all' || activeFilter === 'info') {
            // Info filter: all icons highlighted
            isHighlighted = true;
          } else if (activeFilter === 'normal') {
            // Normal filter: highlight normal, high, critical (not info)
            isHighlighted = filter.id !== 'info';
          } else if (activeFilter === 'high') {
            // High filter: highlight high, critical (not info, normal)
            isHighlighted = filter.id === 'high' || filter.id === 'critical';
          } else if (activeFilter === 'critical') {
            // Critical filter: only highlight critical
            isHighlighted = filter.id === 'critical';
          }
          
          // Special case: critical is ALWAYS highlighted
          if (filter.id === 'critical') {
            isHighlighted = true;
          }
          
          const useDarkColors = typeof window !== 'undefined' && document.documentElement.classList.contains('dark');
          const activeColor = useDarkColors ? filter.darkModeColor : filter.color;
          const inactiveColor = useDarkColors ? '#9CA3AF' : '#6B7280';
          
          return (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id as MessagePriority)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full border text-sm font-medium transition shadow-sm ${
                isHighlighted
                  ? ''
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
              style={{
                fontFamily: 'Inter, Geist, Arial, sans-serif',
                background: isHighlighted ? (useDarkColors ? `${filter.darkModeColor}22` : `${filter.color}22`) : undefined,
                borderColor: isHighlighted ? activeColor : undefined,
                color: isHighlighted ? activeColor : undefined,
                boxShadow: isHighlighted ? `0 2px 8px ${activeColor}33` : undefined,
                opacity: isHighlighted ? 1 : 0.7,
              }}
              aria-label={filter.label}
            >
              <MessageTypeIcon type={filter.id as MessageType} size={18} color={isHighlighted ? activeColor : inactiveColor} />
              <span className="ml-1 hidden sm:inline">{filter.label}</span>
            </button>
          );
          })}
        </div>
        
        {/* Show/Hide Dismissed Messages Toggle */}
        <button
          onClick={() => setShowDismissed(!showDismissed)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full border text-sm font-medium transition ml-2 flex-shrink-0"
          style={{
            background: showDismissed ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
            borderColor: showDismissed ? '#6366F1' : '#E5E7EB', 
            color: showDismissed ? '#6366F1' : 'inherit',
          }}
          aria-label={showDismissed ? 'Hide dismissed messages' : 'Show dismissed messages'}
        >
          {showDismissed ? (
            <>
              <ArchiveRestore size={18} />
              <span className="ml-1 hidden sm:inline">Show Dismissed</span>
            </>
          ) : (
            <>
              <Archive size={18} />
              <span className="ml-1 hidden sm:inline">Dismissed</span>
            </>
          )}
        </button>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto message-list-container">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-500">Loading messages...</p>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center p-4">
            <BellOff size={48} className="text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No messages</h3>
            <p className="mt-1 text-gray-500">
              {activeFilter === 'all' 
                ? 'You don\'t have any messages yet.' 
                : `No ${activeFilter} priority messages.`}
            </p>
            {activeFilter !== 'all' && (
              <button
                onClick={() => setActiveFilter('all')}
                className="mt-4 text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                View all messages
              </button>
            )}
          </div>
        ) : (
          Object.entries(groupedMessages).map(([date, dateMessages]) => (
            <div key={date} className="message-group">
              <div 
                className="text-xs font-medium uppercase tracking-wider px-2 py-1 rounded-full inline-block bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 date-header"
              >
                {new Date(date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>
              
              <div className="space-y-4">
                {dateMessages.map((message) => (
                  <MessageItem
                    key={message.id}
                    {...message}
                    onMarkAsRead={onMessageRead ? handleMarkAsRead : undefined}
                    onDismiss={onMessageDismiss ? handleDismiss : undefined}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Snackbar/Toast for Undo Dismiss */}
      {undoState && (
        <div
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 bg-gray-900 text-white dark:bg-gray-800 dark:text-gray-100 px-6 py-3 rounded-2xl shadow-lg flex items-center gap-4 animate-fadein"
          style={{ minWidth: 220, maxWidth: 320, fontFamily: 'Inter, Geist, Arial, sans-serif' }}
          role="status"
          aria-live="polite"
        >
          <span>Message dismissed.</span>
          <button
            onClick={handleUndoDismiss}
            className="font-semibold underline underline-offset-2 text-blue-300 hover:text-blue-400 focus:outline-none"
            aria-label="Undo dismiss"
          >
            Undo
          </button>
        </div>
      )}


    </div>
  );
}

export default MessageFeed;
