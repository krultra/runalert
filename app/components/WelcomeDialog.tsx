'use client';

import React, { useState, useEffect } from 'react';
import styles from './WelcomeDialog.module.css';

export default function WelcomeDialog() {
  // Start with dialog open by default for blocking behavior
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    // For development purposes, force reset the welcome status
    if (typeof localStorage !== 'undefined') {
      console.log('Resetting runalert-welcomed localStorage to ensure dialog appears');
      localStorage.removeItem('runalert-welcomed');
    }
    
    // Check if user has already seen the welcome dialog
    const hasSeenWelcome = localStorage.getItem('runalert-welcomed') === 'true';
    console.log('hasSeenWelcome status:', hasSeenWelcome);
    
    // Only show if they haven't seen it yet
    if (hasSeenWelcome) {
      console.log('User has seen welcome dialog before, not showing');
      setIsOpen(false);
    } else {
      console.log('User has NOT seen welcome dialog, showing it');
      // Prevent scrolling on body while modal is open
      if (typeof document !== 'undefined') {
        document.body.style.overflow = 'hidden';
      }
    }
    
    // Also check if we have pending notification permissions
    try {
      if ('Notification' in window && Notification.permission === 'default') {
        setIsOpen(true);
      }
    } catch (e) {
      console.log('Notification API not supported');
    }
    
    return () => {
      // Re-enable scrolling when component unmounts
      if (typeof document !== 'undefined') {
        document.body.style.overflow = '';
      }
    };
  }, []);

  const handleClose = () => {
    // Mark as seen
    try {
      localStorage.setItem('runalert-welcomed', 'true');
    } catch (e) {
      console.error('Could not set localStorage item', e);
    }
    
    // Re-enable scrolling
    if (typeof document !== 'undefined') {
      document.body.style.overflow = '';
    }
    
    // Initialize audio context if needed
    try {
      // Trigger a "user gesture" to initialize audio
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (audioContext.state !== 'running') {
        audioContext.resume();
      }
      
      // Also try to play a silent sound to initialize audio
      const audio = new Audio();
      audio.volume = 0.01; // Nearly silent
      audio.play().catch(e => console.log('Silent audio init failed, but OK:', e));
      
      // Dispatch a custom event that our sound service can listen for
      window.dispatchEvent(new CustomEvent('userInteractionDetected'));
    } catch (e) {
      console.log('Could not initialize audio:', e);
    }
    
    // Try to request notification permissions if needed
    try {
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
    } catch (e) {
      console.log('Could not request notification permission:', e);
    }
    
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Solid background overlay with custom CSS */}
      <div className={styles.backdrop} aria-hidden="true"></div>
      
      {/* Modal content with custom CSS */}
      <div className={styles.modalContainer}>
        <div className={styles.modalContent}>
          <h2 className={styles.title}>Welcome to RunAlert</h2>
          <p className={styles.text}>
            Keep this page active to receive notifications as soon as they are published. 
            Sound alerts will help you stay informed about important updates.
          </p>
          <div className={styles.buttonContainer}>
            <button
              onClick={handleClose}
              className={styles.button}
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
