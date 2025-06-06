const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');
const path = require('path');

// Ensure public directory exists
const publicDir = path.join(__dirname, '../public');
const iconsDir = path.join(publicDir, 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Sizes we need
const sizes = [16, 32, 64, 96, 128, 192, 256, 384, 512];

// Create a simple favicon.ico
const createFavicon = async () => {
  const canvas = createCanvas(32, 32);
  const ctx = canvas.getContext('2d');
  
  // Fill with black background
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, 32, 32);
  
  // Add white text
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 24px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('RA', 16, 16);
  
  // Save as favicon.ico
  const out = fs.createWriteStream(path.join(publicDir, 'favicon.ico'));
  const stream = canvas.createPNGStream();
  stream.pipe(out);
  
  return new Promise((resolve, reject) => {
    out.on('finish', resolve);
    out.on('error', reject);
  });
};

// Create other icon sizes
const createIcons = async () => {
  try {
    // Create favicon.ico
    await createFavicon();
    console.log('Created favicon.ico');
    
    // Copy the existing krultra-logo.png to all required sizes
    const logoPath = path.join(iconsDir, 'krultra-logo.png');
    
    for (const size of sizes) {
      const outputPath = path.join(iconsDir, `icon-${size}x${size}.png`);
      
      // Skip if already exists
      if (fs.existsSync(outputPath)) continue;
      
      // Create a canvas and draw the resized image
      const canvas = createCanvas(size, size);
      const ctx = canvas.getContext('2d');
      
      // Fill with white background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, size, size);
      
      // Try to load and draw the logo if it exists
      if (fs.existsSync(logoPath)) {
        const image = await loadImage(logoPath);
        // Calculate dimensions to maintain aspect ratio
        const ratio = Math.min(size / image.width, size / image.height);
        const width = image.width * ratio * 0.8; // 80% of the available space
        const height = image.height * ratio * 0.8;
        const x = (size - width) / 2;
        const y = (size - height) / 2;
        
        ctx.drawImage(image, x, y, width, height);
      } else {
        // Fallback: Draw a simple icon
        ctx.fillStyle = '#000000';
        ctx.font = `bold ${size * 0.6}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('RA', size / 2, size / 2);
      }
      
      // Save the icon
      const out = fs.createWriteStream(outputPath);
      const stream = canvas.createPNGStream();
      stream.pipe(out);
      
      await new Promise((resolve, reject) => {
        out.on('finish', resolve);
        out.on('error', reject);
      });
      
      console.log(`Created ${outputPath}`);
    }
    
    console.log('All icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
    process.exit(1);
  }
};

// Run the script
createIcons();
