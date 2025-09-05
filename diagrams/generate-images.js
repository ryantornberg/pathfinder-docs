#!/usr/bin/env node

/**
 * PathFindR Diagram Image Generator
 * 
 * Automatically captures screenshots of all diagram HTML files
 * and converts them to PNG images for better mobile compatibility.
 * 
 * Prerequisites:
 * npm install playwright
 * 
 * Usage:
 * node generate-images.js
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const DIAGRAM_CONFIG = {
  'system-architecture.html': {
    width: 1400,
    height: 1000,
    description: 'PathFindR System Architecture'
  },
  'agent-systems.html': {
    width: 1400, 
    height: 1200,
    description: 'Development vs Production Agent Systems'
  },
  'rag-pipeline.html': {
    width: 1600,
    height: 900,
    description: 'RAG Document Processing Pipeline'
  },
  'context-optimization.html': {
    width: 1600,
    height: 800,
    description: 'Context Optimization Comparison'
  }
};

async function generateDiagramImages() {
  console.log('🚀 Starting PathFindR diagram image generation...\n');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Create images directory if it doesn't exist
  const imagesDir = path.join(__dirname, 'images');
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir);
    console.log('📁 Created images directory');
  }
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const [filename, config] of Object.entries(DIAGRAM_CONFIG)) {
    try {
      console.log(`📸 Capturing ${config.description}...`);
      
      // Set viewport size
      await page.setViewportSize({ 
        width: config.width, 
        height: config.height 
      });
      
      // Navigate to diagram page
      const filePath = path.join(__dirname, filename);
      await page.goto(`file://${filePath}`);
      
      // Wait for Mermaid to render
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000); // Extra wait for Mermaid
      
      // Wait for Mermaid diagram to be rendered
      await page.waitForSelector('.mermaid svg', { timeout: 10000 });
      
      // Generate output filename
      const outputName = filename.replace('.html', '.png');
      const outputPath = path.join(imagesDir, outputName);
      
      // Take screenshot
      await page.screenshot({ 
        path: outputPath,
        fullPage: false,
        clip: {
          x: 0,
          y: 0,
          width: config.width,
          height: config.height
        }
      });
      
      console.log(`   ✅ Saved: images/${outputName}`);
      successCount++;
      
    } catch (error) {
      console.error(`   ❌ Error capturing ${filename}:`, error.message);
      errorCount++;
    }
  }
  
  await browser.close();
  
  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Successfully generated: ${successCount} images`);
  console.log(`   ❌ Errors: ${errorCount}`);
  
  if (successCount > 0) {
    console.log(`\n📁 Images saved to: ${imagesDir}`);
    console.log(`\n💡 Next steps:`);
    console.log(`   1. Review generated images for quality`);
    console.log(`   2. Update presentation to use static images`);
    console.log(`   3. Test mobile compatibility`);
  }
}

// Handle command line execution
if (require.main === module) {
  generateDiagramImages().catch(console.error);
}

module.exports = { generateDiagramImages };