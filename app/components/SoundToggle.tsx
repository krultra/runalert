'use client';

import { useState, useEffect } from 'react';
import { soundService } from '../services/soundService';
import { Volume2, VolumeX, Bell, BellOff, AlertCircle } from 'lucide-react';

export function SoundToggle() {
  const [muted, setMuted] = useState(true); // Default to muted until user interaction
  const [alwaysPlayImportant, setAlwaysPlayImportant] = useState(true); // Default to always play important alerts
  
  useEffect(() => {
    // Initialize sound service when component mounts
    soundService.initialize();
    
    // Get the initial states
    setMuted(soundService.isMuted());
    setAlwaysPlayImportant(soundService.getAlwaysPlayImportant());
  }, []);
  
  const toggleSound = () => {
    const newMutedState = soundService.toggleMute();
    setMuted(newMutedState);
    
    // Demo sound when unmuting
    if (!newMutedState) {
      soundService.playSound('info');
    }
  };
  
  const toggleImportantAlerts = () => {
    const newState = soundService.toggleAlwaysPlayImportant();
    setAlwaysPlayImportant(newState);
    
    // Always play a demo of critical/warning sounds when toggling
    if (newState) {
      // Demo both sounds with a slight delay between them
      soundService.playSound('warning');
      setTimeout(() => {
        soundService.playSound('critical');
      }, 1000);
    } else {
      soundService.playSound('critical');
    }
  };
  
  return (
    <div className="flex items-center gap-1">
      {/* Important alerts toggle - shows different icons based on state */}
      <button 
        onClick={toggleImportantAlerts}
        className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        aria-label={alwaysPlayImportant ? "Disable important alert override" : "Enable important alert override"}
        title={alwaysPlayImportant ? "Critical & warning alerts will play even when muted" : "All alerts follow mute settings"}
      >
        {alwaysPlayImportant ? (
          <AlertCircle className="w-4 h-4 text-red-500" />
        ) : (
          <AlertCircle className="w-4 h-4 text-gray-500" />
        )}
      </button>
      
      {/* Regular sound toggle */}
      <button 
        onClick={toggleSound}
        className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        aria-label={muted ? "Enable notification sounds" : "Disable notification sounds"}
        title={muted ? "Enable notification sounds" : "Disable notification sounds"}
      >
        {muted ? (
          <VolumeX className="w-4 h-4 text-gray-500" />
        ) : (
          <Volume2 className="w-4 h-4 text-blue-500" />
        )}
      </button>
    </div>
  );
}
