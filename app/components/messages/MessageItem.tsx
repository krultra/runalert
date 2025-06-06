'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { colors } from '@/app/styles/design-system';
import MessageTypeIcon, { MessageType } from './MessageTypeIcon';

export type MessagePriority = 'low' | 'normal' | 'high' | 'critical';

interface MessageItemProps {
  id: string;
  title: string;
  content: string;
  timestamp: Date;
  type?: MessageType; // info | normal | high | critical
  priority?: MessagePriority; // for backward compatibility
  isRead: boolean;
  onMarkAsRead?: (id: string) => void;
  onDismiss?: (id: string) => void;
}

export function MessageItem({
  id,
  title,
  content,
  timestamp,
  type,
  priority = 'normal',
  isRead = false,
  onMarkAsRead,
  onDismiss,
}: MessageItemProps) {
  const [expanded, setExpanded] = useState(false);
  
  // Helper function to get the priority color
  const getPriorityColor = (priority: MessagePriority): string => {
    switch(priority) {
      case 'critical': return colors.error;
      case 'high': return colors.warning;
      case 'low': return colors.info;
      default: return colors.primary;
    }
  };

  // Auto-mark as read on expand
  React.useEffect(() => {
    if (expanded && !isRead && onMarkAsRead) {
      onMarkAsRead(id);
    }
    // Only run when expanded or isRead changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded]);

  // Only show clock time (e.g., 21:05)
  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('no-NO', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date);
  };

  // Use type if provided, otherwise map legacy priority
  const messageType: MessageType = type ||
    (priority === 'low' ? 'info' :
     priority === 'high' ? 'high' :
     priority === 'critical' ? 'critical' : 'normal');

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.2 }}
      className={`relative mb-4 rounded-2xl shadow-md bg-background border border-border`}
    >
      <button
        className="flex w-full items-center px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ring rounded-2xl"
        onClick={() => setExpanded((prev) => !prev)}
        aria-expanded={expanded}
        aria-controls={`message-panel-${id}`}
        style={{ borderLeft: `4px solid ${getPriorityColor(priority)}`, background: expanded ? 'var(--muted)' : 'transparent' }}
      >
        {/* Message type icon */}
        <span className="inline-block mr-3 flex-shrink-0 rounded-full" style={{ verticalAlign: 'middle' }}>
          <MessageTypeIcon type={messageType} size={22} ariaLabel={messageType.charAt(0).toUpperCase() + messageType.slice(1)} />
        </span>
        <div className="flex-1 flex items-center min-w-0">
          <span
            className="truncate font-bold text-base sm:text-lg text-foreground"
          >
            {title}
          </span>
          <span className="ml-2 text-xs flex-shrink-0 text-muted-foreground" style={{ 
            marginLeft: 'auto'
          }}>
            {formatTime(timestamp)}
          </span>
        </div>
        <span className="ml-2 flex items-center">
          {expanded ? (
            <ChevronUp size={20} className="text-muted-foreground" />
          ) : (
            <ChevronDown size={20} className="text-muted-foreground" />
          )}
        </span>
      </button>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            id={`message-panel-${id}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="px-4 pb-4"
            style={{ overflow: 'hidden' }}
          >
            <div className="mt-2 text-foreground text-sm leading-6">
              {content}
            </div>
            <div className="mt-4 flex gap-2 justify-end">
              {!isRead && onMarkAsRead && (
                <button
                  onClick={() => onMarkAsRead(id)}
                  className="text-xs font-medium px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-200 hover:bg-blue-100 dark:hover:bg-blue-800 transition"
                  aria-label="Mark as read"
                >
                  Mark as read
                </button>
              )}
              {onDismiss && (
                <button
                  onClick={() => onDismiss(id)}
                  className="text-xs font-medium px-3 py-1 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                  aria-label="Dismiss message"
                >
                  Dismiss
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default MessageItem;

