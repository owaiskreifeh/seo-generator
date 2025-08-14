# SEO Generator

A professional SEO asset generator that creates comprehensive meta tags, icons, structured data, and other SEO essentials from user inputs using AI-powered optimization.

## Features

🚀 **AI-Powered SEO Generation**
- Automatic meta tag generation using Google's Gemini AI
- Smart keyword optimization and content suggestions
- SEO-friendly descriptions and titles

🎨 **Icon & Asset Generation**
- Complete favicon package (16x16 to 512x512)
- Apple touch icons and PWA icons
- Open Graph and Twitter Card images
- Browser configuration files

📊 **Structured Data & Meta Tags**
- Schema.org structured data (JSON-LD)
- Open Graph protocol tags
- Twitter Card meta tags
- Standard HTML meta tags
- Robots.txt generation

🔧 **Additional SEO Tools**
- XML sitemap generation
- Web App Manifest for PWAs
- Browser configuration files
- Complete downloadable package

⚡ **Performance & Security**
- Session-based file management
- Rate limiting and security headers
- Automatic cleanup of old sessions
- Compression and caching

## Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (version 16 or higher)
- **npm** (comes with Node.js)
- **Google AI API Key** (Gemini)

## Installation

1. **Clone the repository**
   ```bash
   git clone <your-repository-url>
   cd seo-generator
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   Create a `.env` file in the root directory:
   ```env
   # Required: Google AI API Key for Gemini
   GOOGLE_API_KEY=your_google_ai_api_key_here
   
   # Optional: Server configuration
   PORT=3000
   NODE_ENV=production
   ```

4. **Create required directories**
   The application will automatically create necessary directories, but you can pre-create them:
   ```bash
   mkdir -p generated/sessions
   mkdir -p uploads
   ```

## Getting Your Google AI API Key

1. Visit the [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Copy the key and add it to your `.env` file

## Running the Application

### Development Mode
```bash
npm run dev
```
This starts the server with nodemon for automatic restarts on file changes.

### Production Mode
```bash
npm start
```

The server will start on `http://localhost:3000` (or your specified PORT).

## Usage

1. **Access the application**
   Open your browser and navigate to `http://localhost:3000`

2. **Fill out the SEO form**
   - Enter your website title, description, and keywords
   - Provide your website URL and author information
   - Upload a logo/image for social media cards (optional)
   - Add any additional custom meta tags

3. **Generate SEO assets**
   - Click "Generate SEO Package"
   - The AI will optimize your content and generate all assets
   - Preview the generated meta tags and structured data

4. **Download your package**
   - Download the complete ZIP file containing all SEO assets
   - Extract and integrate the files into your website

## Generated Files Structure

```
your-session-id/
├── complete.html           # Complete HTML with all meta tags
├── meta-tags.html         # Standard meta tags
├── opengraph-tags.html    # Open Graph protocol tags
├── twitter-tags.html      # Twitter Card tags
├── structured-data.json   # Schema.org JSON-LD
├── sitemap.xml           # XML sitemap
├── robots.txt            # Robots.txt file
├── site.webmanifest      # PWA manifest
├── browserconfig.xml     # Browser configuration
└── icons/                # Complete favicon package
    ├── favicon.ico
    ├── favicon-16x16.png
    ├── favicon-32x32.png
    ├── apple-touch-icon.png
    ├── android-chrome-192x192.png
    ├── android-chrome-512x512.png
    └── og-image.png      # Social media image
```

## Project Structure

```
seo-generator/
├── server.js              # Express server configuration
├── package.json           # Dependencies and scripts
├── .env                   # Environment variables (create this)
├── .gitignore            # Git ignore rules
├── public/               # Static assets
│   ├── css/
│   └── js/
├── views/                # EJS templates
│   ├── index.ejs         # Main form page
│   └── error.ejs         # Error page
├── routes/               # Express routes
│   └── index.js          # Main application routes
├── utils/                # Core utilities
│   ├── ai.js             # Google AI integration
│   ├── seoGenerator.js   # SEO content generation
│   ├── iconGenerator.js  # Icon and image processing
│   └── zipGenerator.js   # ZIP package creation
├── generated/            # Generated files (auto-created)
│   └── sessions/         # Session-based storage
└── uploads/              # User uploads (auto-created)
```

## API Endpoints

- `GET /` - Main application page
- `POST /generate` - Generate SEO package
- `GET /download/:sessionId` - Download generated ZIP package
- `GET /generated/sessions/:sessionId/*` - Serve session files

## Configuration Options

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GOOGLE_API_KEY` | Yes | - | Google AI API key for content generation |
| `PORT` | No | 3000 | Server port number |
| `NODE_ENV` | No | development | Environment mode |

### Rate Limiting

The application includes rate limiting:
- 100 requests per 15 minutes per IP
- Protects against abuse and excessive API usage

### Session Management

- Sessions automatically expire after 2 hours
- Old files are cleaned up automatically
- Each user gets isolated session storage

## Troubleshooting

### Common Issues

1. **"API key not found" error**
   - Ensure your `.env` file contains a valid `GOOGLE_API_KEY`
   - Restart the server after adding the API key

2. **"Module not found" errors**
   - Run `npm install` to ensure all dependencies are installed
   - Check that you're in the correct directory

3. **Port already in use**
   - Change the PORT in your `.env` file
   - Kill any existing processes using the port

4. **File upload issues**
   - Ensure the `uploads/` directory exists and is writable
   - Check file size limits (default: 5MB)

### Development Tips

- Use `npm run dev` for development with auto-restart
- Check console logs for detailed error information
- Generated files are stored in session-specific directories
- Upload a high-quality logo (minimum 192x192px) for best results

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the package.json file for details.

## Support

If you encounter any issues or have questions:
1. Check the troubleshooting section above
2. Review the console logs for error details
3. Ensure your Google AI API key is valid and has quota remaining

---

**Note**: This application uses Google's Gemini AI for content generation. Ensure you have sufficient API quota and follow Google's usage policies.
