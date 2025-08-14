const fs = require('fs').promises;
const path = require('path');

class SEOGenerator {
  
  /**
   * Generate comprehensive SEO assets
   * @param {Object} options - SEO generation options
   * @param {string} options.title - Site title
   * @param {string} options.description - Site description
   * @param {string} options.websiteUrl - Website URL
   * @param {string} options.siteLinks - Site links (newline-separated)
   * @param {Object} options.iconData - Icon data from icon generator
   * @param {string} options.sessionDir - Session-specific directory path
   * @param {string} options.sessionId - Unique session identifier
   * @returns {Object} Complete SEO data structure
   */
  async generateSEO(options) {
    const { title, description, websiteUrl, siteLinks, iconData, sessionDir, sessionId } = options;
    
    // Sanitize inputs
    const cleanTitle = this.sanitizeText(title);
    const cleanDescription = this.sanitizeText(description);
    const cleanWebsiteUrl = websiteUrl.trim().replace(/\/+$/, ''); // Remove trailing slashes
    
    // Parse site links
    const parsedSiteLinks = this.parseSiteLinks(siteLinks, cleanWebsiteUrl);
    
    // Generate meta tags
    const metaTags = this.generateMetaTags(cleanTitle, cleanDescription, cleanWebsiteUrl, iconData);
    
    // Generate Open Graph tags
    const openGraphTags = this.generateOpenGraphTags(cleanTitle, cleanDescription, cleanWebsiteUrl, iconData);
    
    // Generate Twitter Card tags
    const twitterTags = this.generateTwitterTags(cleanTitle, cleanDescription, cleanWebsiteUrl, iconData);
    
    // Generate JSON-LD structured data
    const structuredData = this.generateStructuredData(cleanTitle, cleanDescription, cleanWebsiteUrl);
    
    // Generate complete HTML head section
    const htmlHead = this.generateHTMLHead(metaTags, openGraphTags, twitterTags, structuredData, iconData);
    
    // Generate robots.txt content
    const robotsTxt = this.generateRobotsTxt(cleanWebsiteUrl);
    
    // Generate sitemap.xml with actual site links
    const sitemapXml = this.generateSitemapTemplate(cleanWebsiteUrl, parsedSiteLinks);
    
    // Save generated files to session-specific directory
    await this.saveGeneratedFiles({
      htmlHead,
      robotsTxt,
      sitemapXml,
      metaTags,
      openGraphTags,
      twitterTags,
      structuredData
    }, sessionDir);
    
    return {
      title: cleanTitle,
      description: cleanDescription,
      websiteUrl: cleanWebsiteUrl,
      siteLinks: parsedSiteLinks,
      metaTags,
      openGraphTags,
      twitterTags,
      structuredData,
      htmlHead,
      robotsTxt,
      sitemapXml,
      iconData,
      sessionId,
      sessionDir,
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * Sanitize text input
   */
  sanitizeText(text) {
    return text.trim().replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  
  /**
   * Parse site links from textarea input
   * @param {string} siteLinks - Newline-separated URLs
   * @param {string} websiteUrl - Base website URL
   * @returns {Array} Array of valid URLs
   */
  parseSiteLinks(siteLinks, websiteUrl) {
    if (!siteLinks || !siteLinks.trim()) {
      return [websiteUrl]; // Return just the homepage if no links provided
    }
    
    const links = siteLinks.trim().split('\n')
      .map(link => link.trim())
      .filter(link => link.length > 0)
      .filter(link => {
        try {
          new URL(link); // Validate URL format
          return true;
        } catch {
          return false;
        }
      });
    
    // Always include the homepage as the first entry if not already present
    if (!links.includes(websiteUrl) && !links.includes(websiteUrl + '/')) {
      return [websiteUrl, ...links];
    }
    
    return links.length > 0 ? links : [websiteUrl];
  }
  
  /**
   * Generate basic meta tags
   */
  generateMetaTags(title, description, websiteUrl, iconData) {
    const tags = [
      `<meta charset="UTF-8">`,
      `<meta name="viewport" content="width=device-width, initial-scale=1.0">`,
      `<title>${title}</title>`,
      `<meta name="description" content="${description}">`,
      `<meta name="robots" content="index, follow">`,
      `<meta name="author" content="${title}">`,
      `<meta name="generator" content="SEO Generator v1.0">`,
      `<link rel="canonical" href="${websiteUrl}/">`
    ];
    
    // Add icon links if available - use userHref for generated HTML code
    if (iconData && iconData.icons) {
      iconData.icons.forEach(icon => {
        const href = icon.userHref || icon.href; // Use userHref for generated code
        if (icon.rel === 'icon') {
          tags.push(`<link rel="icon" type="${icon.type}" sizes="${icon.sizes}" href="${href}">`);
        } else if (icon.rel === 'apple-touch-icon') {
          tags.push(`<link rel="apple-touch-icon" sizes="${icon.sizes}" href="${href}">`);
        }
      });
    }
    
    return tags;
  }
  
  /**
   * Generate Open Graph meta tags
   */
  generateOpenGraphTags(title, description, websiteUrl, iconData) {
    const tags = [
      `<meta property="og:title" content="${title}">`,
      `<meta property="og:description" content="${description}">`,
      `<meta property="og:type" content="website">`,
      `<meta property="og:url" content="${websiteUrl}/">`,
      `<meta property="og:site_name" content="${title}">`,
      `<meta property="og:locale" content="en_US">`
    ];
    
    // Add Open Graph image if available - use userHref for generated HTML code
    if (iconData && iconData.ogImage) {
      const imageHref = iconData.ogImage.userHref || iconData.ogImage.href;
      tags.push(
        `<meta property="og:image" content="${websiteUrl}${imageHref}">`,
        `<meta property="og:image:width" content="${iconData.ogImage.width}">`,
        `<meta property="og:image:height" content="${iconData.ogImage.height}">`,
        `<meta property="og:image:type" content="${iconData.ogImage.type}">`
      );
    }
    
    return tags;
  }
  
  /**
   * Generate Twitter Card meta tags
   */
  generateTwitterTags(title, description, websiteUrl, iconData) {
    const tags = [
      `<meta name="twitter:card" content="summary_large_image">`,
      `<meta name="twitter:title" content="${title}">`,
      `<meta name="twitter:description" content="${description}">`,
      `<meta name="twitter:site" content="@yourhandle">`,
      `<meta name="twitter:creator" content="@yourhandle">`
    ];
    
    // Add Twitter image if available - use userHref for generated HTML code
    if (iconData && iconData.ogImage) {
      const imageHref = iconData.ogImage.userHref || iconData.ogImage.href;
      tags.push(`<meta name="twitter:image" content="${websiteUrl}${imageHref}">`);
    }
    
    return tags;
  }
  
  /**
   * Generate JSON-LD structured data
   */
  generateStructuredData(title, description, websiteUrl) {
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": title,
      "description": description,
      "url": `${websiteUrl}/`,
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": `${websiteUrl}/search?q={search_term_string}`
        },
        "query-input": "required name=search_term_string"
      }
    };
    
    return `<script type="application/ld+json">\n${JSON.stringify(structuredData, null, 2)}\n</script>`;
  }
  
