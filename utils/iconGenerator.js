const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

class IconGenerator {
  
  constructor() {
    // Define icon sizes and formats needed for comprehensive SEO
    this.iconSizes = [
      { size: 16, name: 'favicon-16x16.png', rel: 'icon', type: 'image/png' },
      { size: 32, name: 'favicon-32x32.png', rel: 'icon', type: 'image/png' },
      { size: 48, name: 'favicon-48x48.png', rel: 'icon', type: 'image/png' },
      { size: 64, name: 'favicon-64x64.png', rel: 'icon', type: 'image/png' },
      { size: 96, name: 'favicon-96x96.png', rel: 'icon', type: 'image/png' },
      { size: 128, name: 'favicon-128x128.png', rel: 'icon', type: 'image/png' },
      { size: 180, name: 'apple-touch-icon.png', rel: 'apple-touch-icon', type: 'image/png' },
      { size: 192, name: 'android-chrome-192x192.png', rel: 'icon', type: 'image/png' },
      { size: 512, name: 'android-chrome-512x512.png', rel: 'icon', type: 'image/png' },
      { size: 1200, name: 'og-image.png', rel: 'og-image', type: 'image/png', width: 1200, height: 630 }
    ];
  }
  
  /**
   * Generate all required icon formats from source image
   * @param {string} sourcePath - Path to source image
   * @param {string} originalFilename - Original filename
   * @param {string} sessionDir - Session-specific directory path
   * @returns {Object} Icon data with paths and metadata
   */
  async generateIcons(sourcePath, originalFilename, sessionDir) {
    try {
      // Analyze source image
      const metadata = await sharp(sourcePath).metadata();
      console.log(`Processing source image: ${metadata.width}x${metadata.height}, format: ${metadata.format}`);
      
      // Determine output directory
      const iconsDir = sessionDir ? path.join(sessionDir, 'icons') : 'generated/icons';
      await fs.mkdir(iconsDir, { recursive: true });
      
      const generatedIcons = [];
      let ogImageData = null;
      
      // Generate each required icon size
      for (const iconSpec of this.iconSizes) {
        try {
          const outputPath = path.join(iconsDir, iconSpec.name);
          
          if (iconSpec.rel === 'og-image') {
            // Special handling for Open Graph image (1200x630)
            await this.generateOGImage(sourcePath, outputPath);
            // Internal server path for serving files from our generator
            const serverPath = sessionDir ? 
              `/generated/sessions/${path.basename(sessionDir)}/icons/${iconSpec.name}` : 
              `/generated/icons/${iconSpec.name}`;
            
            // User-friendly path for generated HTML code
            const userPath = `/icons/${iconSpec.name}`;
            
            ogImageData = {
              href: serverPath, // Used for preview in our interface
              userHref: userPath, // Used in generated HTML code
              width: 1200,
              height: 630,
              type: 'image/png'
            };
          } else {
            // Generate square icons
            await sharp(sourcePath)
              .resize(iconSpec.size, iconSpec.size, {
                fit: 'contain',
                background: { r: 255, g: 255, b: 255, alpha: 0 }
              })
              .png({ quality: 90, progressive: true })
              .toFile(outputPath);
          }
          
          // Internal server path for serving files from our generator
          const serverPath = sessionDir ? 
            `/generated/sessions/${path.basename(sessionDir)}/icons/${iconSpec.name}` : 
            `/generated/icons/${iconSpec.name}`;
          
          // User-friendly path for generated HTML code that users will copy
          // Special case: favicon.ico should be at root level for best compatibility
          const userPath = iconSpec.name === 'favicon.ico' ? 
            `/favicon.ico` : 
            `/icons/${iconSpec.name}`;
            
          generatedIcons.push({
            name: iconSpec.name,
            href: serverPath, // Used for preview in our interface
            userHref: userPath, // Used in generated HTML code
            sizes: `${iconSpec.size}x${iconSpec.size}`,
            type: iconSpec.type,
            rel: iconSpec.rel
          });
          
          console.log(`Generated: ${iconSpec.name}`);
          
        } catch (err) {
          console.error(`Error generating ${iconSpec.name}:`, err.message);
        }
      }
      
      // Generate favicon.ico (multi-size ICO file)
      await this.generateFaviconICO(sourcePath, sessionDir);
      
      // Generate Web App Manifest
      const webManifest = await this.generateWebManifest(sessionDir);
      
      // Generate browserconfig.xml for Windows tiles
      const browserConfig = await this.generateBrowserConfig(sessionDir);
      
      return {
        icons: generatedIcons,
        ogImage: ogImageData,
        webManifest,
        browserConfig,
        sessionDir: sessionDir, // Pass sessionDir for zip generation
        sourceInfo: {
          originalFilename,
          width: metadata.width,
          height: metadata.height,
          format: metadata.format
        }
      };
      
    } catch (error) {
      console.error('Error in generateIcons:', error);
      throw new Error(`Failed to generate icons: ${error.message}`);
    }
  }
  
