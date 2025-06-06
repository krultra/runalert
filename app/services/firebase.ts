import { initializeApp, getApps } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  query, 
  orderBy, 
  where, 
  getDocs, 
  onSnapshot,
  limit,
  Timestamp
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Define message data structure
export interface Message {
  id: string;
  title: string;
  content: string;
  priority: 'info' | 'warning' | 'critical';
  createdAt: Date;
  dismissed?: boolean;
}

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
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app);
export const auth = getAuth(app);

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
  subscribeToMessages(onMessage: (messages: Message[]) => void) {
    const messagesRef = collection(db, 'ra_messages');
    const q = query(messagesRef, orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(convertToMessage);
      onMessage(messages);
    });
  },
};
