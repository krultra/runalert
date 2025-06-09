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
  async addMessage(message: Partial<Message>) {
    if (!db) {
      throw new Error('Firestore is not initialized');
    }
    
    try {
      // Always use current time for test messages to ensure accurate timestamps
      const now = new Date();
      
      // Create a new document with auto-generated ID
      const messagesRef = collection(db, 'ra_messages');
      const docRef = await addDoc(messagesRef, {
        ...message,
        // Ensure createdAt is always a fresh timestamp for test messages
        createdAt: now,
      });
      
      // Explicitly log the message details for debugging
      console.log('New test message created with ID:', docRef.id, {
        title: message.title,
        priority: message.priority,
        timestamp: now.toISOString()
      });
      
      // Debug helper: Clear this specific ID from local tracking to ensure proper detection
      try {
        if (typeof localStorage !== 'undefined') {
          const storedIds = localStorage.getItem('runalert-seen-message-ids');
          if (storedIds) {
            const idsArray = JSON.parse(storedIds);
            if (idsArray.includes(docRef.id)) {
              const newIds = idsArray.filter((id: string) => id !== docRef.id);
              localStorage.setItem('runalert-seen-message-ids', JSON.stringify(newIds));
              console.log(`[MessageService] Removed new message ID ${docRef.id} from localStorage tracking`);
            }
          }
        }
      } catch (e) {
        console.error('Error clearing message ID from tracking:', e);
      }
      
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
    
    // Initialize seen message IDs using localStorage to persist across refreshes
    let seenMessageIds: Set<string>;
    try {
      // Try to load previously seen messages from localStorage
      const storedIds = localStorage.getItem('runalert-seen-message-ids');
      
      // For debugging - let's clear the localStorage to ensure proper detection
      // Remove this line in production if needed
      localStorage.removeItem('runalert-seen-message-ids');
      
      seenMessageIds = storedIds ? new Set<string>(JSON.parse(storedIds)) : new Set<string>();
      console.log(`[MessageService] Loaded ${seenMessageIds.size} previously seen message IDs from storage`);
    } catch (error) {
      console.error('[MessageService] Error loading seen message IDs:', error);
      seenMessageIds = new Set<string>();
    }
    
    // Also track messages seen in this session separately
    let sessionMessageIds = new Set<string>();
    let isFirstLoad = true;
    let lastRefreshTime = Date.now();
    
    // Helper to save seen IDs to localStorage
    const saveSeenIds = (ids: Set<string>) => {
      try {
        localStorage.setItem('runalert-seen-message-ids', JSON.stringify([...ids]));
      } catch (error) {
        console.error('[MessageService] Error saving seen message IDs:', error);
      }
    };
    
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
            
            // Show all messages received for debugging
            console.log(`[MessageService] All messages: `, {
              count: messages.length,
              newest: messages.length > 0 ? {
                id: messages[0].id,
                title: messages[0].title,
                createdAt: messages[0].createdAt
              } : 'none'
            });
            
            // A message is considered new if:
            // 1. It's not in our long-term seen messages set OR
            // 2. It was received in the last 120 seconds (for tab switches/refreshes)
            const now = Date.now();
            const newMessages = messages.filter(msg => {
              // Debug per message (only for first few)
              if (messages.indexOf(msg) < 3) {
                console.log(`[MessageService] Checking message:`, {
                  id: msg.id,
                  title: msg.title,
                  inSeenSet: seenMessageIds.has(msg.id),
                  inSessionSet: sessionMessageIds.has(msg.id)
                });
              }
              
              // Check if it's genuinely a new message (never seen before)
              if (!seenMessageIds.has(msg.id)) {
                console.log(`[MessageService] New message detected (not in seen set):`, msg.id);
                return true;
              }
              
              // Check for recent messages (created in the last 120 seconds)
              if (msg.createdAt) {
                // Handle different timestamp formats
                let msgTimestamp: number | undefined;
                
                // Handle Firestore Timestamp object
                const createdAt = msg.createdAt as any;
                
                if (createdAt && typeof createdAt === 'object') {
                  // Firestore Timestamp with seconds field
                  if (createdAt.seconds && typeof createdAt.seconds === 'number') {
                    msgTimestamp = createdAt.seconds * 1000;
                  }
                  // Standard Date object
                  else if (createdAt instanceof Date) {
                    msgTimestamp = createdAt.getTime();
                  }
                }
                
                if (msgTimestamp) {
                  const ageMs = now - msgTimestamp;
                  const isRecent = ageMs < 120000; // 120 seconds (2 minutes)
                  const isNew = isRecent && !sessionMessageIds.has(msg.id);
                  
                  if (isNew) {
                    console.log(`[MessageService] Recent new message detected:`, {
                      id: msg.id,
                      ageSeconds: Math.round(ageMs/1000),
                      timestamp: new Date(msgTimestamp).toISOString()
                    });
                  }
                  
                  return isNew;
                }
              }
              
              return false;
            });
            
            // Add only true new messages to session tracking
            if (newMessages.length > 0) {
              console.log(`[MessageService] Adding ${newMessages.length} messages to tracking`);
              newMessages.forEach(msg => sessionMessageIds.add(msg.id));
            }
            
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
      
      // IMPORTANT: Only add IDs to the seenMessageIds AFTER we've checked for new messages
      // and triggered sound notifications. Otherwise we'll never detect new messages.
      if (!isFirstLoad) {
        // Update seen message IDs and refresh time
        const messageIds = messages.map(msg => msg.id);
        
        // For first-time users or when debugging, don't overload session storage
        // on the first load of a large message set
        messageIds.forEach(id => {
          seenMessageIds.add(id);
        });
        
        // Save to localStorage periodically (not on every update to reduce overhead)
        if (Math.random() < 0.2) { // ~20% chance to save on each update
          saveSeenIds(seenMessageIds);
        }
      }
      
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
