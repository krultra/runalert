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
      this.sounds.warning = new Audio('/sounds/notification-warning.ogg');
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
      if (typeof document !== 'undefined') {
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
        };
        
        interactionEvents.forEach(event => {
          document.addEventListener(event, handleUserInteraction);
        });
      }
      
      this.isInitialized = true;
      // Default to unmuted for better user experience
      this.muted = false;
      console.log('Sound service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize sound service:', error);
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
          src = '/sounds/notification-warning.ogg';
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
        sound.onplay = () => console.log(`${priority} sound started playing`);
        sound.onended = () => console.log(`${priority} sound finished playing`);
        sound.onerror = (e) => console.error(`${priority} sound error:`, e);
        
        // Play immediately - using a new instance each time avoids issues with
        // multiple sounds playing at once or sounds not playing consistently
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
              console.warn(`Could not play ${priority} sound:`, error);
              if (!this.hasUserInteraction) {
                console.warn('This is likely because there has been no user interaction with the page yet.');
                console.warn('Browser autoplay policy requires user interaction before audio can play.');
                this.tryFallbackPlayback(priority);
              }
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
