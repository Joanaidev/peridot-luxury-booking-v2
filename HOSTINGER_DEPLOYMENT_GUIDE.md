# Hostinger Deployment Troubleshooting Guide

## 🚨 Current Issues
Your app is slow and malfunctioning on Hostinger due to Firebase configuration and build optimization issues.

## 🔧 Quick Fix Steps

### 1. Optimize Firebase Configuration
The current Firebase setup has performance issues in production. Run this command to optimize:

```bash
node deploy-optimize.js
```

### 2. Build for Production
Use the optimized build command:

```bash
npm run build:prod
```

### 3. Upload to Hostinger
- Upload **ALL** contents from the `build` folder
- Do NOT upload the `build` folder itself
- Ensure all `.js` files are included

## 🔍 Common Hostinger Issues

### Issue 1: Missing Firebase Files
**Symptoms:** App loads but Firebase functions don't work
**Solution:** Check that these files are uploaded:
- `static/js/` folder (contains Firebase bundles)
- `static/css/` folder
- `index.html`

### Issue 2: Slow Loading
**Symptoms:** App takes forever to load
**Causes:**
- Firebase Analytics loading in production
- Large bundle sizes
- Missing optimizations

**Solutions:**
- Use the optimized Firebase config
- Enable gzip compression on Hostinger
- Use CDN for static assets

### Issue 3: Firebase Connection Errors
**Symptoms:** Console shows Firebase errors
**Solutions:**
- Check Firebase project settings
- Verify domain is whitelisted in Firebase Console
- Ensure API keys are correct

## 🛠️ Advanced Optimizations

### 1. Enable Gzip Compression
Add to `.htaccess` file in your Hostinger root:

```apache
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>
```

### 2. Cache Static Assets
Add to `.htaccess`:

```apache
<IfModule mod_expires.c>
    ExpiresActive on
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
</IfModule>
```

### 3. Check File Permissions
Ensure files have correct permissions:
- Files: 644
- Directories: 755

## 🔍 Debugging Steps

### 1. Check Browser Console
Open browser dev tools and look for:
- Missing file errors (404s)
- Firebase connection errors
- JavaScript errors

### 2. Verify Firebase Connection
Add this to your app temporarily:

```javascript
// Add to App.js temporarily for debugging
useEffect(() => {
  console.log('Firebase status:', db ? 'Connected' : 'Not connected');
  if (db) {
    console.log('Firebase config:', db.app.options);
  }
}, []);
```

### 3. Test Firebase Functions
Try a simple Firebase operation:

```javascript
// Test in browser console
import { getDocs, collection } from 'firebase/firestore';
import { db } from './firebase';

getDocs(collection(db, 'bookings'))
  .then(snapshot => console.log('Firebase working:', snapshot.size))
  .catch(error => console.error('Firebase error:', error));
```

## 📋 Deployment Checklist

- [ ] Run `node deploy-optimize.js`
- [ ] Run `npm run build:prod`
- [ ] Upload ALL files from `build` folder
- [ ] Check file permissions (644 for files, 755 for folders)
- [ ] Add `.htaccess` file with optimizations
- [ ] Test Firebase connection
- [ ] Check browser console for errors
- [ ] Verify all features work

## 🆘 Still Having Issues?

1. **Check Hostinger Error Logs**
   - Access via Hostinger control panel
   - Look for PHP or server errors

2. **Test Locally First**
   - Run `npm run build:prod`
   - Test locally with `npx serve -s build`

3. **Contact Support**
   - Provide error logs
   - Share browser console errors
   - Include Firebase project details

## 🎯 Performance Tips

1. **Use CDN** for static assets
2. **Enable compression** on Hostinger
3. **Optimize images** before upload
4. **Minimize bundle size** with code splitting
5. **Use lazy loading** for components

## 📞 Need Help?

If you're still experiencing issues:
1. Check the browser console for specific errors
2. Verify all files are uploaded correctly
3. Test Firebase connection manually
4. Consider using a different hosting provider (Vercel, Netlify) for better React support 