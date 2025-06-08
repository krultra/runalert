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
      // Create audio elements for each priority
      this.sounds.info = new Audio('/sounds/notification-info.mp3');
      this.sounds.warning = new Audio('/sounds/notification-warning.mp3');
      this.sounds.critical = new Audio('/sounds/notification-critical.mp3');
      this.sounds.announcement = new Audio('/sounds/notification-announcement.mp3');
      
      // Preload sounds
      Object.values(this.sounds).forEach(sound => {
        if (sound) {
          sound.preload = 'auto';
          sound.load();
        }
      });
      
      this.isInitialized = true;
      console.log('Sound service initialized');
    } catch (error) {
      console.error('Failed to initialize sound service:', error);
    }
  }
  
  public playSound(priority: 'info' | 'warning' | 'critical' | 'announcement'): void {
    if (typeof window === 'undefined') return;
    if (!this.isInitialized) this.initialize();
    
    // Skip if muted EXCEPT for important alerts (critical, warning, announcement) when alwaysPlayImportant is true
    const isImportantAlert = priority === 'critical' || priority === 'warning' || priority === 'announcement';
    if (this.muted && !(isImportantAlert && this.alwaysPlayImportant)) {
      return;
    }
    
    const sound = this.sounds[priority];
    if (sound) {
      try {
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
        
        // Play the appropriate sound for the priority
        const playPromise = sound.play();
        
        // Handle promise rejection (may occur if user hasn't interacted with page yet)
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.warn('Could not play sound notification:', error);
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
