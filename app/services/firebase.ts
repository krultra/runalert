import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  query, 
  orderBy, 
  where, 
  getDocs, 
  onSnapshot,
  limit,
  Timestamp,
  Firestore
} from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';

// Define message data structure
export interface Message {
  id: string;
  title: string;
  content: string;
  priority: 'info' | 'warning' | 'critical' | 'announcement';
  createdAt: Date;
  dismissed?: boolean;
}

// Initialize Firebase conditionally
let app: FirebaseApp | undefined;
let db: Firestore | undefined;
let auth: Auth | undefined;

// Check if we have the required environment variables
const hasRequiredConfig = process.env.NEXT_PUBLIC_FIREBASE_API_KEY && 
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

// Only initialize Firebase on the client side and when we have required config
if (typeof window !== 'undefined' && hasRequiredConfig) {
  try {
    // Firebase configuration
    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };

    // Initialize Firebase
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    db = getFirestore(app);
    auth = getAuth(app);
  } catch (error) {
    console.error('Error initializing Firebase:', error);
  }
}

// Utility function to convert Firestore data to Message type
const convertToMessage = (doc: any): Message => {
  const data = doc.data();
  return {
    id: doc.id,
    title: data.title,
    content: data.content,
    priority: data.priority,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
  };
};

// Message Service
export const messageService = {
  // Get all messages ordered by creation time
  async getMessages(): Promise<Message[]> {
    if (!db) {
      console.error('Firestore is not initialized');
      return [];
    }
    
    const messagesRef = collection(db, 'ra_messages');
    const q = query(
      messagesRef,
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(convertToMessage);
  },

  // Get messages with filters
  async getFilteredMessages(filters: {
    priority?: 'info' | 'warning' | 'critical';
    limit?: number;
  }): Promise<Message[]> {
    if (!db) {
      console.error('Firestore is not initialized');
      return [];
    }
    
    const messagesRef = collection(db, 'ra_messages');
    let q = query(messagesRef, orderBy('createdAt', 'desc'));

    if (filters.priority) {
      q = query(q, where('priority', '==', filters.priority));
    }

    if (filters.limit) {
      q = query(q, limit(filters.limit));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(convertToMessage);
  },

  // Subscribe to real-time message updates
  subscribeToMessages(onMessage: (messages: Message[]) => void, playSound = true) {
    if (!db) {
      console.error('Firestore is not initialized');
      // Return a no-op unsubscribe function
      return () => {};
    }
    
    // Keep track of seen message IDs to detect new ones
    let seenMessageIds = new Set<string>();
    let isFirstLoad = true;
    
    const messagesRef = collection(db, 'ra_messages');
    const q = query(messagesRef, orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(convertToMessage);
      onMessage(messages);
      
      // Handle sound notifications for new messages, but skip the first load
      if (playSound && !isFirstLoad) {
        try {
          // Import sound service dynamically to avoid SSR issues
          import('./soundService').then((soundModule) => {
            // Use the updated playSoundForPriority function that supports all priority types
            const { playSoundForPriority } = soundModule;
            // Find messages that weren't in the previous set
            const newMessages = messages.filter(msg => !seenMessageIds.has(msg.id));
            
            // Play sound for highest priority new message
            if (newMessages.length > 0) {
              // Determine highest priority message (critical > announcement > warning > info)
              const priorityOrder = { 'critical': 4, 'announcement': 3, 'warning': 2, 'info': 1 };
              const highestPriorityMsg = newMessages.reduce((highest, current) => {
                const currentPriority = priorityOrder[current.priority] || 0;
                const highestPriority = priorityOrder[highest.priority] || 0;
                return currentPriority > highestPriority ? current : highest;
              }, newMessages[0]);
              
              // Play the appropriate sound
              playSoundForPriority(highestPriorityMsg.priority);
            }
          }).catch(err => {
            console.error('Failed to load sound service:', err);
          });
        } catch (error) {
          console.error('Error playing notification sound:', error);
        }
      }
      
      // Update seen message IDs
      seenMessageIds = new Set(messages.map(msg => msg.id));
      isFirstLoad = false;
    });
  },
};
