import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, signInWithEmailAndPassword, signOut, User } from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  Timestamp, 
  Firestore, 
  where, 
  getDocs, 
  addDoc,
  updateDoc,
  limit,
  DocumentData,
  enableIndexedDbPersistence, 
  CACHE_SIZE_UNLIMITED, 
  initializeFirestore, 
  persistentLocalCache, 
  persistentSingleTabManager 
} from 'firebase/firestore';

// Define message data structure
export interface Message {
  id: string;
  title: string;
  content: string;
  priority: 'info' | 'warning' | 'critical' | 'announcement';
  createdAt: Date;
  dismissed?: boolean;
}

// Check if we have the required environment variables
const hasRequiredConfig = process.env.NEXT_PUBLIC_FIREBASE_API_KEY && 
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

// Only initialize Firebase if it hasn't been initialized yet
let app: FirebaseApp | undefined;
let db: Firestore | undefined;
let auth: Auth | undefined;

try {
  // Check if Firebase has already been initialized
  if (!getApps().length) {
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
    app = initializeApp(firebaseConfig);
    
    // Enhanced Firestore initialization for better PWA performance
    // Use persistent cache with optimized settings for PWA
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentSingleTabManager({ forceOwnership: true }),
        cacheSizeBytes: CACHE_SIZE_UNLIMITED
      })
    });
    
    // Enable offline persistence for PWA
    if (typeof window !== 'undefined') {
      enableIndexedDbPersistence(db).catch((err) => {
        console.warn('Persistence could not be enabled:', err.code);
      });
    }
    
    console.log('Firebase initialized successfully with PWA optimizations');
    
    // Set up visibility and online status listeners for PWA
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      // Handle page visibility changes
      document.addEventListener('visibilitychange', () => {
        console.log('Visibility change event:', document.visibilityState);
      });
      
      // Handle online/offline status
      window.addEventListener('online', () => {
        console.log('App is online, reconnecting to Firestore');
      });
      
      window.addEventListener('offline', () => {
        console.log('App is offline, Firestore will use cached data');
      });
    }
    
    auth = getAuth(app);
  } else {
    app = getApps()[0];
    db = getFirestore(app);
    auth = getAuth(app);
    console.log('Using existing Firebase instance');
  }
} catch (error) {
  console.error('Error initializing Firebase:', error);
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

  // Add a new message to the database (useful for testing)
  async addMessage(message: { title: string; content: string; priority: string; createdAt: Date }): Promise<string> {
    if (!db) throw new Error('Firestore is not initialized');
    
    try {
      // Create a new message document
      const messagesRef = collection(db, 'ra_messages');
      const docRef = await addDoc(messagesRef, {
        title: message.title,
        content: message.content,
        priority: message.priority,
        createdAt: Timestamp.fromDate(message.createdAt),
        dismissed: false
      });
      
      console.log('New test message created with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error adding message:', error);
      throw error;
    }
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

  // Subscribe to real-time message updates with PWA optimizations
  subscribeToMessages(onMessage: (messages: Message[]) => void, playSound = true) {
    if (!db) {
      console.error('Firestore is not initialized');
      // Return a no-op unsubscribe function
      return () => {};
    }
    
    console.log('Setting up message subscription with enhanced PWA support');
    
    // Keep track of seen message IDs to detect new ones
    let seenMessageIds = new Set<string>();
    let isFirstLoad = true;
    let lastRefreshTime = Date.now();
    
    // Function to manually check for updates (used for PWA background recovery)
    const checkForUpdates = async () => {
      try {
        if (!db) return;
        
        console.log('Manually checking for message updates');
        const messagesRef = collection(db, 'ra_messages');
        const q = query(messagesRef, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        const messages = snapshot.docs.map(convertToMessage);
        
        // Process new messages
        const newMessages = messages.filter(msg => !seenMessageIds.has(msg.id));
        if (newMessages.length > 0) {
          console.log('Manual check found new messages:', newMessages.length);
          onMessage(messages);
          seenMessageIds = new Set(messages.map(msg => msg.id));
        }
      } catch (error) {
        console.error('Error in manual message check:', error);
      }
    };
    
    // Setup visibility change handler for PWA
    const visibilityHandler = () => {
      if (document.visibilityState === 'visible') {
        const timeSinceLastRefresh = Date.now() - lastRefreshTime;
        // If it's been more than 30 seconds since last refresh when coming back to the app
        if (timeSinceLastRefresh > 30000) {
          console.log('App became visible after inactivity, checking for updates');
          checkForUpdates();
          lastRefreshTime = Date.now();
        }
      }
    };
    
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', visibilityHandler);
    }
    
    // Setup regular snapshot listener
    const messagesRef = collection(db, 'ra_messages');
    const q = query(messagesRef, orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(convertToMessage);
      onMessage(messages);
      
      // Handle sound notifications for new messages, but skip the first load
      if (playSound && !isFirstLoad) {
        try {
          // Import sound service dynamically to avoid SSR issues
          console.log('[MessageService] Importing sound service for new messages...');
          import('./soundService').then((soundModule) => {
            // Get the SoundService instance
            const { soundService } = soundModule;
            
            // Find messages that weren't in the previous set
            const newMessages = messages.filter(msg => !seenMessageIds.has(msg.id));
            
            // Log detailed information for debugging
            console.log(`[MessageService] Found ${newMessages.length} new messages:`, 
              newMessages.map(m => ({ id: m.id, title: m.title, priority: m.priority })));
            console.log(`[MessageService] Document visibility: ${document.visibilityState}`);
            console.log(`[MessageService] Browser tab focused: ${document.hasFocus() ? 'Yes' : 'No'}`);
            console.log(`[MessageService] Device type: ${/iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop'}`);
            
            // Play sound for highest priority new message
            if (newMessages.length > 0) {
              // Determine highest priority message (critical > announcement > warning > info)
              const priorityOrder = { 'critical': 4, 'announcement': 3, 'warning': 2, 'info': 1 };
              const highestPriorityMsg = newMessages.reduce((highest, current) => {
                const currentPriority = priorityOrder[current.priority] || 0;
                const highestPriority = priorityOrder[highest.priority] || 0;
                return currentPriority > highestPriority ? current : highest;
              }, newMessages[0]);
              
              // Log which sound we're trying to play
              console.log(`[MessageService] Playing sound for highest priority: ${highestPriorityMsg.priority}`);
              console.log(`[MessageService] Sound details:`, {
                messageId: highestPriorityMsg.id,
                messageTitle: highestPriorityMsg.title,
                priority: highestPriorityMsg.priority,
                timestamp: new Date().toISOString()
              });
              
              // Play the appropriate sound
              soundService.playSound(highestPriorityMsg.priority || 'info');
            }
          }).catch(err => {
            console.error('[MessageService] Failed to load sound service:', err);
          });
        } catch (error) {
          console.error('[MessageService] Error playing notification sound:', error);
        }
      } else {
        console.log(`[MessageService] Skipping sound playback:`, 
          isFirstLoad ? 'First load' : 'Sound playback disabled');
      }
      
      // Update seen message IDs and refresh time
      seenMessageIds = new Set(messages.map(msg => msg.id));
      isFirstLoad = false;
      lastRefreshTime = Date.now();
    });
    
    // Return an enhanced unsubscribe function that also removes visibility listener
    return () => {
      unsubscribe();
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', visibilityHandler);
      }
    };
  },
};
