"use client";
import React, { useState, useMemo, useEffect, useRef } from 'react';

// Import UI components - using relative paths
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

// Import WelcomeDialog - using correct import path
import dynamic from 'next/dynamic';

// Use dynamic import with no SSR to ensure client-side only rendering
const WelcomeDialog = dynamic(() => import("@/app/components/WelcomeDialog"), { ssr: false });

// Import ProtectedRoute for authentication
import ProtectedRoute from '@/app/components/auth/ProtectedRoute';

// Import icons
import { AlertOctagon, AlertTriangle, Bell, Eye, EyeOff, Info, CheckCircle2, ChevronDown, Clock, Circle, Filter, EyeOff as NoEye } from "lucide-react";

// Import auth context and firebase services
import { useAuth } from "@/app/contexts/AuthContext";
import { db } from "@/lib/firebase/config";
import { messageService, Message } from "@/lib/firebase/messages";
import { raceStatusService, RaceStatus } from "@/lib/firebase/raceStatus";
import { soundService } from "@/app/services/soundService";
import { 
  getFirestore, 
  collection, 
  query, 
  where, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  arrayUnion, 
  deleteDoc, 
  limit, 
  Timestamp 
} from "firebase/firestore";

// Import styles
import styles from './accordion-override.module.css';

// Import design system
import { colors, messagePriority } from "@/app/styles/design-system";

// Use the Message type from our Firebase service
interface LocalMessage extends Message {
  dismissed: boolean;
}

// Define message priority types for clarity
type MessagePriority = "info" | "warning" | "critical" | "announcement" | "normal";

// Define filter types
type FilterOption = {
  id: string;
  icon: React.ElementType;
  tooltip: string;
  active: boolean;
};

// Ensure types are compatible
type LocalMessagePriority = Message["priority"];

interface RaceStatusMessage {
  status: MessagePriority;
  message: string;
  timestamp: Date;
}

// Helper to get border color from messagePriority
const getPriorityBorderColor = (priority: MessagePriority): string => {
  // Default to normal if priority doesn't match
  return messagePriority[priority]?.border || messagePriority.normal.border;
};

// Define message priority and icon mapping using design system
const getPriorityIcon = (priority: MessagePriority) => {
  // Get icon configuration from the design system
  const iconConfig = messagePriority[priority] || messagePriority.normal;
  
  // Return appropriate icon component based on icon name
  switch (iconConfig.icon) {
    case 'info':
      return <Info className="h-5 w-5" style={{ color: iconConfig.iconColor }} />;
    case 'bell':
      return <Bell className="h-5 w-5" style={{ color: iconConfig.iconColor }} />;
    case 'alertTriangle':
      return <AlertTriangle className="h-5 w-5" style={{ color: iconConfig.iconColor }} />;
    case 'alertOctagon':
      return <AlertOctagon className="h-5 w-5" style={{ color: iconConfig.iconColor }} />;
    default:
      return <Info className="h-5 w-5" style={{ color: iconConfig.iconColor }} />;
  }
};

interface DemoMessage {
  id: string;
  title: string;
  content: string;
  priority: MessagePriority;
  timestamp: Date;
  dismissed?: boolean;
}

// Demo messages
const initialDemoMessages: DemoMessage[] = [
  {
    id: "1",
    title: "Weather Alert",
    content: "Strong winds expected in the afternoon.",
    priority: "warning",
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    dismissed: false,
  },
  {
    id: "2",
    title: "Course Change",
    content: "The course has been modified due to underwater obstacles.",
    priority: "warning",
    timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
    dismissed: false,
  },
  {
    id: "3",
    title: "Parking Information",
    content: "Overflow parking is available at Lot B.",
    priority: "info",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    dismissed: false,
  },
  {
    id: "4",
    title: "Emergency Evacuation Plan",
    content: "In case of emergency, please follow the marked evacuation routes.",
    priority: "critical",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
    dismissed: false,
  },
  {
    id: "5",
    title: "Post-Race Party",
    content: "Join us for the post-race party at the main tent!",
    priority: "normal",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8), // 8 hours ago
    dismissed: false,
  },
  {
    id: "6",
    title: "Course Modification",
    content: "The course has been modified due to trail conditions. See the map for details.",
    priority: "warning",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12), // 12 hours ago
    dismissed: false,
  },
  {
    id: "7",
    title: "Old Dismissed Message",
    content: "This is an old message that was dismissed some time ago.",
    priority: "normal",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
    dismissed: true,
  },
];

