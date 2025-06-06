"use client";
import React, { useState, useMemo, useEffect } from 'react';

// Import UI components - using relative paths
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

// Import icons
import { AlertOctagon, AlertTriangle, Bell, Eye, EyeOff, Info, CheckCircle2 } from "lucide-react";

// Import auth context and firebase services
import { useAuth } from "@/app/contexts/AuthContext";
import { db } from "@/lib/firebase/config";
import { messageService, Message } from "@/lib/firebase/messages";
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';

// Import styles
import styles from "./accordion-override.module.css";


// Use the Message type from our Firebase service
interface LocalMessage extends Message {
  dismissed: boolean;
}

type MessagePriority = "info" | "normal" | "warning" | "critical";

interface RaceStatusMessage {
  status: MessagePriority;
  message: string;
  timestamp: Date;
}

// Define message priority and icon mapping
const getPriorityIcon = (priority: MessagePriority) => {
  switch (priority) {
    case "info":
      return <Info className="h-5 w-5 text-muted-foreground" />;
    case "normal":
      return <Bell className="h-5 w-5 text-primary" />;
    case "warning":
      return <AlertTriangle className="h-5 w-5 text-warning" />;
    case "critical":
      return <AlertOctagon className="h-5 w-5 text-destructive" />;
    default:
      return <Info className="h-5 w-5 text-muted-foreground" />;
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
  const [openItem, setOpenItem] = useState<string>("");
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

        // If the dismissed item was open, close it
        if (openItem === id) {
          setOpenItem("");
        }
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

      {/* Show/Hide Dismissed Button */}
      <div className="mb-4 flex justify-end">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setShowDismissed(!showDismissed)}
          className="whitespace-nowrap text-foreground"
        >
          {showDismissed ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
          {showDismissed ? "Hide Dismissed" : "Show Dismissed"} ({messages.filter(m => m.dismissed).length})
        </Button>
      </div>

      <Accordion type="single" collapsible value={openItem} onValueChange={setOpenItem} className="w-full">
        {filteredMessages.length > 0 ? filteredMessages.map((msg) => (
          <AccordionItem key={msg.id} value={msg.id}>
            <AccordionTrigger className={styles.accordionTriggerCustom}>
              <div className="flex items-center space-x-2">
                {getPriorityIcon(msg.priority as MessagePriority)}
                <span>{msg.title}</span>
              </div>
              <div className="flex items-center space-x-4">
                <time className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                  {formatTime(msg.createdAt)}
                </time>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                    e.stopPropagation();
                    toggleDismissed(msg.id);
                  }}
                  className="flex items-center space-x-1"
                >
                  {msg.dismissed ? (
                    <>
                      <Eye className="h-4 w-4" />
                      <span className="text-xs">Show</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="h-4 w-4" />
                      <span className="text-xs">Dismiss</span>
                    </>
                  )}
                </Button>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <Alert className={`${getAlertClass(msg.priority as MessagePriority)}`}>
                <div className="flex items-start space-x-2">
                  {getPriorityIcon(msg.priority as MessagePriority)}
                  <div>
                    <AlertTitle>{msg.title}</AlertTitle>
                    <AlertDescription>
                      {msg.content}
                    </AlertDescription>
                  </div>
                </div>
              </Alert>
            </AccordionContent>
          </AccordionItem>
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
