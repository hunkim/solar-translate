#!/usr/bin/env node

/**
 * Favicon Generation Script
 * 
 * This script generates all required favicon files from the base SVG.
 * Run this script after deployment to generate proper favicon files.
 * 
 * Requirements:
 * - Install sharp: npm install sharp
 * - Run: node scripts/generate-favicons.js
 */

const fs = require('fs');
const path = require('path');

// Base SVG content
const svgContent = `<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Background circle -->
  <circle cx="256" cy="256" r="256" fill="#7c3aed"/>
  
  <!-- Sun rays -->
  <g stroke="#fbbf24" stroke-width="24" stroke-linecap="round">
    <line x1="256" y1="64" x2="256" y2="96"/>
    <line x1="256" y1="416" x2="256" y2="448"/>
    <line x1="64" y1="256" x2="96" y2="256"/>
    <line x1="416" y1="256" x2="448" y2="256"/>
    <line x1="124.16" y1="124.16" x2="146.72" y2="146.72"/>
    <line x1="365.28" y1="365.28" x2="387.84" y2="387.84"/>
    <line x1="124.16" y1="387.84" x2="146.72" y2="365.28"/>
    <line x1="365.28" y1="146.72" x2="387.84" y2="124.16"/>
  </g>
  
  <!-- Central sun/translation symbol -->
  <circle cx="256" cy="256" r="96" fill="#fbbf24"/>
  
  <!-- Translation arrows -->
  <g stroke="#7c3aed" stroke-width="20" fill="none">
    <path d="M192 224 L320 224 M288 192 L320 224 L288 256"/>
    <path d="M320 288 L192 288 M224 256 L192 288 L224 320"/>
  </g>
</svg>`;

// Sizes to generate
const sizes = [
  { size: 16, name: 'favicon-16x16.png' },
  { size: 32, name: 'favicon-32x32.png' },
  { size: 96, name: 'favicon-96x96.png' },
  { size: 180, name: 'apple-touch-icon.png' },
  { size: 192, name: 'android-chrome-192x192.png' },
  { size: 512, name: 'android-chrome-512x512.png' },
  { size: 150, name: 'mstile-150x150.png' },
];

console.log('🎨 Solar Translate Favicon Generator');
console.log('=====================================');
console.log('');
console.log('To generate favicon files, please:');
console.log('');
console.log('1. Install sharp: npm install sharp');
console.log('2. Run this script: node scripts/generate-favicons.js');
console.log('');
console.log('Or use an online favicon generator with the SVG content above.');
console.log('');
console.log('Required files:');
sizes.forEach(({ name, size }) => {
  console.log(`  - ${name} (${size}x${size})`);
});
console.log('  - favicon.ico (multi-size ICO file)');
console.log('');
console.log('SVG content saved to: public/favicon-base.svg');

// Save the base SVG
const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(path.join(publicDir, 'favicon-base.svg'), svgContent);
console.log('✅ Base SVG saved successfully!');

// Try to generate with sharp if available
try {
  const sharp = require('sharp');
  
  console.log('📦 Sharp found! Generating favicon files...');
  
  const generateFavicons = async () => {
    const svgBuffer = Buffer.from(svgContent);
    
    for (const { size, name } of sizes) {
      try {
        await sharp(svgBuffer)
          .resize(size, size)
          .png()
          .toFile(path.join(publicDir, name));
        console.log(`✅ Generated ${name}`);
      } catch (error) {
        console.log(`❌ Failed to generate ${name}:`, error.message);
      }
    }
    
    // Generate ICO file (requires ico format support)
    try {
      await sharp(svgBuffer)
        .resize(32, 32)
        .png()
        .toFile(path.join(publicDir, 'favicon.ico'));
      console.log('✅ Generated favicon.ico');
    } catch (error) {
      console.log('❌ Failed to generate favicon.ico:', error.message);
      console.log('💡 Use an online ICO converter for favicon.ico');
    }
    
    console.log('');
    console.log('🎉 Favicon generation complete!');
  };
  
  generateFavicons().catch(console.error);
  
} catch (error) {
  console.log('📦 Sharp not found. Install with: npm install sharp');
  console.log('💡 Or use an online favicon generator with the SVG above.');
} 