  /**
   * Generate complete HTML head section
   */
  generateHTMLHead(metaTags, openGraphTags, twitterTags, structuredData, iconData) {
    const allTags = [
      '<!DOCTYPE html>',
      '<html lang="en">',
      '<head>',
      '    <!-- Basic Meta Tags -->',
      ...metaTags.map(tag => `    ${tag}`),
      '',
      '    <!-- Open Graph Meta Tags -->',
      ...openGraphTags.map(tag => `    ${tag}`),
      '',
      '    <!-- Twitter Card Meta Tags -->',
      ...twitterTags.map(tag => `    ${tag}`),
      '',
      '    <!-- Structured Data -->',
      `    ${structuredData}`,
      '',
      '    <!-- Additional SEO Meta Tags -->',
      '    <meta name="theme-color" content="#ffffff">',
      '    <meta name="msapplication-TileColor" content="#ffffff">',
      '',
      '    <!-- Preconnect for Performance -->',
      '    <link rel="preconnect" href="https://fonts.googleapis.com">',
      '    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
      '</head>',
      '<body>',
      '    <!-- Your content goes here -->',
      '</body>',
      '</html>'
    ];
    
    return allTags.join('\n');
  }
  
  /**
   * Generate robots.txt content
   */
  generateRobotsTxt(websiteUrl) {
    return `User-agent: *
Allow: /

# Sitemap
Sitemap: ${websiteUrl}/sitemap.xml

# Block common spam bots
User-agent: AhrefsBot
Disallow: /

User-agent: MJ12bot
Disallow: /

User-agent: DotBot
Disallow: /`;
  }
  
  /**
   * Generate sitemap.xml with actual site links
   */
  generateSitemapTemplate(websiteUrl, siteLinks) {
    const today = new Date().toISOString().split('T')[0];
    
    const urlEntries = siteLinks.map((url, index) => {
      // Set higher priority for homepage
      const isHomepage = url === websiteUrl || url === `${websiteUrl}/`;
      const priority = isHomepage ? '1.0' : '0.8';
      const changefreq = isHomepage ? 'daily' : 'weekly';
      
      return `    <url>
        <loc>${url.endsWith('/') ? url : url + '/'}</loc>
        <lastmod>${today}</lastmod>
        <changefreq>${changefreq}</changefreq>
        <priority>${priority}</priority>
    </url>`;
    }).join('\n');
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;
  }
  
  /**
   * Save generated files to session-specific directory
   * @param {Object} data - Generated file data
   * @param {string} sessionDir - Session-specific directory path
   */
  async saveGeneratedFiles(data, sessionDir) {
    const outputDir = sessionDir || 'generated'; // Fallback to old behavior if no sessionDir
    
    const files = [
      { filename: 'complete.html', content: data.htmlHead },
      { filename: 'robots.txt', content: data.robotsTxt },
      { filename: 'sitemap.xml', content: data.sitemapXml },
      { filename: 'meta-tags.html', content: data.metaTags.join('\n') },
      { filename: 'opengraph-tags.html', content: data.openGraphTags.join('\n') },
      { filename: 'twitter-tags.html', content: data.twitterTags.join('\n') },
      { filename: 'structured-data.json', content: data.structuredData }
    ];
    
    for (const file of files) {
      try {
        await fs.writeFile(path.join(outputDir, file.filename), file.content, 'utf8');
      } catch (err) {
        console.error(`Error saving ${file.filename}:`, err.message);
      }
    }
  }
}

module.exports = new SEOGenerator();
