'use client';

import { useEffect, useState } from 'react';
import { messageService } from '@/app/services/firebase';
import { useAuth } from '@/app/contexts/AuthContext';

/**
 * This component subscribes to Firestore messages and ensures
 * notification sounds are played correctly. It's designed to be
 * included once in the application layout.
 */
export function MessageSubscriber() {
  const [initialized, setInitialized] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const { user, loading } = useAuth();
  
  useEffect(() => {
    // Only subscribe to messages if the user is authenticated
    if (!user || loading) {
      console.log('[MessageSubscriber] User not authenticated or still loading, skipping message subscription');
      return;
    }
    
    console.log('[MessageSubscriber] User authenticated, initializing message subscription...');
    
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
        console.log('[MessageSubscriber] Component unmounting, cleaning up...');
        unsubscribe();
        // No need to remove visibilityHandler as we're not setting it up in this component
      };
    } catch (error) {
      console.error('[MessageSubscriber] Error setting up message subscription:', error);
    }
  }, [user, loading]);
  
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
