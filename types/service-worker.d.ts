// Type definitions for Service Worker Background Sync API
interface SyncManager {
  register(tag: string): Promise<void>;
  getTags(): Promise<string[]>;
}

interface ServiceWorkerRegistration {
  sync: SyncManager;
  pushManager: PushManager;
}

interface WindowEventMap {
  'message': MessageEvent;
}

// Extend the Window interface to include SyncManager
interface Window {
  SyncManager: SyncManager;
}
