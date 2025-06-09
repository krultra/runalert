// Sound service for handling audio notifications
// Based on message priority levels: info, warning, critical, announcement

export class SoundService {
  private static instance: SoundService;
  private sounds: Record<string, HTMLAudioElement | null> = {
    info: null,
    warning: null, 
    critical: null,
    announcement: null
  };
  
  private isInitialized = false;
  private muted = false;
  
  // Important messages (critical & warning) will still play sound regardless of mute setting
  private alwaysPlayImportant = true;
  
  // Track if we've had user interaction (required for sound in many browsers)
  private hasUserInteraction = false;
  
  // Queue for sounds that couldn't be played due to autoplay restrictions
  private pendingNotifications: Array<{priority: string, timestamp: number}> = [];
  
  private constructor() {
    // Private constructor for singleton pattern
  }
  
  public static getInstance(): SoundService {
    if (!SoundService.instance) {
      SoundService.instance = new SoundService();
    }
    return SoundService.instance;
  }
  
  public initialize(): void {
    if (typeof window === 'undefined') return;
    
    // Only initialize once
    if (this.isInitialized) return;
    
    try {
      console.log('Initializing sound service...');
      
      // Create audio elements for each priority with correct file formats
      this.sounds.info = new Audio('/sounds/notification-info.ogg');
      this.sounds.warning = new Audio('/sounds/notification-warning.wav');
      this.sounds.critical = new Audio('/sounds/notification-critical.ogg');
      this.sounds.announcement = new Audio('/sounds/notification-announcement.wav');
      
      // Preload sounds
      Object.values(this.sounds).forEach(sound => {
        if (sound) {
          sound.preload = 'auto';
          sound.load();
          
          // Add error handler to diagnose issues
          sound.onerror = (e) => {
            console.error(`Error loading sound:`, e);
          };
          
          // Log when sounds are ready to play
          sound.oncanplaythrough = () => {
            console.log(`Sound ready: ${sound.src}`);
          };
        }
      });
      
      // Set up event listeners for user interaction
      if (typeof document !== 'undefined' && typeof window !== 'undefined') {
        const interactionEvents = ['click', 'touchstart', 'keydown'];
        const handleUserInteraction = () => {
          this.hasUserInteraction = true;
          console.log('User interaction detected, sounds can now play');
          // Remove listeners after first interaction
          interactionEvents.forEach(event => {
            document.removeEventListener(event, handleUserInteraction);
          });
          
          // Try to play a silent sound to unlock audio
          this.unlockAudio();
          
          // Play any pending notifications
          this.playPendingNotifications();
        };
        
        // Listen for standard interaction events
        interactionEvents.forEach(event => {
          document.addEventListener(event, handleUserInteraction);
        });
        
        // Listen for our custom event from WelcomeDialog
        window.addEventListener('userInteractionDetected', () => {
          console.log('[SoundService] Received userInteractionDetected event');
          handleUserInteraction();
        });
      }
      
      this.isInitialized = true;
      // Default to unmuted for better user experience
      this.muted = false;
      
      // Load any pending notifications from localStorage
      this.loadPendingNotifications();
      
      console.log('Sound service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize sound service:', error);
    }
  }
  
