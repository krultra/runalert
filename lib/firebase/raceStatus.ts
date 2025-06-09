'use client';

import { db } from './config';
import { 
  collection, 
  query, 
  where, 
  doc, 
  getDoc, 
  getDocs, 
  onSnapshot,
  orderBy,
  limit,
  Timestamp,
  DocumentData
} from 'firebase/firestore';

export interface RaceStatus {
  eventEditionId: string;
  status: 'green' | 'yellow' | 'red';
  updatedAt: Date;
  title?: string;
  content?: string;
}

// Convert Firestore document to RaceStatus object
const convertToRaceStatus = (doc: DocumentData): RaceStatus => {
  const data = doc.data();
  return {
    eventEditionId: data.eventEditionId,
    status: data.status,
    updatedAt: data.updatedAt?.toDate() || new Date(),
    title: data.title || '',
    content: data.content || '',
  };
};

class RaceStatusService {
  // Get the latest race status for a specific event edition
  async getRaceStatus(eventEditionId: string): Promise<RaceStatus | null> {
    try {
      if (!db) {
        console.error('Firestore instance not initialized');
        return null;
      }
      
      const q = query(
        collection(db, 'ra_raceStatus'),
        where('eventEditionId', '==', eventEditionId),
        orderBy('updatedAt', 'desc'),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }
      
      return convertToRaceStatus(querySnapshot.docs[0]);
    } catch (error) {
      console.error('Error getting race status:', error);
      return null;
    }
  }

  // Subscribe to race status updates for a specific event edition
  subscribeToRaceStatus(
    eventEditionId: string,
    onStatusUpdate: (status: RaceStatus | null) => void
  ) {
    try {
      if (!db) {
        console.error('Firestore instance not initialized');
        onStatusUpdate(null);
        return () => {};
      }
      
      const q = query(
        collection(db, 'ra_raceStatus'),
        where('eventEditionId', '==', eventEditionId),
        orderBy('updatedAt', 'desc'),
        limit(1)
      );
      
      return onSnapshot(q, (snapshot) => {
        if (snapshot.empty) {
          onStatusUpdate(null);
          return;
        }
        
        const raceStatus = convertToRaceStatus(snapshot.docs[0]);
        onStatusUpdate(raceStatus);
      });
    } catch (error) {
      console.error('Error subscribing to race status:', error);
      onStatusUpdate(null);
      return () => {}; // Return empty unsubscribe function
    }
  }
}

export const raceStatusService = new RaceStatusService();
