import { db } from './config';
import { 
  collection, 
  query, 
  orderBy, 
  where, 
  getDocs, 
  onSnapshot,
  limit,
  Timestamp,
  DocumentData,
  QueryDocumentSnapshot
} from 'firebase/firestore';

// Message interface definition
export interface Message {
  id: string;
  title: string;
  content: string;
  priority: 'info' | 'warning' | 'critical';
  createdAt: Date;
}

// Utility function to convert Firestore data to Message type
const convertToMessage = (doc: QueryDocumentSnapshot<DocumentData>): Message => {
  const data = doc.data();
  return {
    id: doc.id,
    title: data.title,
    content: data.content,
    priority: data.priority as 'info' | 'warning' | 'critical',
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
