# 🚀 Deployment Checklist for Peridot Luxury Booking

## Pre-Deployment Checks ✅

### 1. **Build Verification**
- [ ] Run `npm run build:prod` successfully
- [ ] Check build output in `build/` folder
- [ ] Verify all static assets are generated
- [ ] Test build locally with `serve -s build`

### 2. **Firebase Configuration**
- [ ] Firebase config is production-ready
- [ ] Analytics only loads in production (not localhost)
- [ ] Firebase project is properly set up
- [ ] Firestore rules are configured correctly

### 3. **Performance Optimizations**
- [ ] Console.log statements removed/commented for production
- [ ] Source maps disabled for production
- [ ] Gzip compression enabled (via .htaccess)
- [ ] Browser caching configured
- [ ] Images optimized and compressed

### 4. **Security Headers**
- [ ] Security headers configured in .htaccess
- [ ] X-Content-Type-Options: nosniff
- [ ] X-Frame-Options: DENY
- [ ] X-XSS-Protection: 1; mode=block
- [ ] Referrer-Policy: strict-origin-when-cross-origin

## Deployment Platforms

### **Vercel Deployment**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

**Vercel Configuration:**
- ✅ `vercel.json` configured
- ✅ Build command: `npm run build`
- ✅ Output directory: `build`
- ✅ Framework: `create-react-app`
- ✅ Rewrites configured for SPA routing

### **Hostinger Deployment**
1. Run `npm run build:prod`
2. Upload entire `build/` folder contents to public_html
3. Ensure `.htaccess` is uploaded
4. Verify all files are uploaded correctly

### **Netlify Deployment**
1. Connect GitHub repository
2. Build command: `npm run build`
3. Publish directory: `build`
4. Add environment variables if needed

## Post-Deployment Verification

### 1. **Functionality Tests**
- [ ] Homepage loads correctly
- [ ] Booking flow works end-to-end
- [ ] Admin login works
- [ ] Firebase connection established
- [ ] Forms submit successfully
- [ ] Calendar displays correctly
- [ ] Mobile responsiveness works

### 2. **Performance Tests**
- [ ] Page load time < 3 seconds
- [ ] Mobile performance optimized
- [ ] Images load quickly
- [ ] No console errors
- [ ] Smooth animations

### 3. **SEO & Meta Tags**
- [ ] Title tag is correct
- [ ] Meta description is present
- [ ] Keywords are set
- [ ] Open Graph tags configured
- [ ] Favicon displays correctly

### 4. **Mobile Testing**
- [ ] Test on iOS Safari
- [ ] Test on Android Chrome
- [ ] Test on various screen sizes
- [ ] Touch interactions work properly
- [ ] No horizontal scrolling

### 5. **Browser Compatibility**
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile browsers

## Common Issues & Solutions

### **Issue: Firebase Connection Fails**
**Solution:**
- Check Firebase config in `src/firebase.js`
- Verify project ID and API keys
- Check Firestore rules

### **Issue: Build Fails**
**Solution:**
- Run `npm install` to ensure dependencies
- Clear node_modules and reinstall
- Check for syntax errors in code

### **Issue: Routing Doesn't Work**
**Solution:**
- Ensure `.htaccess` is uploaded (Hostinger)
- Check `vercel.json` rewrites (Vercel)
- Verify SPA routing configuration

### **Issue: Mobile Performance Issues**
**Solution:**
- Optimize images further
- Check CSS for performance issues
- Verify mobile-specific styles

### **Issue: Admin Not Working**
**Solution:**
- Check Firebase permissions
- Verify admin credentials
- Test Firebase connection

## Environment Variables (if needed)

```bash
# For Vercel/Netlify
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
```

## Monitoring & Analytics

### **Firebase Analytics**
- [ ] Analytics tracking enabled
- [ ] Events properly configured
- [ ] Conversion tracking set up

### **Error Monitoring**
- [ ] Console errors monitored
- [ ] User feedback collected
- [ ] Performance metrics tracked

## Backup & Recovery

### **Before Deployment**
- [ ] Backup current version
- [ ] Document current configuration
- [ ] Test rollback procedure

### **After Deployment**
- [ ] Monitor for 24-48 hours
- [ ] Check error logs
- [ ] Verify all functionality
- [ ] Test admin features

## Final Checklist

- [ ] All tests pass
- [ ] Build completes without errors
- [ ] Deployment successful
- [ ] Site loads correctly
- [ ] All features working
- [ ] Mobile responsive
- [ ] Performance optimized
- [ ] Security headers active
- [ ] Analytics tracking
- [ ] Backup created

---

**Deployment Command:**
```bash
npm run build:prod
```

**Test Command:**
```bash
serve -s build
```

**Emergency Rollback:**
1. Restore previous version
2. Update DNS if needed
3. Clear CDN cache 