'use client';

import { useState } from 'react';
import { messageService } from '@/app/services/firebase';

export function TestMessageGenerator() {
  const [title, setTitle] = useState('Test Message');
  const [content, setContent] = useState('This is a test message content.');
  const [priority, setPriority] = useState<'info' | 'warning' | 'critical' | 'announcement'>('info');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastAction, setLastAction] = useState('');

  const generateMessage = async () => {
    try {
      setIsSubmitting(true);
      
      // Create timestamp with current time
      const now = new Date();
      
      // Create a message object with the current data
      const message = {
        title,
        content,
        priority,
        createdAt: now
      };
      
      // Add the message to the database
      await messageService.addMessage(message);
      
      // Reset form data but keep the current priority
      setTitle(`Test ${priority.charAt(0).toUpperCase() + priority.slice(1)} Message`);
      setContent(`This is a test ${priority} message created at ${now.toLocaleTimeString()}.`);
      
      // Display success message
      setLastAction(`Created a new ${priority} test message at ${now.toLocaleTimeString()}`);
    } catch (error) {
      console.error('Error creating test message:', error);
      setLastAction(`Error: Failed to create test message. Check console for details.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePriorityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as 'info' | 'warning' | 'critical' | 'announcement';
    setPriority(value);
    // Update title and content to reflect new priority
    setTitle(`Test ${value.charAt(0).toUpperCase() + value.slice(1)} Message`);
    setContent(`This is a test ${value} message.`);
  };

  return (
    <div className="p-4 border rounded-lg mb-4 bg-gray-50 dark:bg-gray-800/40">
      <h3 className="text-lg font-medium mb-3">Test Message Generator</h3>
      
      <div className="space-y-4">
        <div className="mb-2">
          <label htmlFor="title" className="block text-sm font-medium">Message Title</label>
          <input
            id="title"
            value={title}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
            disabled={isSubmitting}
            className="w-full p-2 mt-1 border rounded dark:bg-gray-700 dark:border-gray-600"
          />
        </div>
        
        <div className="mb-2">
          <label htmlFor="content" className="block text-sm font-medium">Message Content</label>
          <input
            id="content"
            value={content}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setContent(e.target.value)}
            disabled={isSubmitting}
            className="w-full p-2 mt-1 border rounded dark:bg-gray-700 dark:border-gray-600"
          />
        </div>
        
        <div className="mb-2">
          <label htmlFor="priority" className="block text-sm font-medium">Priority</label>
          <select 
            id="priority"
            value={priority} 
            onChange={handlePriorityChange}
            disabled={isSubmitting}
            className="w-full p-2 mt-1 border rounded dark:bg-gray-700 dark:border-gray-600"
          >
            <option value="info" className="text-blue-500">Info</option>
            <option value="warning" className="text-yellow-500">Warning</option>
            <option value="critical" className="text-red-500">Critical</option>
            <option value="announcement" className="text-purple-500">Announcement</option>
          </select>
        </div>
        
        <button 
          onClick={generateMessage}
          disabled={isSubmitting}
          className={`w-full p-2 text-white rounded ${getPriorityButtonClass(priority)} ${isSubmitting ? 'opacity-50' : ''}`}
        >
          {isSubmitting ? 'Creating...' : 'Generate Test Message'}
        </button>
        
        {lastAction && (
          <div className="mt-2 p-2 text-sm border rounded bg-gray-100 dark:bg-gray-700">
            {lastAction}
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function to set button style based on priority
function getPriorityButtonClass(priority: string): string {
  switch(priority) {
    case 'info':
      return 'bg-blue-500 hover:bg-blue-600';
    case 'warning':
      return 'bg-yellow-500 hover:bg-yellow-600 text-black';
    case 'critical':
      return 'bg-red-500 hover:bg-red-600';
    case 'announcement':
      return 'bg-purple-500 hover:bg-purple-600';
    default:
      return 'bg-blue-500 hover:bg-blue-600';
  }
}
