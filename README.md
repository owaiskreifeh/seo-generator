# SEO Generator with Authentication & Credit System

A professional SEO asset generator that creates meta tags, icons, and code snippets from user inputs. Now with user authentication and a credit-based AI enhancement system.

## Features

### Core SEO Generation
- ✅ Generate comprehensive meta tags
- ✅ Open Graph and Twitter Card tags
- ✅ Structured data (JSON-LD)
- ✅ Complete HTML head section
- ✅ robots.txt and sitemap.xml
- ✅ Icon generation (favicons, app icons, social media images)
- ✅ Download all assets as ZIP file

### Authentication System
- ✅ User registration and login
- ✅ Session management
- ✅ Password hashing with bcrypt
- ✅ User profiles with usage history

### Credit System
- ✅ 10 free credits for new users
- ✅ 1 credit per AI enhancement
- ✅ Credit balance tracking
- ✅ Usage history logging
- ✅ Demo credit addition (for testing)

### Database Support
- ✅ SQLite (development)
- ✅ PostgreSQL (production)
- ✅ Automatic database switching

## Quick Start

### Prerequisites
- Node.js 16+ 
- npm or yarn
- Docker (optional, for production)

### Local Development

1. **Clone and install dependencies**
   ```bash
   git clone <repository-url>
   cd seo-generator
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Access the application**
   - Open http://localhost:3000
   - Register a new account
   - Start generating SEO assets!

### Production with Docker

1. **Build and run with Docker Compose**
   ```bash
   docker-compose up -d
   ```

2. **Access the application**
   - Open http://localhost:3000
   - The app will use PostgreSQL and Redis

## Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL=postgresql://seo_user:seo_password_2024@localhost:5432/seo_generator
NODE_ENV=production

# Session
SESSION_SECRET=your-super-secret-session-key-change-in-production

# Google AI (for description enhancement)
GENAI_API_KEY=your-google-ai-api-key

# Optional: Redis for session storage
REDIS_URL=redis://localhost:6379
```

## Database Setup

### Development (SQLite)
- Automatically creates `database/users.db`
- No additional setup required

### Production (PostgreSQL)
1. **Using Docker Compose (recommended)**
   ```bash
   docker-compose up -d postgres
   ```

2. **Manual PostgreSQL setup**
   ```sql
   CREATE DATABASE seo_generator;
   CREATE USER seo_user WITH PASSWORD 'seo_password_2024';
   GRANT ALL PRIVILEGES ON DATABASE seo_generator TO seo_user;
   ```

## API Endpoints

### Authentication
- `GET /auth/register` - Registration page
- `POST /auth/register` - Create new account
- `GET /auth/login` - Login page
- `POST /auth/login` - Authenticate user
- `GET /auth/logout` - Logout user
- `GET /auth/profile` - User profile (requires auth)

### SEO Generation
- `GET /` - Main application
- `POST /generate` - Generate SEO assets
- `POST /enhance-description` - AI enhancement (requires auth + credits)
- `POST /download` - Download ZIP file

### Credit Management
- `POST /auth/add-credits` - Add demo credits (requires auth)

## Credit System

### How it works
- New users get 10 free credits
- Each AI description enhancement costs 1 credit
- Credits are deducted before processing
- Usage is logged with timestamps
- Insufficient credits show appropriate error messages

### Adding Credits
For demo purposes, users can add credits from their profile page. In production, you would integrate with a payment system.

## File Structure

```
seo-generator/
├── database/           # Database modules
│   ├── database.js     # SQLite implementation
│   ├── postgres.js     # PostgreSQL implementation
│   ├── config.js       # Database configuration
│   └── init.sql        # PostgreSQL schema
├── middleware/         # Authentication middleware
├── routes/            # Application routes
│   ├── index.js       # Main routes
│   └── auth.js        # Authentication routes
├── views/             # EJS templates
│   ├── index.ejs      # Main page
│   └── auth/          # Authentication pages
├── public/            # Static assets
├── utils/             # Utility functions
├── docker-compose.yml # Docker configuration
└── server.js          # Main application
```

## Security Features

- ✅ Password hashing with bcrypt
- ✅ Session-based authentication
- ✅ CSRF protection
- ✅ Rate limiting
- ✅ Helmet.js security headers
- ✅ Input validation and sanitization
- ✅ SQL injection prevention

## Deployment

### Docker (Recommended)
```bash
# Production
docker-compose -f docker-compose.yml up -d

# Development
docker-compose -f docker-compose.dev.yml up -d
```

### Manual Deployment
1. Set up PostgreSQL database
2. Configure environment variables
3. Install dependencies: `npm install --production`
4. Start the application: `npm start`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Create an issue on GitHub
- Check the documentation
- Review the code comments

---

**Note**: This application uses Google's Generative AI for description enhancement. Make sure to set up your `GENAI_API_KEY` in the environment variables.
