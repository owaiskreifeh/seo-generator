const archiver = require('archiver');
const fs = require('fs');
const path = require('path');

class ZipGenerator {
  
  /**
   * Create a zip file containing all generated SEO assets
   * @param {Object} seoData - Complete SEO data structure
   * @param {string} outputPath - Path where to save the zip file
   * @returns {Promise<string>} Path to the created zip file
   */
  async createAssetsZip(seoData, outputPath) {
    return new Promise((resolve, reject) => {
      // Create a file to stream archive data to
      const output = fs.createWriteStream(outputPath);
      const archive = archiver('zip', {
        zlib: { level: 9 } // Sets the compression level
      });

      // Handle stream events
      output.on('close', () => {
        console.log(`ZIP archive created: ${archive.pointer()} total bytes`);
        resolve(outputPath);
      });

      archive.on('warning', (err) => {
        if (err.code === 'ENOENT') {
          console.warn('ZIP Warning:', err);
        } else {
          reject(err);
        }
      });

      archive.on('error', (err) => {
        reject(err);
      });

      // Pipe archive data to the file
      archive.pipe(output);

      // Add files to the archive
      this.addFilesToArchive(archive, seoData);

      // Finalize the archive
      archive.finalize();
    });
  }

  /**
   * Add all generated files to the zip archive
   * @param {Object} archive - Archiver instance
   * @param {Object} seoData - SEO data containing all assets
   */
  addFilesToArchive(archive, seoData) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    
    // Add HTML files with descriptions
    this.addHtmlFiles(archive, seoData);
    
    // Add configuration files
    this.addConfigurationFiles(archive, seoData);
    
    // Add icon files if available
    if (seoData.iconData && seoData.iconData.icons) {
      this.addIconFiles(archive, seoData.iconData);
    }
    
    // Add comprehensive README
    this.addReadmeFile(archive, seoData);
    
