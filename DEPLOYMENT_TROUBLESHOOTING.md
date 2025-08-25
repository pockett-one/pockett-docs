# Vercel Deployment Troubleshooting Guide

## Current Issue: 404 NOT_FOUND Error

### Possible Causes & Solutions:

#### 1. **Build Configuration Issues**
- ✅ **Fixed**: Moved `vercel.json` to `frontend/` directory
- ✅ **Fixed**: Moved `.vercelignore` to `frontend/` directory
- ✅ **Verified**: Local build works successfully

#### 2. **Vercel Project Settings**
In your Vercel dashboard, ensure:
- **Root Directory**: Set to `frontend`
- **Framework Preset**: Next.js (auto-detected)
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

#### 3. **Environment Variables**
Check if you need to set:
- `NODE_ENV=production`
- Any API keys or configuration

#### 4. **Deployment Steps**
1. **Connect Repository**: Import your GitHub repo to Vercel
2. **Set Root Directory**: Change from `/` to `/frontend`
3. **Deploy**: Let Vercel auto-detect Next.js settings

#### 5. **Common Vercel Issues**
- **404 Error**: Usually means build failed or routing issue
- **Build Failures**: Check build logs in Vercel dashboard
- **Missing Files**: Ensure all source files are committed

#### 6. **Verification Steps**
- ✅ Local build: `npm run build` ✅
- ✅ Vercel config files in correct location ✅
- ✅ Next.js config properly set ✅
- ✅ All dependencies in package.json ✅

#### 7. **Next Steps**
1. **Redeploy**: After fixing config file locations
2. **Check Build Logs**: In Vercel dashboard for errors
3. **Verify Routes**: Ensure all pages are accessible
4. **Test API Routes**: Check if API endpoints work

### **If Still Having Issues:**
1. Check Vercel build logs
2. Verify all files are committed to GitHub
3. Ensure root directory is set to `frontend` in Vercel
4. Try clearing Vercel cache and redeploying
