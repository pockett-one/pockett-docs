# Environment Variables Checklist

## ✅ **Variables That Should Be in Your `.env` File**

Based on the codebase analysis, here are all the environment variables currently being used:

### **Required Variables:**
```bash
# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Google Drive OAuth
GOOGLE_DRIVE_CLIENT_ID=your_google_drive_client_id
GOOGLE_DRIVE_CLIENT_SECRET=your_google_drive_client_secret

# Google OAuth (for Supabase Auth)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Database
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"
```

### **Optional Variables:**
```bash
# OpenAI API Key (for Supabase AI features)
OPENAI_API_KEY=your_openai_api_key
```

### **Automatically Set Variables:**
```bash
# These are set automatically by Next.js/deployment platform
NODE_ENV=development  # or production
```

## 🔍 **How to Check Your Current `.env` File**

1. **Open your existing `.env` file** in `frontend/.env`
2. **Compare with the checklist above**
3. **Add any missing variables** from the list above
4. **Ensure all placeholder values are replaced** with actual credentials

## 📝 **Key Variables Added in Recent Changes**

The main new variable that might be missing from your existing `.env` file is:
- `NEXT_PUBLIC_APP_URL` - This is now used by the new configuration system

## 🚀 **Next Steps**

1. **Check your existing `.env` file** for the variables listed above
2. **Add `NEXT_PUBLIC_APP_URL=http://localhost:3000`** if it's missing
3. **Ensure all OAuth credentials are properly set**
4. **Test your application** to make sure everything works

## 🔧 **If You Need to Merge Variables**

If you need to merge new variables into your existing `.env` file:

1. **Copy the template**: `cp env.example frontend/.env.new`
2. **Compare with your existing file**
3. **Merge any missing variables**
4. **Replace your existing `.env` file**

The updated `env.example` file now contains all the variables currently used in your codebase!