    // Add implementation guide
    this.addImplementationGuide(archive, seoData);
  }

  /**
   * Add HTML files with detailed descriptions
   */
  addHtmlFiles(archive, seoData) {
    const htmlFiles = [
      {
        filename: 'complete.html',
        content: seoData.htmlHead,
        description: `Complete HTML template with all SEO elements

WHERE TO USE:
- Use this as a starting template for your website's HTML structure
- Copy the <head> section to your existing HTML files
- Replace "https://yourwebsite.com" with your actual domain

WHY IT'S NEEDED:
- Contains all essential SEO meta tags
- Includes proper viewport settings for mobile compatibility
- Has structured data for better search engine understanding
- Includes icon references for favicons and app icons`
      },
      {
        filename: 'meta-tags.html',
        content: seoData.metaTags.join('\n'),
        description: `Basic meta tags for SEO

WHERE TO ADD:
- Add these inside the <head> section of every HTML page
- Place them before any other stylesheets or scripts
- Update the canonical URL for each specific page

WHY IT'S NEEDED:
- Title and description appear in search results
- Viewport meta tag ensures proper mobile display
- Robots meta tag controls search engine indexing
- Canonical URL prevents duplicate content issues`
      },
      {
        filename: 'opengraph-tags.html',
        content: seoData.openGraphTags.join('\n'),
        description: `Open Graph tags for social media sharing

WHERE TO ADD:
- Add inside <head> section after basic meta tags
- Update og:url for each specific page
- Customize og:image for page-specific sharing images

WHY IT'S NEEDED:
- Controls how your content appears when shared on social media
- Facebook, LinkedIn, and other platforms use these tags
- Improves click-through rates from social media
- Provides consistent branding across social platforms`
      },
      {
        filename: 'twitter-tags.html',
        content: seoData.twitterTags.join('\n'),
        description: `Twitter Card meta tags for Twitter sharing

WHERE TO ADD:
- Add inside <head> section alongside Open Graph tags
- Update twitter:site and twitter:creator with your handles
- Customize twitter:image for tweet-specific images

WHY IT'S NEEDED:
- Optimizes how your content appears in Twitter feeds
- Creates rich media attachments in tweets
- Increases engagement rates on Twitter
- Provides better brand visibility on the platform`
      },
      {
        filename: 'structured-data.json',
        content: seoData.structuredData,
        description: `JSON-LD structured data for search engines

WHERE TO ADD:
- Add this script tag inside the <head> section
- Can also be placed just before closing </body> tag
- Update the URL and details for each page as needed

WHY IT'S NEEDED:
- Helps search engines understand your content better
- Enables rich snippets in search results
- Improves SEO rankings and click-through rates
- Provides structured information for voice search`
      }
    ];

    htmlFiles.forEach(file => {
      // Add the file content
      archive.append(file.content, { name: `html/${file.filename}` });
      
      // Add description file
      archive.append(file.description, { 
        name: `html/${file.filename.replace(/\.(html|json)$/, '')}-guide.txt` 
      });
    });
  }

  /**
   * Add configuration files
   */
  addConfigurationFiles(archive, seoData) {
    const configFiles = [
      {
        filename: 'robots.txt',
        content: seoData.robotsTxt,
        description: `Robots.txt file for search engine crawlers

WHERE TO PLACE:
- Upload to the root directory of your website
- Must be accessible at: https://yourwebsite.com/robots.txt
- DO NOT place in subdirectories

WHY IT'S NEEDED:
- Tells search engines which pages to crawl
- Blocks unwanted bots from accessing your site
- Points to your sitemap location
- Improves crawl efficiency and saves bandwidth`
      },
      {
        filename: 'sitemap.xml',
        content: seoData.sitemapXml,
        description: `XML sitemap for search engines

WHERE TO PLACE:
- Upload to your website's root directory
- Accessible at: https://yourwebsite.com/sitemap.xml
- Submit to Google Search Console and Bing Webmaster Tools

WHY IT'S NEEDED:
- Helps search engines discover all your pages
- Indicates page importance and update frequency
- Improves indexing of your website
- Essential for larger websites with many pages

IMPORTANT:
- Update the URLs to match your actual website structure
- Add all your important pages to the sitemap
- Update lastmod dates when you modify pages`
      }
    ];

    if (seoData.iconData) {
      if (seoData.iconData.webManifest) {
        configFiles.push({
          filename: 'site.webmanifest',
          content: JSON.stringify(seoData.iconData.webManifest.content, null, 2),
          description: `Web App Manifest for Progressive Web App features

WHERE TO PLACE:
- Upload to your website's root directory
- Link in HTML: <link rel="manifest" href="/site.webmanifest">
- Ensure icon files are uploaded to correct paths

WHY IT'S NEEDED:
- Enables "Add to Home Screen" functionality
- Defines app appearance when installed on mobile
- Required for Progressive Web App (PWA) features
- Improves mobile user experience`
        });
      }

      if (seoData.iconData.browserConfig) {
        configFiles.push({
          filename: 'browserconfig.xml',
          content: seoData.iconData.browserConfig.content,
          description: `Browser configuration for Windows tiles

WHERE TO PLACE:
- Upload to your website's root directory
- Accessible at: https://yourwebsite.com/browserconfig.xml
- No HTML linking required - auto-discovered by Windows

WHY IT'S NEEDED:
- Controls how your site appears in Windows Start menu
- Defines tile colors and icons for Windows devices
- Improves user experience on Windows tablets and desktops`
        });
      }
    }

    configFiles.forEach(file => {
      // Add the file
      archive.append(file.content, { name: `config/${file.filename}` });
      
      // Add guide
      archive.append(file.description, { 
        name: `config/${file.filename.replace(/\.(txt|xml|webmanifest)$/, '')}-guide.txt` 
      });
    });
  }

  /**
   * Add icon files with descriptions
   */
  addIconFiles(archive, iconData) {
    const iconGuide = `ICON FILES GUIDE

FAVICON FILES:
- favicon.ico: Classic favicon for older browsers
  Place in root directory: https://yourwebsite.com/favicon.ico

MODERN FAVICONS:
- favicon-16x16.png, favicon-32x32.png: Modern browser favicons
  Link in HTML: <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">

APPLE TOUCH ICONS:
- apple-touch-icon.png: iOS home screen icon
  Link in HTML: <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">

ANDROID CHROME ICONS:
- android-chrome-192x192.png, android-chrome-512x512.png: Android app icons
  Referenced in site.webmanifest file

SOCIAL MEDIA IMAGE:
- og-image.png: Large image for social media sharing
  Use in Open Graph and Twitter Card meta tags

IMPLEMENTATION STEPS:
1. Upload all icon files to your website's root directory or /icons/ folder
2. Update the paths in your HTML meta tags if using a subfolder
3. Ensure all icon files are accessible via direct URL
4. Test icons using browser dev tools and social media debuggers

IMPORTANT NOTES:
- Keep original aspect ratios when possible
- Use PNG format for better quality and transparency support
- Optimize file sizes for faster loading
- Test on various devices and platforms`;

    // Add the guide
    archive.append(iconGuide, { name: 'icons/ICONS-GUIDE.txt' });

    // Add actual icon files if they exist
    iconData.icons.forEach(icon => {
      // Try session-specific path first, then fall back to global path
      let iconPath;
      if (iconData.sessionDir) {
        iconPath = path.join(iconData.sessionDir, 'icons', icon.name);
      } else {
        iconPath = path.join('generated', 'icons', icon.name);
      }
      
      if (fs.existsSync(iconPath)) {
        archive.file(iconPath, { name: `icons/${icon.name}` });
      }
    });
  }

  /**
   * Add comprehensive README file
   */
  addReadmeFile(archive, seoData) {
    const readme = `# SEO Assets Package
Generated on: ${new Date().toLocaleString()}

## 📋 Contents Overview

This package contains all the SEO assets generated for your website:
- **HTML Files**: Ready-to-use HTML code snippets
- **Configuration Files**: robots.txt, sitemap.xml, and manifest files
- **Icon Files**: Favicons and social media images in multiple formats
- **Implementation Guides**: Detailed instructions for each file

## 🚀 Quick Start

### 1. Basic Meta Tags
Copy the content from \`html/meta-tags.html\` and paste into your website's \`<head>\` section.

### 2. Social Media Optimization
Add the tags from \`html/opengraph-tags.html\` and \`html/twitter-tags.html\` to enable rich social media sharing.

### 3. Upload Configuration Files
- Place \`config/robots.txt\` in your website's root directory
- Upload \`config/sitemap.xml\` to your root directory
- Upload all icon files to your root directory or /icons/ folder

### 4. Update URLs
Replace all instances of "https://yourwebsite.com" with your actual domain name.

## 📁 File Structure

\`\`\`
seo-assets/
├── html/                    # HTML code snippets
│   ├── complete.html       # Full HTML template
│   ├── meta-tags.html      # Basic SEO meta tags
│   ├── opengraph-tags.html # Social media tags
│   ├── twitter-tags.html   # Twitter-specific tags
│   └── structured-data.json # JSON-LD schema
├── config/                 # Configuration files
│   ├── robots.txt         # Search engine directives
│   ├── sitemap.xml        # XML sitemap
│   ├── site.webmanifest   # PWA manifest
│   └── browserconfig.xml  # Windows tiles config
└── icons/                 # Icon files
    ├── favicon.ico        # Classic favicon
    ├── favicon-*.png      # Modern favicons
    ├── apple-touch-icon.png # iOS icon
    ├── android-chrome-*.png # Android icons
    └── og-image.png       # Social sharing image
\`\`\`

## 🔧 Implementation Priority

1. **Essential (Do First)**:
   - Add basic meta tags to all pages
   - Upload robots.txt and sitemap.xml
   - Add favicon files

2. **Important (Do Second)**:
   - Add Open Graph and Twitter tags
   - Upload and configure icon files
   - Add structured data

3. **Advanced (Optional)**:
   - Set up PWA manifest
   - Configure Windows tiles
   - Implement advanced analytics

## 📊 SEO Checklist

- [ ] All meta tags added to HTML \`<head>\`
- [ ] robots.txt uploaded to root directory
- [ ] sitemap.xml uploaded and submitted to search engines
- [ ] All icon files uploaded and linked
- [ ] URLs updated to your actual domain
- [ ] Open Graph tags tested with social media debuggers
- [ ] Structured data validated with Google's Rich Results Test

## 🛠️ Tools for Testing

- **Google Search Console**: Submit sitemap and monitor indexing
- **Facebook Sharing Debugger**: Test Open Graph tags
- **Twitter Card Validator**: Validate Twitter Card implementation
- **Google Rich Results Test**: Validate structured data
- **PageSpeed Insights**: Check overall page performance

## 📞 Need Help?

Each file includes detailed implementation guides. Look for files ending in \`-guide.txt\` for specific instructions.

For more advanced SEO techniques, consider:
- Adding analytics tracking
- Implementing AMP pages
- Setting up international SEO (hreflang)
- Creating XML sitemaps for images and videos

---
Generated by SEO Generator v1.0
`;

    archive.append(readme, { name: 'README.md' });
  }

  /**
   * Add implementation guide
   */
  addImplementationGuide(archive, seoData) {
    const guide = `# SEO Implementation Guide

## Step-by-Step Implementation

### Phase 1: Essential SEO Elements (30 minutes)

#### 1.1 Add Basic Meta Tags
\`\`\`html
<!-- Copy this into your <head> section -->
${seoData.metaTags.join('\n')}
\`\`\`

#### 1.2 Upload Root Files
- Upload \`robots.txt\` to: \`https://yourdomain.com/robots.txt\`
- Upload \`sitemap.xml\` to: \`https://yourdomain.com/sitemap.xml\`
- Upload \`favicon.ico\` to: \`https://yourdomain.com/favicon.ico\`

### Phase 2: Social Media Optimization (20 minutes)

#### 2.1 Add Open Graph Tags
\`\`\`html
<!-- Add after basic meta tags -->
${seoData.openGraphTags.join('\n')}
\`\`\`

#### 2.2 Add Twitter Cards
\`\`\`html
<!-- Add after Open Graph tags -->
${seoData.twitterTags.join('\n')}
\`\`\`

### Phase 3: Advanced Features (45 minutes)

#### 3.1 Add Structured Data
\`\`\`html
<!-- Add before closing </head> tag -->
${seoData.structuredData}
\`\`\`

#### 3.2 Upload All Icons
Upload all files from the \`icons/\` folder to your website's root directory.

#### 3.3 Configure PWA (if applicable)
- Upload \`site.webmanifest\` to root directory
- Add manifest link: \`<link rel="manifest" href="/site.webmanifest">\`

## Customization Required

### Update These Values:
1. **Domain URLs**: Replace "https://yourwebsite.com" with your actual domain
2. **Social Handles**: Update Twitter handles in meta tags
3. **Contact Information**: Add your actual contact details
4. **Logo URLs**: Update icon paths if using different directory structure

### Page-Specific Updates:
- Update \`og:url\` for each page
- Customize \`og:title\` and \`og:description\` per page
- Update canonical URLs for each page
- Modify structured data based on page content type

## Testing Your Implementation

### 1. Basic Functionality
- Check if favicon appears in browser tab
- Verify meta tags in browser's "View Source"
- Test robots.txt: \`yourdomain.com/robots.txt\`

### 2. Social Media Testing
- Facebook: https://developers.facebook.com/tools/debug/
- Twitter: https://cards-dev.twitter.com/validator
- LinkedIn: https://www.linkedin.com/post-inspector/

### 3. Search Engine Testing
- Google Rich Results: https://search.google.com/test/rich-results
- Google Search Console: Submit sitemap
- Bing Webmaster Tools: Submit sitemap

## Common Issues and Solutions

### Issue: Icons not appearing
**Solution**: 
- Ensure files are uploaded to correct directory
- Check file permissions (644 for files, 755 for directories)
- Clear browser cache

### Issue: Social sharing not working
**Solution**:
- Validate URLs are absolute (include https://)
- Check image dimensions (Open Graph: 1200x630px minimum)
- Use social media debuggers to refresh cache

### Issue: Search engines not finding sitemap
**Solution**:
- Verify sitemap is accessible via direct URL
- Submit manually in Search Console
- Check robots.txt has correct sitemap URL

## Performance Optimization

### Image Optimization
- Compress icon files without losing quality
- Use WebP format for modern browsers where possible
- Implement responsive images for social sharing

### Caching Strategy
- Set proper cache headers for static assets
- Use CDN for icon and image files
- Implement browser caching for meta assets

### Mobile Optimization
- Test all icons on mobile devices
- Verify viewport meta tag is working
- Check PWA installation on mobile

---

## Maintenance Schedule

### Monthly Tasks:
- Check for broken links in sitemap
- Update lastmod dates in sitemap
- Monitor search console for errors

### Quarterly Tasks:
- Review and update meta descriptions
- Check social media sharing appearance
- Validate structured data markup

### Annually:
- Review and update all SEO strategies
- Check for new meta tag requirements
- Update copyright years and business information

---

This guide covers 95% of common SEO implementation scenarios. For specific CMS or platform instructions, consult the platform's documentation for meta tag implementation.
`;

    archive.append(guide, { name: 'IMPLEMENTATION-GUIDE.md' });
  }

  /**
   * Generate a unique filename for the zip
   */
  generateZipFilename() {
    const timestamp = new Date().toISOString()
      .replace(/[:.]/g, '-')
      .replace('T', '_')
      .split('.')[0];
    
    return `seo-assets-${timestamp}.zip`;
  }
}

module.exports = new ZipGenerator();
