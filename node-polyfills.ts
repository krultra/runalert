// Polyfills for node: protocol imports
// This allows Node.js built-ins to work in the browser

// Add global browser polyfills
import 'buffer/';
import 'process/browser';
import 'util/';
import 'events/';

// Add these to the global scope
if (typeof window !== 'undefined') {
  // @ts-ignore
  window.Buffer = window.Buffer || require('buffer/').Buffer;
  // @ts-ignore
  window.process = window.process || require('process/browser');
  // @ts-ignore
  window.util = window.util || require('util/');
  // @ts-ignore
  window.events = window.events || require('events/');
}
