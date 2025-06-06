'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageFeed } from '@/app/components/messages/MessageFeed';
import { mockMessages } from '@/app/data/mockMessages';
import { designSystem } from '@/app/styles/design-system';

export default function MessagesDemoPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [messages, setMessages] = useState(mockMessages);
  const { colors } = designSystem;

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleMarkAsRead = (messageId: string) => {
    setMessages(prev => 
      prev.map(msg => 
        msg.id === messageId ? { ...msg, isRead: true } : msg
      )
    );
    // In a real app, you would call an API here
    console.log(`Marking message ${messageId} as read`);
  };

  const handleDismiss = (messageId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
    // In a real app, you would call an API here
    console.log(`Dismissing message ${messageId}`);
  };

  const handleRefresh = () => {
    setIsLoading(true);
    // Simulate refresh
    setTimeout(() => {
      setMessages(mockMessages);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <main className="flex-1 overflow-hidden">
        <div className="max-w-3xl mx-auto h-full flex flex-col">
          <div className="flex-1 overflow-hidden">
            <MessageFeed
              initialMessages={messages}
              onMessageRead={handleMarkAsRead}
              onMessageDismiss={handleDismiss}
              onRefresh={handleRefresh}
              isLoading={isLoading}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} RunAlert. Demo preview.
          </p>
        </div>
      </footer>
    </div>
  );
}