// Helper to format time (e.g., 14:30)
const formatTime = (date: Date) => {
  return new Intl.DateTimeFormat('default', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
};

function HomePageContent() {
  // State to track which message is currently open
  const [openItem, setOpenItem] = useState<string>("");
  // State for tracking opened messages  // Track read messages for this user
  const [readMessages, setReadMessages] = useState<Set<string>>(new Set<string>());
  const [pendingReadOperations, setPendingReadOperations] = useState<{messageId: string, userId: string}[]>([]);
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  // Message filter state with icon buttons
  const [filterOptions, setFilterOptions] = useState<FilterOption[]>([
    { id: 'hideRead', icon: NoEye, tooltip: 'Hide read info & announcement messages', active: false },
    { id: 'important', icon: AlertTriangle, tooltip: 'Show only warning & critical messages', active: false },
  ]);

  // Load pending operations and user preferences from localStorage on component mount
  useEffect(() => {
    try {
      // Load pending operations
      const storedOperations = localStorage.getItem('ra_pendingReadOperations');
      if (storedOperations) {
        const parsed = JSON.parse(storedOperations);
        if (Array.isArray(parsed) && parsed.length > 0) {
          console.log(`Loaded ${parsed.length} pending read operations from localStorage`);
          setPendingReadOperations(parsed);
          
          // Log that we found pending operations
          console.log('Found pending operations in localStorage, will process when connected');
        }
      }
      
      // Load filter options preferences
      try {
        const storedFilterOptions = localStorage.getItem('ra_filterOptions');
        if (storedFilterOptions) {
          const parsedOptions = JSON.parse(storedFilterOptions);
          if (Array.isArray(parsedOptions) && parsedOptions.length === 2) {
            setFilterOptions(options => options.map((option, index) => ({
              ...option,
              active: parsedOptions[index].active
            })));
          }
        }
      } catch (error) {
        console.error('Error parsing stored filter options:', error);
      }
    } catch (error) {
      console.error('Error loading user preferences from localStorage:', error);
    }
  }, []);
  // Track online/offline status with more reliable detection
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isReallyConnected, setIsReallyConnected] = useState(true); // Actual connection status from ping test
  const [isSyncing, setIsSyncing] = useState(false); // Track when sync is in progress
  const connectivityInterval = useRef<NodeJS.Timeout | null>(null);
  const { user } = useAuth();
  
  // Race status state from Firestore
  const [raceStatus, setRaceStatus] = useState<RaceStatus | null>(null);

  // Check if we're really connected by testing Firestore connectivity
  const checkRealConnectivity = async () => {
    try {
      // Try to access a public collection as a connectivity test
      const db = getFirestore();
      
      // Use the ra_messages collection which already exists and is readable by all users
      const messagesQuery = query(
        collection(db, "ra_messages"),
        limit(1) // Just get one message to minimize data transfer
      );
      
      // Just attempt the query - we don't care about results, just that it succeeds
      await getDocs(messagesQuery);
      
      // If we made it here, Firestore is accessible
      const wasOffline = !isReallyConnected;
      console.log('Firebase connectivity check: Connected');
      setIsReallyConnected(true);
      
      // Clear any existing interval since we're now online
      if (connectivityInterval.current) {
        clearInterval(connectivityInterval.current);
        connectivityInterval.current = null;
      }
    } catch (error) {
      // If we can't reach Firebase, we're offline
      console.log('Firebase connectivity check: Disconnected', error);
      setIsReallyConnected(false);
      
      // Start periodic connectivity checks if we aren't already checking
      if (!connectivityInterval.current) {
        connectivityInterval.current = setInterval(() => {
          checkRealConnectivity();
        }, 180000); // Check every 3 minutes when offline (reduced frequency)
      }
    }
  };
  
  // Keep track of online/offline status
  useEffect(() => {
    // Browser online/offline event handlers
    const handleOnline = () => {
      setIsOnline(true);
      // When we detect we're back online, verify with an active check
      checkRealConnectivity();
      // Process pending operations when back online
      if (user && pendingReadOperations.length > 0) {
        // Add a small delay to allow connectivity to stabilize
        setTimeout(() => {
          processPendingOperations();
        }, 1000);
      }
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setIsReallyConnected(false); // Immediately assume disconnected when browser says offline
    };
    
    // Check connectivity initially and process any pending operations
    const initialCheck = async () => {
      await checkRealConnectivity();
      
      // If we're connected and have pending operations, process them immediately
      if (isReallyConnected && user && pendingReadOperations.length > 0) {
        console.log('Initial load: Connected with pending operations - processing now');
        // Short delay to ensure everything is initialized
        setTimeout(() => {
          processPendingOperations();
        }, 2000);
      }
    };
    
    initialCheck();
    
    // Add event listeners for online/offline detection
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      // Clear interval if component unmounts
      if (connectivityInterval.current) {
        clearInterval(connectivityInterval.current);
      }
    };
  }, []);

  useEffect(() => {
    // Fetch messages from demo database...
    // Convert DemoMessage to LocalMessage type
    setMessages(initialDemoMessages.map(msg => ({
      ...msg,
      createdAt: new Date(msg.timestamp),
      dismissed: msg.dismissed || false,
      priority: msg.priority as LocalMessagePriority // Type assertion to make compatible
    })));
    
    // Read messages are now loaded in a separate useEffect with localStorage support
  }, [user]);

  // Subscribe to messages and race status when component mounts
  useEffect(() => {
    // Subscribe to messages
    const unsubscribeMessages = messageService.subscribeToMessages((newMessages: Message[]) => {
      const filteredMessages = newMessages.map((msg: Message) => ({
        ...msg,
        dismissed: user?.dismissedMessages?.includes?.(msg.id) ?? false
      } as LocalMessage));
      setMessages(filteredMessages);
    });
    
    // Subscribe to race status for the current event edition
    const unsubscribeRaceStatus = raceStatusService.subscribeToRaceStatus(
      'mmc-2025', // Current event edition ID
      setRaceStatus
    );
    
    // Initial fetch of messages
    messageService.getMessages().then((newMessages: Message[]) => {
      const filteredMessages = newMessages.map((msg: Message) => ({
        ...msg,
        dismissed: user?.dismissedMessages?.includes?.(msg.id) ?? false
      } as LocalMessage));
      setMessages(filteredMessages);
    });
    
    // Cleanup subscriptions on unmount
    return () => {
      unsubscribeMessages();
      unsubscribeRaceStatus();
    };
  }, [user]);

  // Process pending operations whenever we become connected or when pending operations change
  useEffect(() => {
    // If we're connected and have pending operations, process them
    if (isReallyConnected && user && pendingReadOperations.length > 0 && !isSyncing) {
      console.log('Connected with pending operations - processing now');
      // Add a small delay to ensure Firebase connection is fully established
      const timer = setTimeout(() => {
        // Double check conditions before processing
        if (isReallyConnected && user && pendingReadOperations.length > 0 && !isSyncing) {
          processPendingOperations();
        } else {
          console.log('Conditions changed, skipping automatic sync');
        }
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [isReallyConnected, user, pendingReadOperations.length, isSyncing]);

  // Load read message status from Firestore and localStorage
  useEffect(() => {
    const loadReadMessageStatus = async () => {
      // First, load from localStorage regardless of online status
      try {
        const storedReadMessages = localStorage.getItem('ra_readMessages');
        if (storedReadMessages) {
          const parsedData = JSON.parse(storedReadMessages);
          if (Array.isArray(parsedData)) {
            setReadMessages(new Set(parsedData));
          }
        }
      } catch (localError) {
        console.error("Error loading from localStorage:", localError);
      }

      // Then, if online and logged in, load from Firestore to get the latest
      if (!user || !isReallyConnected || !db) return;

      try {
        const q = query(
          collection(db, "ra_userMessageStatus"),
          where("userId", "==", user.uid)
        );

        const querySnapshot = await getDocs(q);
        const readMessageIds = new Set<string>();
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.messageId) {
            readMessageIds.add(data.messageId);
          }
        });
        
        // Merge with any local data to ensure we don't lose offline reads
        setReadMessages(prevReadMessages => {
          const merged = new Set([...prevReadMessages, ...readMessageIds]);
          
          // Update localStorage with the merged set
          localStorage.setItem('ra_readMessages', JSON.stringify([...merged]));
          
          return merged;
        });
      } catch (error) {
        console.error("Error loading read message status from Firestore:", error);
      }
    };
    
    loadReadMessageStatus();
  }, [user, isReallyConnected]);

  // Process any pending read operations that were queued during offline mode
  const processPendingOperations = async () => {
    console.log('processPendingOperations called with:', { 
      isReallyConnected, 
      user: !!user, 
      pendingOps: pendingReadOperations.length,
      isSyncing
    });
    if (!isReallyConnected || !user) {
      console.log('Cannot process operations: not connected or no user');
      return;
    }
    
    // Don't start if already syncing
    if (isSyncing) {
      console.log('Already syncing, skipping duplicate sync request');
      return;
    }
    
    // Set syncing state to true when we start processing
    setIsSyncing(true);
    console.log(`Processing ${pendingReadOperations.length} pending read operations`);
    
    // Create a copy to work with
    const operations = [...pendingReadOperations];
    
    // Clear the pending operations list immediately to prevent duplicate processing
    setPendingReadOperations([]);
    localStorage.removeItem('ra_pendingReadOperations');
    
    // Track successful operations
    let successCount = 0;
    let failCount = 0;
    
    try {
      // Process each operation
      for (const op of operations) {
        try {
          if (!db) {
            console.error('Firestore is not initialized');
            // Re-add operations to the queue if Firestore isn't available
            setPendingReadOperations(prev => [...prev, ...operations]);
            localStorage.setItem('ra_pendingReadOperations', JSON.stringify(operations));
            throw new Error('Firestore not initialized');
          }
          
          const statusId = `${op.userId}_${op.messageId}`;
          await setDoc(doc(db, 'ra_userMessageStatus', statusId), {
            userId: op.userId,
            messageId: op.messageId,
            opened: true,
            openedAt: Timestamp.now(),
          });
          successCount++;
          console.log(`Synced offline read status for message: ${op.messageId}`);
        } catch (error) {
          failCount++;
          console.error(`Failed to sync message status for ${op.messageId}:`, error);
          
          // Re-queue failed operations
          setPendingReadOperations(prev => [...prev, op]);
          
          // Update localStorage with the new pending operations
          const currentQueue = JSON.parse(localStorage.getItem('ra_pendingReadOperations') || '[]');
          currentQueue.push(op);
          localStorage.setItem('ra_pendingReadOperations', JSON.stringify(currentQueue));
        }
      }
    } finally {
      // Always set syncing to false when we're done, regardless of success or failure
      setIsSyncing(false);
      console.log(`Sync complete: ${successCount} operations succeeded, ${failCount} failed and requeued`);
      
      // Force a re-check of connectivity to update UI
      if (failCount > 0) {
        checkRealConnectivity();
      }
    }
  };

  // Update message read status in Firestore and localStorage
  const updateMessageReadStatus = async (messageId: string, userId: string) => {
    // Always update localStorage first (works offline)
    try {
      // Get current read messages from localStorage
      const storedReadMessages = localStorage.getItem('ra_readMessages') || '[]';
      const readMessageArray = JSON.parse(storedReadMessages);
      
      // Add this message if not already present
      if (!readMessageArray.includes(messageId)) {
        readMessageArray.push(messageId);
        localStorage.setItem('ra_readMessages', JSON.stringify(readMessageArray));
        console.log('Message read status saved to localStorage');
      }
    } catch (localError) {
      console.error("Error updating localStorage:", localError);
    }
    
    // Then try to update Firestore if we're online
    if (!isReallyConnected) {
      console.log('Offline: Queueing read status update for later sync');
      
      // Add to pending operations queue
      const newOperation = { messageId, userId };
      const updatedQueue = [...pendingReadOperations, newOperation];
      
      // Update state and localStorage
      setPendingReadOperations(updatedQueue);
      localStorage.setItem('ra_pendingReadOperations', JSON.stringify(updatedQueue));
      
      return;
    }
    
    try {
      if (!db) {
        console.error('Firestore is not initialized');
        return;
      }
      
      const statusId = `${userId}_${messageId}`;
      await setDoc(doc(db, 'ra_userMessageStatus', statusId), {
        userId,
        messageId,
        opened: true,
        openedAt: Timestamp.now(),
      });
      console.log('Message read status updated in Firestore');
    } catch (error) {
      console.error('Error updating message read status in Firestore:', error);
      // If Firestore update fails, we still have the local copy
    }
  };

  // Handle message dismissal and undismissal
  // Helper function for alert styling based on priority
  const getAlertClass = (priority: MessagePriority): string => {
    switch (priority) {
      case 'critical':
        return 'bg-destructive/15 border-destructive text-destructive';
      case 'warning':
        return 'bg-warning/15 border-warning text-warning';
      case 'info':
      default:
        return 'bg-primary/10 border-primary/20 text-primary';
    }
  };

  const toggleDismissed = async (id: string) => {
    if (!user?.uid) return;
    
    const message = messages.find(m => m.id === id) as LocalMessage;
    if (!message) return;

    if (!db) {
      console.error('Firestore is not initialized');
      return;
    }
    
    const userDocRef = doc(db, 'users', user.uid);

    try {
      if (message.dismissed) {
        // Undismiss - remove from dismissed list
        const currentDismissed = user.dismissedMessages || [];
        await updateDoc(userDocRef, {
          dismissedMessages: currentDismissed.filter((msgId: string) => msgId !== id)
        });

        // Update local state
        setMessages(messages.map(msg => 
          msg.id === id ? {...msg, dismissed: false} as LocalMessage : msg
        ));
      } else {
        // Dismiss - add to dismissed list
        await updateDoc(userDocRef, {
          dismissedMessages: arrayUnion(id)
        });

        // Update local state
        setMessages(messages.map(msg => 
          msg.id === id ? {...msg, dismissed: true} as LocalMessage : msg
        ));

        // Message will auto-close if dismissed since we're using key prop
        // to force remount of the accordion when messages change
      }
    } catch (error) {
      console.error("Error updating message status:", error);
    }
  };

  // Save filter options when they change
  useEffect(() => {
    try {
      const filterState = filterOptions.map(option => ({ id: option.id, active: option.active }));
      localStorage.setItem('ra_filterOptions', JSON.stringify(filterState));
    } catch (error) {
      console.error('Error saving filter options to localStorage:', error);
    }
  }, [filterOptions]);
  
  // Toggle filter option - each filter is independent
  const toggleFilter = (id: string) => {
    setFilterOptions(options => {
      return options.map(option => 
        option.id === id ? { ...option, active: !option.active } : option
      );
    });
  };

  const filteredMessages = useMemo(() => {
    // Filter messages based on current filter state
    return messages.filter(msg => {
      // Always filter out dismissed messages
      if (msg.dismissed) {
        return false;
      }
      
      const priority = msg.priority as MessagePriority;
      const isRead = readMessages.has(msg.id);
      const isInfo = priority === 'info' || priority === 'normal' || priority === 'announcement';
      const isImportant = priority === 'warning' || priority === 'critical';
      
      // Get current filter states
      const hideRead = filterOptions.find(o => o.id === 'hideRead')?.active || false;
      const onlyImportant = filterOptions.find(o => o.id === 'important')?.active || false;
      
      // Always show the currently open message regardless of filters
      if (msg.id === openItem) {
        return true;
      }
      
      // Apply filters
      if (onlyImportant) {
        return isImportant;
      }
      
      if (hideRead && isRead && isInfo) {
        return false;
      }
      
      return true;
    });
  }, [messages, filterOptions, readMessages, openItem]);



  return (
    <div className="container mx-auto max-w-2xl py-8 h-full overflow-y-auto">
      {/* Add WelcomeDialog for sound notification permissions */}
      <WelcomeDialog />
      {/* Enhanced connection status indicator with pending operations info */}
      <div className={`mb-4 py-1 px-3 rounded-md text-sm flex items-center justify-between ${isReallyConnected ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
        <div className="flex items-center">
          <div className={`w-3 h-3 rounded-full mr-2 ${isReallyConnected ? 'bg-green-500 dark:bg-green-400' : 'bg-amber-500 dark:bg-amber-400'}`}></div>
          <span className="font-medium">
            {isReallyConnected ? 'Connected' : 'Offline Mode'}
          </span>
        </div>
        <div>
          {!isReallyConnected && pendingReadOperations.length > 0 && (
            <span className="text-xs flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              {pendingReadOperations.length} pending {pendingReadOperations.length === 1 ? 'update' : 'updates'}
            </span>
          )}
          {!isReallyConnected && pendingReadOperations.length === 0 && (
            <span className="text-xs">Changes saved locally</span>
          )}
          {isSyncing && (
            <span className="text-xs flex items-center">
              <span className="inline-block h-3 w-3 mr-1 rounded-full border-2 border-t-transparent border-green-500 animate-spin"></span>
              Syncing...
            </span>
          )}
          {isReallyConnected && !isSyncing && pendingReadOperations.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-xs">Waiting to sync...</span>
              <button 
                onClick={() => processPendingOperations()} 
                className="text-xs bg-green-100 hover:bg-green-200 dark:bg-green-900 dark:hover:bg-green-800 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-sm"
                disabled={!isReallyConnected || isSyncing}
              >
                Sync now
              </button>
            </div>
          )}
          {isReallyConnected && !isSyncing && pendingReadOperations.length === 0 && (
            <span className="text-xs">All changes synced</span>
          )}
        </div>
      </div>
      {/* Race Status Message - Dynamic from Firestore */}
      {raceStatus ? (
        <Card className="mb-6 overflow-hidden border-2" 
              style={{
                borderColor: raceStatus.status === 'green' ? '#22c55e' : 
                             raceStatus.status === 'yellow' ? '#eab308' : 
                             '#ef4444'
              }}>
          <div className={`px-4 py-2 flex items-center justify-between ${
                raceStatus.status === 'green' ? 'bg-green-100 dark:bg-green-900/70' : 
                raceStatus.status === 'yellow' ? 'bg-yellow-100 dark:bg-yellow-900/70' : 
                'bg-red-100 dark:bg-red-900/70'
              }`}>
            <div className="flex items-center">
              {raceStatus.status === 'green' ? (
                <div className="relative">
                  <div className="absolute -left-1 -top-1 w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
                </div>
              ) : raceStatus.status === 'yellow' ? (
                <div className="relative">
                  <div className="absolute -left-1 -top-1 w-2 h-2 bg-yellow-500 rounded-full animate-ping"></div>
                  <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-2" />
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute -left-1 -top-1 w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
                  <AlertOctagon className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
                </div>
              )}
              <span className={`text-sm font-medium ${raceStatus.status === 'green' ? 'text-green-800 dark:text-green-300' : 
                                raceStatus.status === 'yellow' ? 'text-yellow-800 dark:text-yellow-300' : 
                                'text-red-800 dark:text-red-300'}`}>
                {raceStatus.title ? raceStatus.title : `Status: ${raceStatus.status.charAt(0).toUpperCase() + raceStatus.status.slice(1)}`}
              </span>
            </div>
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-2 ${raceStatus.status === 'green' ? 'bg-green-500' : 
                                raceStatus.status === 'yellow' ? 'bg-yellow-500' : 
                                'bg-red-500'}`}></div>
              <span className="text-xs text-muted-foreground">
                {formatTime(raceStatus.updatedAt)}
              </span>
            </div>
          </div>
          {raceStatus.content && (
            <CardContent className="max-h-32 overflow-y-auto p-4 bg-card">
              <p className="text-sm">{raceStatus.content}</p>
            </CardContent>
          )}
        </Card>
      ) : null}

      {/* Filter buttons - simplified to just icon buttons */}
      <div className="flex justify-end gap-3 mb-4 pt-2">
        {filterOptions.map((option) => (
          <Button
            key={option.id}
            variant={option.active ? "default" : "outline"}
            size="sm"
            className={`relative ${option.active ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-1 ring-offset-background' : 'bg-background hover:bg-muted text-foreground border-border'}`}
            title={option.tooltip}
            onClick={() => toggleFilter(option.id)}
          >
            {React.createElement(option.icon, { className: "h-4 w-4" })}
            {option.active && <span className="absolute -top-1 -right-1 flex h-3 w-3 rounded-full bg-green-500"></span>}
          </Button>
        ))}
      </div>

      {/* Use uncontrolled accordion with defaultValue to avoid controlled/uncontrolled error */}
      <div className="overflow-y-auto max-h-[60vh]">
        <Accordion 
          key={`message-accordion-${filteredMessages.length}`}
          type="single" 
          collapsible 
          defaultValue=""
          value={openItem}
          onValueChange={(value) => {
            // Keep track of which message is open
            setOpenItem(value || "");
            
            // Track read status when a message is opened
            if (value && user) {
              // Check if this is the first time reading this message
              const isFirstTimeReading = !readMessages.has(value);
              
              // Mark message as read in local state
              setReadMessages(prev => {
                const updated = new Set(prev);
                updated.add(value);
                return updated;
              });
              
              // Record read status in Firestore
              updateMessageReadStatus(value, user.uid);
              
              // Play the message-read sound if this is the first time reading
              if (isFirstTimeReading) {
                // Import dynamically to avoid SSR issues
                import('@/app/services/soundService').then(({ soundService }) => {
                  soundService.playSound('messageRead');
                });
              }
            }
          }} 
          className="w-full space-y-1">
        {filteredMessages.length > 0 ? filteredMessages.map((msg) => (
          <div key={msg.id} className="relative group">
            <AccordionItem 
              value={msg.id} 
              className={`${styles.accordionItem} border-l-4
                bg-background/80 hover:bg-accent/50 
                dark:bg-background/90 dark:hover:bg-accent/30
                rounded-md shadow-sm hover:shadow transition-colors`}
              style={{ borderLeftColor: getPriorityBorderColor(msg.priority as MessagePriority) }}
            >
              <div>
                <AccordionTrigger className={`${styles.customAccordionTrigger} flex-1 text-left ${styles.hideChevron}`}>
                  <div className="flex items-center w-full">
                    <div className="relative mr-2">
                      {!readMessages.has(msg.id) && (
                        <div className="absolute top-0 left-0 h-full w-1 bg-blue-500 dark:bg-blue-400 rounded-sm" style={{ zIndex: 50 }}></div>
                      )}
                      <div className={styles.iconContainer}>
                        {getPriorityIcon(msg.priority as MessagePriority)}
                      </div>
                    </div>
                    <div className="flex items-center flex-1">
                      <span className={`${styles.titleText} text-left text-primary dark:text-primary text-base`}>
                        {!readMessages.has(msg.id) ? <><span className="text-blue-500 dark:text-blue-400">• </span>{msg.title}</> : msg.title}
                      </span>
                    </div>
                    <time className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {formatTime(msg.createdAt)}
                    </time>
                  </div>
                </AccordionTrigger>
              </div>
              <AccordionContent>
                <div className="prose dark:prose-invert max-w-none prose-sm pl-[0.5rem]">
                  {msg.content}
                </div>
              </AccordionContent>
            </AccordionItem>
          </div>
        )) : (
          <Card className="p-6 text-center text-muted-foreground bg-card">
            <Info className="mx-auto h-10 w-10 mb-2 opacity-50" />
            No messages match the current filter.
          </Card>
        )}
        </Accordion>
      </div>
      <Separator className="my-8" />
    </div>
  );
}

// Export the page component with ProtectedRoute wrapper
export default function HomePage() {
  return (
    <ProtectedRoute>
      <HomePageContent />
    </ProtectedRoute>
  );
}
