'use client';

// Import polyfills before any other code
import 'buffer/';
import 'process/browser';
import 'util/';
import 'events/';

// Make them available globally
if (typeof window !== 'undefined') {
  window.Buffer = window.Buffer || require('buffer/').Buffer;
  window.process = window.process || require('process/browser');
  window.util = window.util || require('util/');
  window.events = window.events || require('events/');
  
  // Explicitly handle node: protocol imports
  // This monkey-patches require to handle node: scheme
  const originalRequire = window.require;
  if (originalRequire) {
    window.require = function(path) {
      if (path.startsWith('node:')) {
        const moduleName = path.substring(5);
        switch (moduleName) {
          case 'process': return require('process/browser');
          case 'buffer': return require('buffer/');
          case 'util': return require('util/');
          case 'events': return require('events/');
          case 'stream': return require('stream-browserify');
          case 'crypto': return require('crypto-browserify');
          case 'path': return require('path-browserify');
          case 'os': return require('os-browserify/browser');
          default: return originalRequire(path);
        }
      }
      return originalRequire(path);
    };
  }
}

// This file is imported by layout.tsx as a client component

// Export a dummy component to ensure this is loaded as a client component
export default function NodePolyfills() {
  return null;
}
