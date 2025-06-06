'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { signOut } from '@/lib/firebase/config';
import { useState, useEffect } from 'react';
import { colors } from '@/app/styles/design-system';
import styles from './navigation-override.module.css';

export default function Navigation() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(false);
  
  // Check for system preference on initial load and add listener for changes
  useEffect(() => {
    // Function to update based on preference
    const updateDarkMode = () => {
      if (typeof window !== 'undefined') {
        const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setDarkMode(isDarkMode);
        
        // Apply dark mode class to html element
        if (isDarkMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    };
    
    // Initial check
    updateDarkMode();
    
    // Listen for changes in preference
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', updateDarkMode);
    
    // Cleanup
    return () => mediaQuery.removeEventListener('change', updateDarkMode);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Failed to sign out', error);
    }
  };

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    
    // Update the HTML class for dark mode
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Don't show navigation on auth pages
  const isAuthPage = ['/login', '/signup', '/forgot-password'].some(path => 
    typeof window !== 'undefined' && window.location.pathname.startsWith(path)
  );

  if (isAuthPage || loading) {
    return null;
  }

  return (
    <header className="bg-white dark:bg-gray-900 w-full border-b border-gray-200 dark:border-gray-800 app-header" style={{ marginBottom: '16px' }}>
      <div className="flex items-center justify-between px-4 py-3 h-16" style={{ padding: '16px' }}>
        <div className="flex items-center" style={{ gap: '16px' }}>
          <Link href="/" className="flex-shrink-0 mr-3 w-8 h-8" style={{ maxWidth: '32px', maxHeight: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img 
              src="/icons/krultraRA-192x192.png" 
              alt="RunAlert logo" 
              style={{ 
                width: '100%', 
                height: '100%', 
                maxWidth: '32px', 
                maxHeight: '32px', 
                objectFit: 'contain'
              }} 
            />
          </Link>
          <span className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
            <span className="text-foreground">Run</span>
            <span className="text-destructive">Alert</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          {/* Dark Mode Toggle */}
          <button 
            onClick={toggleDarkMode} 
            className="flex items-center justify-center w-10 h-10 rounded-md bg-foreground/5 hover:bg-foreground/10 dark:bg-background/10 dark:hover:bg-background/20 focus:outline-none" 
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.sunIcon}>
                <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2" fill="currentColor" />
                <path d="M12 2V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M12 20V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M4 12H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M22 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M19.8 4.2L17.7 6.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M6.3 17.7L4.2 19.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M19.8 19.8L17.7 17.7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M6.3 6.3L4.2 4.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.navIcon}>
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="currentColor" />
              </svg>
            )}
          </button>
          
          {/* Menu Button */}
          <button className="flex items-center justify-center w-10 h-10 rounded-md bg-foreground/5 hover:bg-foreground/10 dark:bg-background/10 dark:hover:bg-background/20 focus:outline-none" aria-label="Open menu">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.navIcon}>
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="18" x2="20" y2="18" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