  // Load pending notifications from localStorage
  private loadPendingNotifications(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        const pendingNotifications = localStorage.getItem('runalert-pending-sounds');
        if (pendingNotifications) {
          this.pendingNotifications = JSON.parse(pendingNotifications);
          console.log(`[SoundService] Loaded ${this.pendingNotifications.length} pending notifications`);
        }
      }
    } catch (e) {
      console.error('Error loading pending notifications:', e);
    }
  }
  
  // Save pending notifications to localStorage
  private savePendingNotifications(): void {
    try {
      if (typeof localStorage !== 'undefined' && this.pendingNotifications.length > 0) {
        localStorage.setItem('runalert-pending-sounds', JSON.stringify(this.pendingNotifications));
      } else if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('runalert-pending-sounds');
      }
    } catch (e) {
      console.error('Error saving pending notifications:', e);
    }
  }
  
  // Play pending notifications
  public playPendingNotifications(): void {
    if (!this.hasUserInteraction || this.pendingNotifications.length === 0) return;
    
    console.log(`[SoundService] Playing ${this.pendingNotifications.length} pending notifications`);
    
    // Sort by priority first (critical first), then by timestamp (oldest first)
    const sortedNotifications = [...this.pendingNotifications].sort((a, b) => {
      const priorityOrder = { critical: 0, warning: 1, announcement: 2, info: 3 };
      const priorityA = priorityOrder[a.priority as keyof typeof priorityOrder] || 999;
      const priorityB = priorityOrder[b.priority as keyof typeof priorityOrder] || 999;
      
      // First by priority
      if (priorityA !== priorityB) return priorityA - priorityB;
      
      // Then by timestamp (oldest first)
      return a.timestamp - b.timestamp;
    });
    
    // Play highest priority notification first
    if (sortedNotifications.length > 0) {
      const notification = sortedNotifications[0];
      console.log(`[SoundService] Playing queued sound: ${notification.priority}`);
      this.playSound(notification.priority as any);
      
      // Remove this notification from the queue
      this.pendingNotifications = this.pendingNotifications.filter(n => 
        n.priority !== notification.priority || n.timestamp !== notification.timestamp
      );
      
      // Save updated queue
      this.savePendingNotifications();
    }
  }
  
  // Function to unlock audio playback on iOS/Safari
  private unlockAudio(): void {
    try {
      // Create and play a short silent sound
      const unlockSound = new Audio();
      unlockSound.play().then(() => {
        console.log('Audio unlocked successfully');
      }).catch(err => {
        console.warn('Could not unlock audio:', err);
      });
    } catch (e) {
      console.warn('Audio unlock attempt failed:', e);
    }
  }
  
  // Create a separate sound instance for each play to avoid conflicts
  private createSound(priority: 'info' | 'warning' | 'critical' | 'announcement'): HTMLAudioElement | null {
    if (typeof window === 'undefined') return null;
    
    try {
      // Get the appropriate source file based on priority
      let src = '';
      switch (priority) {
        case 'info':
          src = '/sounds/notification-info.ogg';
          break;
        case 'warning':
          src = '/sounds/notification-warning.wav';
          break;
        case 'critical':
          src = '/sounds/notification-critical.ogg';
          break;
        case 'announcement':
          src = '/sounds/notification-announcement.wav';
          break;
      }
      
      // Create a new audio instance
      const sound = new Audio(src);
      
      // Set volume based on priority
      if (priority === 'critical') {
        sound.volume = 1.0; // Maximum volume for critical
      } else if (priority === 'warning') {
        sound.volume = 0.9; // High volume for warnings
      } else if (priority === 'announcement') {
        sound.volume = 0.95; // Very high volume for announcements
      } else {
        sound.volume = 0.7; // Moderate volume for info
      }
      
      return sound;
    } catch (error) {
      console.error(`Error creating sound for ${priority}:`, error);
      return null;
    }
  }
  
  public playSound(priority: 'info' | 'warning' | 'critical' | 'announcement'): void {
    if (typeof window === 'undefined') return;
    if (!this.isInitialized) this.initialize();
    
    // Create debugging status information
    const debugInfo = {
      timestamp: new Date().toISOString(),
      priority,
      muted: this.muted,
      alwaysPlayImportant: this.alwaysPlayImportant,
      hasUserInteraction: this.hasUserInteraction,
      deviceInfo: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      visibilityState: typeof document !== 'undefined' ? document.visibilityState : 'unknown',
      tabFocused: typeof document !== 'undefined' ? document.hasFocus() : 'unknown',
      audioContext: typeof window !== 'undefined' && 'AudioContext' in window ? 'supported' : 'not supported'
    };
    
    console.log(`[SoundService] Sound playback requested:`, debugInfo);
    
    // Skip if muted EXCEPT for important alerts (critical, warning, announcement) when alwaysPlayImportant is true
    const isImportantAlert = priority === 'critical' || priority === 'warning' || priority === 'announcement';
    if (this.muted && !(isImportantAlert && this.alwaysPlayImportant)) {
      console.log(`[SoundService] Sound muted for ${priority} priority. Override enabled: ${this.alwaysPlayImportant}`);
      return;
    }
    
    // Try two different approaches for better mobile compatibility
    this.playWithNewInstance(priority);
    
    // On mobile, also try to trigger a user gesture event to help with autoplay restrictions
    if (typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
      console.log('Mobile device detected, using secondary playback method');
      // Trigger vibration on supporting devices (provides feedback even when sound fails)
      if ('vibrate' in navigator) {
        try {
          navigator.vibrate(200); // 200ms vibration
          console.log('Vibration triggered');
        } catch (e) {
          console.warn('Vibration failed:', e);
        }
      }
    }
  }
  
  // Separated method to play with a fresh audio instance
  private playWithNewInstance(priority: 'info' | 'warning' | 'critical' | 'announcement'): void {
    // Create a fresh audio instance for this play (avoids conflicts between rapid plays)
    const sound = this.createSound(priority);
    
    if (sound) {
      try {        
        // Add event listeners for better debugging
        sound.onplay = () => {
          console.log(`${priority} sound started playing`);
        };
        
        sound.onended = () => {
          console.log(`${priority} sound finished playing`);
        };
        
        sound.onerror = (e) => {
          console.error(`Error with ${priority} sound:`, e);
        };
        
        console.log(`Playing ${priority} sound at volume ${sound.volume}. Source: ${sound.src}`);
        
        // Force load before play for better mobile compatibility
        sound.load();
        
        // Play the sound with a small delay to ensure it's loaded
        setTimeout(() => {
          // Play the appropriate sound for the priority
          const playPromise = sound.play();
          
          // Handle promise rejection (may occur if user hasn't interacted with page yet)
          if (playPromise !== undefined) {
            playPromise.then(() => {
              console.log(`${priority} sound played successfully`);
            }).catch(error => {
              console.error(`Could not play ${priority} sound: ${error}`);
              console.log('This is likely because there has been no user interaction with the page yet.');
              console.log('Browser autoplay policy requires user interaction before audio can play.');
              
              // Queue the notification for later
              this.queueSoundForLaterPlayback(priority);
              
              // Also try fallback playback
              console.log('Attempting fallback audio playback');
              this.tryFallbackPlayback(priority);
            });
          }
        }, 50); // Small delay to ensure sound is ready
      } catch (error) {
        console.error(`Error playing ${priority} sound:`, error);
        this.tryFallbackPlayback(priority);
      }
    } else {
      console.warn(`Sound for ${priority} priority could not be created`);
    }
  }
  
  // Queue sound for later playback when user interacts
  private queueSoundForLaterPlayback(priority: 'info' | 'warning' | 'critical' | 'announcement'): void {
    // Add to pending notifications queue
    this.pendingNotifications.push({
      priority,
      timestamp: Date.now()
    });
    
    // Save to localStorage
    this.savePendingNotifications();
    
    console.log(`[SoundService] Queued ${priority} sound for later playback`);
    
    // Show visual notification
    this.showVisualNotification(priority);
  }
  
  // Show a visual notification when audio can't play
  private showVisualNotification(priority: 'info' | 'warning' | 'critical' | 'announcement'): void {
    if (typeof document === 'undefined') return;
    
    try {
      // Create notification element
      const notificationEl = document.createElement('div');
      
      // Set styles based on priority
      let bgColor = 'bg-blue-500';
      let icon = '🔔';
      
      if (priority === 'critical') {
        bgColor = 'bg-red-500';
        icon = '🚨';
      } else if (priority === 'warning') {
        bgColor = 'bg-yellow-500';
        icon = '⚠️';
      } else if (priority === 'announcement') {
        bgColor = 'bg-purple-500';
        icon = '📢';
      }
      
      // Apply Tailwind classes
      notificationEl.className = `fixed bottom-4 right-4 ${bgColor} text-white p-4 rounded-lg shadow-lg flex items-center gap-2 z-50 animate-fade-in`;
      notificationEl.innerHTML = `
        <div class="text-xl">${icon}</div>
        <div>
          <div class="font-semibold">New ${priority} notification</div>
          <div class="text-sm">Click anywhere to enable sound</div>
        </div>
      `;
      
      // Add to document
      document.body.appendChild(notificationEl);
      
      // Auto dismiss after 5 seconds
      setTimeout(() => {
        notificationEl.classList.add('opacity-0');
        notificationEl.style.transition = 'opacity 0.5s';
        setTimeout(() => {
          if (notificationEl.parentNode) {
            notificationEl.parentNode.removeChild(notificationEl);
          }
        }, 500);
      }, 5000);
    } catch (e) {
      console.error('Error showing visual notification:', e);
    }
  }
  
  // Try alternative audio playback approach for mobile
  private tryFallbackPlayback(priority: 'info' | 'warning' | 'critical' | 'announcement'): void {
    try {
      console.log('Attempting fallback audio playback');
      // Create an AudioContext (Web Audio API approach - better mobile compatibility)
      if (typeof window !== 'undefined' && 'AudioContext' in window) {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        const audioContext = new AudioContext();
        audioContext.resume().then(() => {
          console.log('AudioContext resumed, attempting fallback playback');
          // Use an oscillator as a fallback sound
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          // Configure sound based on priority
          if (priority === 'critical') {
            oscillator.frequency.value = 880; // A5
            gainNode.gain.value = 0.3;
          } else if (priority === 'warning') {
            oscillator.frequency.value = 659.25; // E5
            gainNode.gain.value = 0.25;
          } else if (priority === 'announcement') {
            oscillator.frequency.value = 783.99; // G5
            gainNode.gain.value = 0.28;
          } else {
            oscillator.frequency.value = 440; // A4
            gainNode.gain.value = 0.2;
          }
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          // Play a short beep
          oscillator.start();
          setTimeout(() => {
            oscillator.stop();
            console.log('Fallback sound completed');
          }, 300); // 300ms beep
        }).catch(error => {
          console.error('Failed to resume AudioContext:', error);
        });
      }
    } catch (e) {
      console.error('Fallback audio playback failed:', e);
    }
  }
  
  public toggleMute(): boolean {
    this.muted = !this.muted;
    console.log(`Sound ${this.muted ? 'muted' : 'unmuted'}`);
    return this.muted;
  }
  
  public setMuted(muted: boolean): void {
    this.muted = muted;
  }
  
  public isMuted(): boolean {
    return this.muted;
  }
  
  public toggleAlwaysPlayImportant(): boolean {
    this.alwaysPlayImportant = !this.alwaysPlayImportant;
    return this.alwaysPlayImportant;
  }
  
  public setAlwaysPlayImportant(value: boolean): void {
    this.alwaysPlayImportant = value;
  }
  
  public getAlwaysPlayImportant(): boolean {
    return this.alwaysPlayImportant;
  }
  
  // Legacy methods renamed for backward compatibility
  public toggleAlwaysPlayCritical(): boolean {
    return this.toggleAlwaysPlayImportant();
  }
  
  public setAlwaysPlayCritical(value: boolean): void {
    this.setAlwaysPlayImportant(value);
  }
  
  public getAlwaysPlayCritical(): boolean {
    return this.getAlwaysPlayImportant();
  }
}

// Export a singleton instance
export const soundService = SoundService.getInstance();

// Export a function to play sounds for messages
export function playSoundForPriority(priority: 'info' | 'warning' | 'critical' | 'announcement'): void {
  soundService.playSound(priority);
}
