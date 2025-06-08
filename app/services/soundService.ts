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
  
  public playSound(priority: 'info' | 'warning' | 'critical' | 'announcement'): void {
    if (typeof window === 'undefined') return;
    if (!this.isInitialized) this.initialize();
    
    console.log(`Attempting to play ${priority} sound. Muted: ${this.muted}`);
    
    // Skip if muted EXCEPT for important alerts (critical, warning, announcement) when alwaysPlayImportant is true
    const isImportantAlert = priority === 'critical' || priority === 'warning' || priority === 'announcement';
    if (this.muted && !(isImportantAlert && this.alwaysPlayImportant)) {
      console.log(`Sound muted for ${priority} priority`);
      return;
    }
    
    const sound = this.sounds[priority];
    if (sound) {
      try {
        // Check if sound is loaded
        if (sound.readyState < 2) {
          console.warn(`Sound for ${priority} not fully loaded yet. Loading...`);
          sound.load();
        }
        
        // Stop and reset the sound before playing again
        sound.pause();
        sound.currentTime = 0;
        
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
        
        console.log(`Playing ${priority} sound at volume ${sound.volume}. Source: ${sound.src}`);
        
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
            }
          });
        }
      } catch (error) {
        console.error(`Error playing ${priority} sound:`, error);
      }
    } else {
      console.warn(`Sound for ${priority} priority not found`);
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