  /**
   * Generate Open Graph image with proper dimensions (1200x630)
   */
  async generateOGImage(sourcePath, outputPath) {
    const ogWidth = 1200;
    const ogHeight = 630;
    
    // Create a centered image on white background
    await sharp({
      create: {
        width: ogWidth,
        height: ogHeight,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      }
    })
    .composite([{
      input: await sharp(sourcePath)
        .resize(400, 400, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .toBuffer(),
      gravity: 'center'
    }])
    .png({ quality: 90 })
    .toFile(outputPath);
  }
  
  /**
   * Generate multi-size favicon.ico file
   * @param {string} sourcePath - Path to source image
   * @param {string} sessionDir - Session-specific directory path
   */
  async generateFaviconICO(sourcePath, sessionDir) {
    try {
      // Generate individual sizes for ICO
      const icoSizes = [16, 32, 48];
      const buffers = [];
      
      for (const size of icoSizes) {
        const buffer = await sharp(sourcePath)
          .resize(size, size, {
            fit: 'contain',
            background: { r: 255, g: 255, b: 255, alpha: 0 }
          })
          .png()
          .toBuffer();
        buffers.push(buffer);
      }
      
      // For now, just save the 32x32 version as favicon.ico
      // In a production environment, you might want to use a library like 'to-ico'
      const iconsDir = sessionDir ? path.join(sessionDir, 'icons') : 'generated/icons';
      await sharp(sourcePath)
        .resize(32, 32, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .png()
        .toFile(path.join(iconsDir, 'favicon.ico'));
        
      console.log('Generated: favicon.ico');
      
    } catch (error) {
      console.error('Error generating favicon.ico:', error.message);
    }
  }
  
  /**
   * Generate Web App Manifest file
   * @param {string} sessionDir - Session-specific directory path
   */
  async generateWebManifest(sessionDir) {
    // Use user-friendly paths in the generated manifest
    const manifest = {
      "name": "Your Website",
      "short_name": "YourSite",
      "description": "Your website description",
      "start_url": "/",
      "display": "standalone",
      "theme_color": "#ffffff",
      "background_color": "#ffffff",
      "orientation": "portrait-primary",
      "icons": [
        {
          "src": "/icons/android-chrome-192x192.png",
          "sizes": "192x192",
          "type": "image/png",
          "purpose": "maskable any"
        },
        {
          "src": "/icons/android-chrome-512x512.png",
          "sizes": "512x512",
          "type": "image/png",
          "purpose": "maskable any"
        }
      ]
    };
    
    const manifestPath = sessionDir ? 
      path.join(sessionDir, 'site.webmanifest') : 
      'generated/site.webmanifest';
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
    console.log('Generated: site.webmanifest');
    
    return {
      path: manifestPath,
      content: manifest
    };
  }
  
  /**
   * Generate browserconfig.xml for Windows tiles
   * @param {string} sessionDir - Session-specific directory path
   */
  async generateBrowserConfig(sessionDir) {
    // Use user-friendly paths in the generated browser config
    const browserConfig = `<?xml version="1.0" encoding="utf-8"?>
<browserconfig>
    <msapplication>
        <tile>
            <square150x150logo src="/icons/android-chrome-192x192.png"/>
            <square310x310logo src="/icons/android-chrome-512x512.png"/>
            <TileColor>#ffffff</TileColor>
        </tile>
    </msapplication>
</browserconfig>`;
    
    const configPath = sessionDir ? 
      path.join(sessionDir, 'browserconfig.xml') : 
      'generated/browserconfig.xml';
    await fs.writeFile(configPath, browserConfig);
    console.log('Generated: browserconfig.xml');
    
    return {
      path: configPath,
      content: browserConfig
    };
  }
  
  /**
   * Clean up old generated files
   */
  async cleanupOldFiles() {
    try {
      const iconDir = 'generated/icons';
      const files = await fs.readdir(iconDir);
      
      // Remove files older than 1 hour
      const oneHourAgo = Date.now() - (60 * 60 * 1000);
      
      for (const file of files) {
        const filePath = path.join(iconDir, file);
        const stats = await fs.stat(filePath);
        
        if (stats.mtime.getTime() < oneHourAgo) {
          await fs.unlink(filePath);
          console.log(`Cleaned up old file: ${file}`);
        }
      }
    } catch (error) {
      console.error('Error during cleanup:', error.message);
    }
  }
}

module.exports = new IconGenerator();
