const fs = require('fs');
const { createCanvas } = require('canvas');

// Create a canvas
const canvas = createCanvas(64, 64);
const ctx = canvas.getContext('2d');

// Fill background
ctx.fillStyle = '#000000';
ctx.fillRect(0, 0, 64, 64);

// Add text
ctx.fillStyle = '#ffffff';
ctx.font = 'bold 24px Arial';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillText('RA', 32, 32);

// Save as favicon.ico
const out = fs.createWriteStream('public/favicon.ico');
const stream = canvas.createPNGStream();
stream.pipe(out);
