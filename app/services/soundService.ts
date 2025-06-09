// Sound service for handling audio notifications
// Based on message priority levels: info, warning, critical, announcement

export class SoundService {
  private static instance: SoundService;
  private sounds: {
    info: HTMLAudioElement | null;
    warning: HTMLAudioElement | null;
    critical: HTMLAudioElement | null;
    announcement: HTMLAudioElement | null;
    messageRead: HTMLAudioElement | null;
  } = {
    info: null,
    warning: null,
    critical: null,
    announcement: null,
    messageRead: null
  };
  
  private isInitialized = false;
  private muted = false;
  private deviceMuted = false; // Track if device is likely muted
  
  // Local storage key for mute state
  private readonly MUTE_STATE_KEY = 'runalert-sound-muted';
  
  // Important messages (critical & warning) will still play sound regardless of mute setting
  private alwaysPlayImportant = true;
  
  // Define which message types should vibrate on mobile
  private vibrateOnMobile = {
    info: false,
    warning: true,
    critical: true,
    announcement: false,
    messageRead: false
  };
  
  // Define which message types should override device mute
  private overrideDeviceMute = {
    info: false,
    warning: true,
    critical: true,
    announcement: false,
    messageRead: false
  };
  
  // Track if we've had user interaction (required for sound in many browsers)
  private hasUserInteraction = false;
  
  // Queue for sounds that couldn't be played due to autoplay restrictions
  private pendingNotifications: Array<{priority: string, timestamp: number}> = [];
  
  private constructor() {
    // Private constructor for singleton pattern
    this.loadMuteState();
  }
  
  // Public methods to control mute state
  public isMuted(): boolean {
    return this.muted;
  }
  
