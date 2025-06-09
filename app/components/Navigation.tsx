'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { signOut } from '@/lib/firebase/config';
import { useState, useEffect, useRef } from 'react';
import { colors } from '@/app/styles/design-system';
import styles from './navigation-override.module.css';
import { SoundToggle } from './SoundToggle';

export default function Navigation() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  // Check for user preference in localStorage, then system preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check localStorage first for user preference
      const storedTheme = localStorage.getItem('ra_theme');
      
      if (storedTheme) {
        // User has explicitly set a preference
        const isDarkMode = storedTheme === 'dark';
        setDarkMode(isDarkMode);
        
        // Apply dark mode class to html element
        if (isDarkMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      } else {
        // No stored preference, use system preference
        const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setDarkMode(isDarkMode);
        
        // Apply dark mode class to html element
        if (isDarkMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    }
    
    // We don't add a listener for system preference changes if the user has set a preference
    // Only listen for system changes if no user preference exists
    if (!localStorage.getItem('ra_theme')) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const updateDarkMode = () => {
        const isDarkMode = mediaQuery.matches;
        setDarkMode(isDarkMode);
        
        if (isDarkMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      };
      
      mediaQuery.addEventListener('change', updateDarkMode);
      return () => mediaQuery.removeEventListener('change', updateDarkMode);
    }
  }, []);
  
  // Add click outside listener to close menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    
    // Add event listener only when menu is open
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    // Cleanup
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

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
    
    // Store user preference in localStorage
    localStorage.setItem('ra_theme', newDarkMode ? 'dark' : 'light');
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
      <div className="flex items-center justify-between px-4" style={{ padding: '8px 16px', minHeight: '56px' }}>
        <div className="flex items-center" style={{ gap: '8px' }}>
          <Link href="/" className="flex-shrink-0 mr-1" style={{ height: '38px', width: '76px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img 
              src="/icons/thumbnail_MMC_logo_roed.png" 
              alt="RunAlert logo" 
              style={{ 
                height: '100%',
                width: 'auto',
                objectFit: 'contain'
              }} 
            />
          </Link>
          <span className="font-bold tracking-tight" style={{ fontFamily: 'Inter, Arial, sans-serif', fontSize: '2rem' }}>
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
          <button 
            onClick={() => setMenuOpen(!menuOpen)} 
            className="flex items-center justify-center w-10 h-10 rounded-md bg-foreground/5 hover:bg-foreground/10 dark:bg-background/10 dark:hover:bg-background/20 focus:outline-none" 
            aria-label="Toggle menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.navIcon}>
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="18" x2="20" y2="18" />
            </svg>
          </button>
          
          {/* Dropdown Menu */}
          {menuOpen && (
            <div ref={menuRef} className="fixed right-4 top-[56px] mt-1 w-64 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-50">
              {/* Sound Settings Section */}
              <div className="py-2">
                <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Sound Settings
                </div>
                
                {/* Sound Toggle Item */}
                <div className="mt-1 px-2">
                  <button
                    onClick={() => {
                      // Import dynamically to avoid SSR issues
                      import('../services/soundService').then(({ soundService }) => {
                        soundService.toggleMute();
                      });
                    }}
                    className="flex w-full items-center px-2 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                  >
                    <span className="mr-2">
                      {/* Sound icon - we'll use a simple speaker icon */}
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                      </svg>
                    </span>
                    Toggle Mute
                  </button>
                </div>
                
                {/* Important Alerts Override */}
                <div className="mt-1 px-2">
                  <button
                    onClick={() => {
                      // Import dynamically to avoid SSR issues
                      import('../services/soundService').then(({ soundService }) => {
                        soundService.toggleAlwaysPlayImportant();
                      });
                    }}
                    className="flex w-full items-center px-2 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                  >
                    <span className="mr-2">
                      {/* Alert icon */}
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </span>
                    Play Important Alerts When Muted
                  </button>
                </div>
                
                {/* Test Sound */}
                <div className="mt-1 px-2">
                  <button
                    onClick={() => {
                      // Import dynamically to avoid SSR issues  
                      import('../services/soundService').then(({ soundService }) => {
                        // Play all sounds with delay between them
                        soundService.playSound('info');
                        setTimeout(() => soundService.playSound('warning'), 1000);
                        setTimeout(() => soundService.playSound('critical'), 2000);
                        setTimeout(() => soundService.playSound('announcement'), 3000);
                      });
                    }}
                    className="flex w-full items-center px-2 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                  >
                    <span className="mr-2">
                      {/* Test icon */}
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                      </svg>
                    </span>
                    Test All Sounds
                  </button>
                </div>
              </div>
              
              {/* User Section */}
              <div className="border-t border-gray-100 dark:border-gray-700 py-2">
                <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  User
                </div>
              <div className="py-1">
                {user ? (
                  <button 
                    onClick={handleSignOut}
                    className="flex w-full px-4 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <svg className="mr-2 h-4 w-4" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Sign out
                  </button>
                ) : (
                  <Link 
                    href="/login"
                    className="flex w-full px-4 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <svg className="mr-2 h-4 w-4" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                      <polyline points="10 17 15 12 10 7" />
                      <line x1="15" y1="12" x2="3" y2="12" />
                    </svg>
                    Sign in
                  </Link>
                )}
              </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
