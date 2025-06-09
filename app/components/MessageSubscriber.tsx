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
          },
          checkMessages: () => {
            console.log('[DEBUG] Manually checking for new messages...');
            messageService.getMessages().then(messages => {
              console.log(`[DEBUG] Found ${messages.length} messages`);
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
        
        // Listen for service worker messages
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          console.log('[MessageSubscriber] Setting up service worker message listener');
          
          navigator.serviceWorker.addEventListener('message', (event) => {
            console.log('[MessageSubscriber] Received message from service worker:', event.data);
            
            if (event.data && event.data.type === 'CHECK_MESSAGES') {
              console.log('[MessageSubscriber] Service worker requested message check');
              
              // Force a refresh of messages
              messageService.getMessages().then(messages => {
                console.log(`[MessageSubscriber] Background check found ${messages.length} messages`);
                
                // Trigger the same handling as a regular update
                setMessageCount(messages.length);
                
                // Add DOM event for debugging message arrivals
                const event = new CustomEvent('messagesUpdated', { 
                  detail: { 
                    count: messages.length, 
                    timestamp: new Date(),
                    source: 'service-worker'
                  } 
                });
                window.dispatchEvent(event);
                
                // Check for new messages that need sound notifications
                import('@/app/services/soundService').then(({ soundService }) => {
                  // Play sound for highest priority message if not muted
                  if (!soundService.isMuted()) {
                    const priorities = ['critical', 'warning', 'announcement', 'info'] as const;
                    for (const priority of priorities) {
                      const matchingMsg = messages.find(m => m.priority === priority as any);
                      if (matchingMsg) {
                        console.log(`[MessageSubscriber] Playing sound for ${priority} message from background check`);
                        soundService.playSound(priority as 'info' | 'warning' | 'critical' | 'announcement');
                        break;
                      }
                    }
                  }
                });
              });
            }
          });
        }
      }
      
      // Request notification permission if not already granted
      if ('Notification' in window) {
        if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
          Notification.requestPermission().then(permission => {
            console.log(`[MessageSubscriber] Notification permission: ${permission}`);
          });
        }
      }
      
      return () => {
        console.log('[MessageSubscriber] Component unmounting, cleaning up...');
        unsubscribe();
        
        // Remove service worker message listener if it exists
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.removeEventListener('message', () => {});
        }
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
      checkMessages: () => void;
    };
  }
}
