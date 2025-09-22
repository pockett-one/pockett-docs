# Environment Configuration Guide

This guide explains how to properly configure environment variables to avoid hardcoded localhost references and ensure your application works across different environments.

## 🚀 Quick Setup

### 1. Copy Environment Files
```bash
# For local development
cp env.example frontend/.env.local

# For production (when deploying)
cp env.production.example frontend/.env.production
```

### 2. Fill in Your Values
Edit the copied files and replace placeholder values with your actual credentials.

## 📁 Environment Files

### `.env.local` (Local Development)
- Contains local development configuration
- Uses localhost URLs and local Supabase instance
- **Never commit this file to git**

### `.env.production` (Production)
- Contains production configuration
- Uses production URLs and Supabase instance
- **Never commit this file to git**

### `env.example` (Template)
- Template for local development
- Safe to commit to git
- Contains placeholder values

### `env.production.example` (Production Template)
- Template for production deployment
- Safe to commit to git
- Contains placeholder values

## 🔧 Configuration Details

### Required Environment Variables

#### Application Configuration
- `NEXT_PUBLIC_APP_URL`: The base URL of your application
  - Local: `http://localhost:3000`
  - Production: `https://yourdomain.com`

#### Supabase Configuration
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
  - Local: `http://127.0.0.1:54321`
  - Production: `https://your-project.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key

#### Google Drive OAuth
- `GOOGLE_DRIVE_CLIENT_ID`: Google Drive OAuth client ID
- `GOOGLE_DRIVE_CLIENT_SECRET`: Google Drive OAuth client secret

#### Google OAuth (for Supabase Auth)
- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret

## 🏗️ Architecture Changes

### New Configuration System
The application now uses a centralized configuration system in `frontend/lib/config.ts`:

```typescript
import { config, getAppUrl, getRedirectUrl } from '@/lib/config'

// Dynamic URL construction
const redirectUrl = getRedirectUrl('/dash/connectors')
const appUrl = getAppUrl()
```

### Benefits
- ✅ No hardcoded localhost references
- ✅ Environment-aware URL construction
- ✅ Centralized configuration management
- ✅ Easy deployment across environments

## 🚀 Deployment

### Vercel Deployment
1. Set environment variables in Vercel dashboard
2. Use production values from `env.production.example`
3. Ensure `NEXT_PUBLIC_APP_URL` points to your Vercel domain

### Other Platforms
1. Copy `env.production.example` to your deployment platform
2. Fill in production values
3. Ensure all environment variables are set

## 🔍 OAuth Configuration

### Google Drive OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth 2.0 credentials
3. Add authorized redirect URIs:
   - Local: `http://localhost:3000/api/connectors/google-drive/callback`
   - Production: `https://yourdomain.com/api/connectors/google-drive/callback`

### Supabase Auth Setup
1. Configure OAuth providers in Supabase dashboard
2. Add redirect URLs:
   - Local: `http://localhost:3000/dash/connectors`
   - Production: `https://yourdomain.com/dash/connectors`

## 🛠️ Development

### Local Development
```bash
# Start Supabase locally
supabase start

# Start Next.js development server
npm run dev
```

### Testing OAuth Flows
1. Ensure all environment variables are set
2. Test OAuth flows in both development and production
3. Verify redirect URLs work correctly

## 🔒 Security Notes

- Never commit `.env.local` or `.env.production` files
- Use environment variable substitution in configuration files
- Rotate OAuth credentials regularly
- Use different credentials for development and production

## 🐛 Troubleshooting

### Common Issues
1. **OAuth redirect errors**: Check redirect URIs in OAuth provider settings
2. **Supabase connection issues**: Verify Supabase URL and keys
3. **Environment variable not loading**: Ensure file is named correctly (`.env.local`)

### Debug Mode
Set `NODE_ENV=development` to enable debug logging and see which URLs are being used.

## 📚 Additional Resources

- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Supabase Configuration](https://supabase.com/docs/guides/local-development)
- [Google OAuth Setup](https://developers.google.com/identity/protocols/oauth2)