  // Save mute state to localStorage
  private saveMuteState(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.MUTE_STATE_KEY, JSON.stringify(this.muted));
    }
  }
  
  // Load mute state from localStorage
  private loadMuteState(): void {
    if (typeof localStorage !== 'undefined') {
      try {
        const savedState = localStorage.getItem(this.MUTE_STATE_KEY);
        if (savedState !== null) {
          this.muted = JSON.parse(savedState);
          console.log(`[SoundService] Loaded mute state: ${this.muted}`);
        }
      } catch (e) {
        console.error('[SoundService] Error loading mute state:', e);
      }
    }
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
      
      // Try to detect if device is muted
      this.checkDeviceMuteState();
      
      // Create audio elements for each priority with correct file formats
      this.sounds = {
        info: new Audio('/sounds/notification-info.ogg'),
        warning: new Audio('/sounds/notification-warning.wav'),
        critical: new Audio('/sounds/notification-critical.ogg'),
        announcement: new Audio('/sounds/notification-announcement.wav'),
        messageRead: new Audio('/sounds/message-read.wav'),
      };
      
      // Set volume for each sound
      if (this.sounds.info) this.sounds.info.volume = 0.5;
      if (this.sounds.warning) this.sounds.warning.volume = 0.8;
      if (this.sounds.critical) this.sounds.critical.volume = 1.0;
      if (this.sounds.announcement) this.sounds.announcement.volume = 0.7;
      if (this.sounds.messageRead) this.sounds.messageRead.volume = 0.3; // Lower volume for message read sound
      
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
      const priorityOrder = { critical: 0, warning: 1, announcement: 2, info: 3, messageRead: 4 };
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
  private createSound(priority: 'info' | 'warning' | 'critical' | 'announcement' | 'messageRead'): HTMLAudioElement | null {
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
        case 'messageRead':
          src = '/sounds/message-read.wav';
          break;
      }
      
      // Create a new audio instance
      const sound = new Audio(src);
      
      // Set volume based on priority
      switch (priority) {
        case 'info':
          sound.volume = 0.5;
          break;
        case 'warning':
          sound.volume = 0.8;
          break;
        case 'critical':
          sound.volume = 1.0;
          break;
        case 'announcement':
          sound.volume = 0.7;
          break;
        case 'messageRead':
          sound.volume = 0.3; // Lower volume for message read sound
          break;
        default:
          sound.volume = 0.5;
      }
      
      return sound;
    } catch (error) {
      console.error(`Error creating sound for ${priority}:`, error);
      return null;
    }
  }
  
  // Check if device is likely muted (best effort)
  private checkDeviceMuteState(): void {
    try {
      if (typeof window === 'undefined') return;
      
      // Use the Web Audio API to detect if audio is likely muted
      if ('AudioContext' in window) {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        const audioContext = new AudioContext();
        
        // Check if the audio context is suspended (might indicate device is muted)
        if (audioContext.state === 'suspended') {
          console.log('[SoundService] AudioContext suspended, device might be muted');
          this.deviceMuted = true;
        } else {
          console.log('[SoundService] AudioContext state:', audioContext.state);
          this.deviceMuted = false;
        }
      }
      
      // Also check if we're on iOS (which often has silent mode enabled)
      if (typeof navigator !== 'undefined' && /iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        console.log('[SoundService] iOS device detected, checking for silent mode');
        // Unfortunately there's no direct API to check silent mode on iOS
        // We'll use a heuristic approach by trying to play a silent sound
        this.testSilentMode();
      }
    } catch (e) {
      console.warn('[SoundService] Error checking device mute state:', e);
    }
  }
  
  // Test if device is in silent mode (iOS specific)
  private testSilentMode(): void {
    try {
      const silentSound = new Audio();
      silentSound.volume = 0.01; // Nearly silent
      
      // Set up event listeners
      silentSound.onplay = () => {
        console.log('[SoundService] Silent test sound started playing');
      };
      
      silentSound.onerror = () => {
        console.log('[SoundService] Silent test sound failed to play, device might be muted');
        this.deviceMuted = true;
      };
      
      // Try to play the silent sound
      const playPromise = silentSound.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.log('[SoundService] Silent test sound failed:', error);
          this.deviceMuted = true;
        });
      }
    } catch (e) {
      console.warn('[SoundService] Error testing silent mode:', e);
    }
  }
  
  public playSound(priority: 'info' | 'warning' | 'critical' | 'announcement' | 'messageRead'): void {
    if (typeof window === 'undefined') return;
    if (!this.isInitialized) this.initialize();
    
    // Check device mute state before playing
    this.checkDeviceMuteState();
    
    // Create debugging status information
    const debugInfo = {
      timestamp: new Date().toISOString(),
      priority,
      muted: this.muted,
      deviceMuted: this.deviceMuted,
      alwaysPlayImportant: this.alwaysPlayImportant,
      hasUserInteraction: this.hasUserInteraction,
      deviceInfo: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      visibilityState: typeof document !== 'undefined' ? document.visibilityState : 'unknown',
      tabFocused: typeof document !== 'undefined' ? document.hasFocus() : 'unknown',
      audioContext: typeof window !== 'undefined' && 'AudioContext' in window ? 'supported' : 'not supported'
    };
    
    console.log(`[SoundService] Sound playback requested:`, debugInfo);
    
    // Check if this message type should override mute settings
    // ONLY warning and critical messages should override app mute
    const isImportantAlert = priority === 'critical' || priority === 'warning';
    
    // Check if this message type should override device mute
    const shouldOverrideDeviceMute = this.overrideDeviceMute[priority];
    
    // Skip sound playback if:
    // 1. App sound is muted AND either it's not important OR alwaysPlayImportant is false
    // OR
    // 2. Device is muted AND this message type shouldn't override device mute
    if ((this.muted && !(isImportantAlert && this.alwaysPlayImportant)) || 
        (this.deviceMuted && !shouldOverrideDeviceMute)) {
      
      console.log(`[SoundService] Sound muted for ${priority} priority. App muted: ${this.muted}, Device muted: ${this.deviceMuted}`);
      
      // For mobile devices, we might still want to vibrate for important alerts even when muted
      if (isImportantAlert && 
          typeof navigator !== 'undefined' && 
          /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) && 
          this.vibrateOnMobile[priority] && 
          'vibrate' in navigator) {
        
        try {
          // Use different vibration patterns based on priority
          if (priority === 'critical') {
            navigator.vibrate([200, 100, 200]); // Double vibration for critical
            console.log('Critical vibration pattern triggered (muted mode)');
          } else if (priority === 'warning') {
            navigator.vibrate(200); // Standard vibration for warning
            console.log('Warning vibration triggered (muted mode)');
          }
        } catch (e) {
          console.warn('Vibration failed:', e);
        }
      }
      
      // Don't proceed with sound playback
      return;
    }
    
    // Try two different approaches for better mobile compatibility
    this.playWithNewInstance(priority);
    
    // On mobile, also try to trigger a user gesture event to help with autoplay restrictions
    if (typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
      console.log('Mobile device detected, using secondary playback method');
      
      // Only vibrate for specific message types based on configuration
      if (this.vibrateOnMobile[priority] && 'vibrate' in navigator) {
        try {
          // Use different vibration patterns based on priority
          if (priority === 'critical') {
            navigator.vibrate([200, 100, 200]); // Double vibration for critical
            console.log('Critical vibration pattern triggered');
          } else if (priority === 'warning') {
            navigator.vibrate(200); // Standard vibration for warning
            console.log('Warning vibration triggered');
          }
        } catch (e) {
          console.warn('Vibration failed:', e);
        }
      } else {
        console.log(`Vibration skipped for ${priority} message type`);
      }
    }
  }
  
  // Separated method to play with a fresh audio instance
  private playWithNewInstance(priority: 'info' | 'warning' | 'critical' | 'announcement' | 'messageRead'): void {
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
  private queueSoundForLaterPlayback(priority: 'info' | 'warning' | 'critical' | 'announcement' | 'messageRead'): void {
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
  private showVisualNotification(priority: 'info' | 'warning' | 'critical' | 'announcement' | 'messageRead'): void {
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
      } else if (priority === 'messageRead') {
        bgColor = 'bg-green-500';
        icon = '📨';
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
  private tryFallbackPlayback(priority: 'info' | 'warning' | 'critical' | 'announcement' | 'messageRead'): void {
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
    this.saveMuteState();
    console.log(`[SoundService] Sound ${this.muted ? 'muted' : 'unmuted'}`);
    return this.muted;
  }
  
  public setMuted(muted: boolean): void {
    this.muted = muted;
    this.saveMuteState();
    console.log(`[SoundService] Sound ${muted ? 'muted' : 'unmuted'}`);
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
