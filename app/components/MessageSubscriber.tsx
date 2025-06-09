'use client';

import { useEffect, useState } from 'react';
import { messageService } from '@/app/services/firebase';

/**
 * This component subscribes to Firestore messages and ensures
 * notification sounds are played correctly. It's designed to be
 * included once in the application layout.
 */
export function MessageSubscriber() {
  const [initialized, setInitialized] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  
  useEffect(() => {
    console.log('[MessageSubscriber] Component mounted, initializing message subscription...');
    
    try {
      // Subscribe to messages and play sounds
      const unsubscribe = messageService.subscribeToMessages(
        (messages) => {
          console.log(`[MessageSubscriber] Received message update with ${messages.length} messages`);
          setMessageCount(messages.length);
          
          // Add DOM event for debugging message arrivals
          const event = new CustomEvent('messagesUpdated', { 
            detail: { count: messages.length, timestamp: new Date() } 
          });
          window.dispatchEvent(event);
        },
        true // Enable sound playback
      );
      
      setInitialized(true);
      console.log('[MessageSubscriber] Message subscription initialized successfully');
      
      // Set up a global message debugger
      if (typeof window !== 'undefined') {
        window.__runalert_debug = {
          lastMessageUpdate: null,
          messageCount: 0,
          checkSound: () => {
            console.log('[DEBUG] Testing sound playback...');
            import('@/app/services/soundService').then(({ soundService }) => {
              soundService.playSound('info');
              console.log('[DEBUG] Sound test triggered');
            });
          }
        };
        
        // Listen for our own message updates
        window.addEventListener('messagesUpdated', (e: any) => {
          console.log('[MessageSubscriber] Message update event detected:', e.detail);
          if (window.__runalert_debug) {
            window.__runalert_debug.lastMessageUpdate = e.detail.timestamp;
            window.__runalert_debug.messageCount = e.detail.count;
          }
        });
      }
      
      return () => {
        console.log('[MessageSubscriber] Component unmounting, cleaning up subscription');
        unsubscribe();
      };
    } catch (err) {
      console.error('[MessageSubscriber] Error setting up message subscription:', err);
      return () => {}; // Return empty cleanup function
    }
  }, []);
  
  return null; // This component doesn't render anything visually
}

// Add global type definition for our debug helper
declare global {
  interface Window {
    __runalert_debug?: {
      lastMessageUpdate: Date | null;
      messageCount: number;
      checkSound: () => void;
    };
  }
}
