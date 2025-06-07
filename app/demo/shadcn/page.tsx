"use client";
import React, { useState, useMemo, useEffect } from 'react';

// Import UI components - using relative paths
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

// Import icons
import { AlertOctagon, AlertTriangle, Bell, Eye, EyeOff, Info, CheckCircle2, ChevronDown } from "lucide-react";

// Import auth context and firebase services
import { useAuth } from "@/app/contexts/AuthContext";
import { db } from "@/lib/firebase/config";
import { messageService, Message } from "@/lib/firebase/messages";
import { collection, deleteDoc, doc, getDocs, query, setDoc, where, Timestamp, updateDoc, arrayUnion } from 'firebase/firestore';

// Import styles
import styles from "./accordion-override.module.css";

// Import design system
import { colors, messagePriority } from "@/app/styles/design-system";

// Use the Message type from our Firebase service
interface LocalMessage extends Message {
  dismissed: boolean;
}

// Define message priority types for clarity
type MessagePriority = "info" | "warning" | "critical" | "announcement" | "normal";

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

export default function ShadcnDemoPage() {
  // State to track which message is currently open
  const [openItem, setOpenItem] = useState<string>("");
  // State for tracking opened messages
  const [readMessages, setReadMessages] = useState<Set<string>>(new Set());
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [showDismissed, setShowDismissed] = useState<boolean>(false);
  const { user } = useAuth();
  
  // Race status state - will come from Firebase in the future
  const [raceStatus, setRaceStatus] = useState<RaceStatusMessage>({
    status: "normal",
    message: "All systems operational. The race is proceeding as planned.",
    timestamp: new Date()
  });

  useEffect(() => {
    // Fetch messages from demo database...
    // Convert DemoMessage to LocalMessage type
    setMessages(initialDemoMessages.map(msg => ({
      ...msg,
      createdAt: new Date(msg.timestamp),
      dismissed: msg.dismissed || false,
      priority: msg.priority as LocalMessagePriority // Type assertion to make compatible
    })));
    
    // Load previously read messages for this user
    if (user) {
      loadReadMessageStatus(user.uid);
    }
  }, [user]);

  useEffect(() => {
    const unsubscribe = messageService.subscribeToMessages((newMessages: Message[]) => {
      const filteredMessages = newMessages.map((msg: Message) => ({
        ...msg,
        dismissed: user?.dismissedMessages?.includes?.(msg.id) ?? false
      } as LocalMessage));
      setMessages(filteredMessages);
    });
    
    messageService.getMessages().then((newMessages: Message[]) => {
      const filteredMessages = newMessages.map((msg: Message) => ({
        ...msg,
        dismissed: user?.dismissedMessages?.includes?.(msg.id) ?? false
      } as LocalMessage));
      setMessages(filteredMessages);
    });
    
    return () => unsubscribe();
  }, [user]);

  // Load read message status from Firestore
  const loadReadMessageStatus = async (userId: string) => {
    try {
      const readStatusRef = collection(db, 'ra_userMessageStatus');
      const q = query(readStatusRef, where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      
      const readMsgs = new Set<string>();
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.messageId) {
          readMsgs.add(data.messageId);
        }
      });
      
      setReadMessages(readMsgs);
    } catch (error) {
      console.error('Error loading read message status:', error);
    }
  };
  
  // Update message read status in Firestore
  const updateMessageReadStatus = async (messageId: string, userId: string) => {
    try {
      const statusId = `${userId}_${messageId}`;
      await setDoc(doc(db, 'ra_userMessageStatus', statusId), {
        userId,
        messageId,
        opened: true,
        openedAt: Timestamp.now(),
      });
      console.log('Message read status updated');
    } catch (error) {
      console.error('Error updating message read status:', error);
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

  const filteredMessages = useMemo(() => {
    // Filter messages by dismissed status only
    return messages.filter((msg) => showDismissed || !msg.dismissed);
  }, [messages, showDismissed]);



  return (
    <div className="container mx-auto max-w-2xl py-8">
      {/* Race Status Message */}
      <Card className="mb-6 bg-card overflow-hidden">
        <div className={`px-4 py-1 flex items-center justify-between ${raceStatus.status === 'normal' ? 'bg-green-100 dark:bg-green-900' : 
                         raceStatus.status === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900' : 
                         'bg-red-100 dark:bg-red-900'}`}>
          <div className="flex items-center">
            {raceStatus.status === 'normal' ? (
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
            ) : raceStatus.status === 'warning' ? (
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-2" />
            ) : (
              <AlertOctagon className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
            )}
            <span className={`text-sm font-medium ${raceStatus.status === 'normal' ? 'text-green-800 dark:text-green-300' : 
                              raceStatus.status === 'warning' ? 'text-yellow-800 dark:text-yellow-300' : 
                              'text-red-800 dark:text-red-300'}`}>
              Race Status: {raceStatus.status.charAt(0).toUpperCase() + raceStatus.status.slice(1)}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            {formatTime(raceStatus.timestamp)}
          </span>
        </div>
        <CardContent className="max-h-32 overflow-y-auto p-4">
          <p className="text-sm">{raceStatus.message}</p>
        </CardContent>
      </Card>

      <div className="mb-4">
        <h2 className="text-2xl font-bold tracking-tight">Messages</h2>
      </div>

      {/* Use uncontrolled accordion with defaultValue to avoid controlled/uncontrolled error */}
      <Accordion 
        key={`message-accordion-${filteredMessages.length}`}
        type="single" 
        collapsible 
        defaultValue=""
        onValueChange={(value) => {
          // Keep track of which message is open
          setOpenItem(value || "");
          
          // Track read status when a message is opened
          if (value && user) {
            // Mark message as read in local state
            setReadMessages(prev => {
              const updated = new Set(prev);
              updated.add(value);
              return updated;
            });
            
            // Record read status in Firestore
            updateMessageReadStatus(value, user.uid);
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
                    <div className={styles.iconContainer}>
                      {getPriorityIcon(msg.priority as MessagePriority)}
                    </div>
                    <span className={`${styles.titleText} flex-1 text-left text-primary dark:text-primary text-base ${!readMessages.has(msg.id) ? 'font-bold' : 'font-normal'}`}>
                      {msg.title}
                    </span>
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
      <Separator className="my-8" />
      <Button variant="secondary" className="w-full mt-4" onClick={() => window.location.href = '/dashboard'}>Back to Dashboard</Button>
    </div>
  );
}
