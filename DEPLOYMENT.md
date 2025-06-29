# 🚀 Deployment Guide

This guide will help you deploy your Service Booking Platform to various hosting platforms.

## 📋 Prerequisites

Before deploying, ensure you have:
- ✅ All environment variables configured
- ✅ MongoDB database set up (local or cloud)
- ✅ Google Maps API key (optional)
- ✅ Email service configured
- ✅ Cloudinary account for image uploads

## 🌐 Frontend Deployment

### Vercel (Recommended)

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy from client directory**
   ```bash
   cd client
   vercel --prod
   ```

3. **Configure Environment Variables**
   - Go to Vercel Dashboard
   - Select your project
   - Go to Settings > Environment Variables
   - Add:
     ```
     VITE_API_URL=https://your-backend-url.com
     VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
     ```

### Netlify

1. **Build the project**
   ```bash
   cd client
   npm run build
   ```

2. **Deploy to Netlify**
   - Drag and drop the `dist` folder to Netlify
   - Or use Netlify CLI:
   ```bash
   npm install -g netlify-cli
   netlify deploy --prod --dir=dist
   ```

3. **Configure Environment Variables**
   - Go to Site Settings > Environment Variables
   - Add the same variables as above

## 🔧 Backend Deployment

### Railway (Recommended)

1. **Connect GitHub Repository**
   - Go to [Railway](https://railway.app/)
   - Connect your GitHub account
   - Select your repository

2. **Configure Environment Variables**
   ```env
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   JWT_REFRESH_SECRET=your_refresh_secret
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_email_app_password
   CLOUDINARY_CLOUD_NAME=your_cloudinary_name
   CLOUDINARY_API_KEY=your_cloudinary_key
   CLOUDINARY_API_SECRET=your_cloudinary_secret
   ```

3. **Deploy**
   - Railway will automatically detect your Node.js app
   - Set the root directory to `server`
   - Deploy will start automatically

### Heroku

1. **Install Heroku CLI**
   ```bash
   npm install -g heroku
   ```

2. **Create Heroku App**
   ```bash
   heroku create your-app-name
   ```

3. **Set Environment Variables**
   ```bash
   heroku config:set MONGODB_URI=your_mongodb_connection_string
   heroku config:set JWT_SECRET=your_jwt_secret
   heroku config:set JWT_REFRESH_SECRET=your_refresh_secret
   heroku config:set EMAIL_USER=your_email@gmail.com
   heroku config:set EMAIL_PASS=your_email_app_password
   heroku config:set CLOUDINARY_CLOUD_NAME=your_cloudinary_name
   heroku config:set CLOUDINARY_API_KEY=your_cloudinary_key
   heroku config:set CLOUDINARY_API_SECRET=your_cloudinary_secret
   ```

4. **Deploy**
   ```bash
   git add .
   git commit -m "Deploy to Heroku"
   git push heroku main
   ```

### Render

1. **Connect Repository**
   - Go to [Render](https://render.com/)
   - Connect your GitHub repository

2. **Create Web Service**
   - Choose "Web Service"
   - Set root directory to `server`
   - Set build command: `npm install`
   - Set start command: `npm start`

3. **Configure Environment Variables**
   - Add all environment variables in the dashboard

## 🗄️ Database Setup

### MongoDB Atlas (Recommended)

1. **Create Cluster**
   - Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
   - Create a free cluster

2. **Configure Network Access**
   - Add your IP address or `0.0.0.0/0` for all IPs

3. **Create Database User**
   - Create a database user with read/write permissions

4. **Get Connection String**
   - Copy the connection string
   - Replace `<password>` with your actual password
   - Replace `<dbname>` with your database name

### Local MongoDB

For development, you can use local MongoDB:
```env
MONGODB_URI=mongodb://localhost:27017/service-booking
```

## 📧 Email Service Setup

### Gmail (Recommended)

1. **Enable 2-Factor Authentication**
2. **Generate App Password**
   - Go to Google Account settings
   - Security > 2-Step Verification > App passwords
   - Generate password for "Mail"

3. **Configure Environment Variables**
   ```env
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   ```

### Other Email Services

You can also use:
- **SendGrid**
- **Mailgun**
- **AWS SES**

## ☁️ Image Upload Setup

### Cloudinary (Recommended)

1. **Create Account**
   - Go to [Cloudinary](https://cloudinary.com/)
   - Create a free account

2. **Get Credentials**
   - Copy Cloud Name, API Key, and API Secret

3. **Configure Environment Variables**
   ```env
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

## 🔐 Security Checklist

Before going live:

- ✅ **Environment Variables**: All sensitive data in environment variables
- ✅ **CORS Configuration**: Proper CORS settings for your domain
- ✅ **Rate Limiting**: Implement rate limiting on API endpoints
- ✅ **Input Validation**: Validate all user inputs
- ✅ **HTTPS**: Use HTTPS in production
- ✅ **API Key Restrictions**: Restrict Google Maps API key to your domain
- ✅ **Database Security**: Use strong database passwords
- ✅ **JWT Secrets**: Use strong, unique JWT secrets

## 🚀 Post-Deployment

### 1. Test Your Application
- ✅ Test user registration and login
- ✅ Test service creation and booking
- ✅ Test file uploads
- ✅ Test email functionality
- ✅ Test Google Maps integration

### 2. Monitor Performance
- Set up logging and monitoring
- Monitor database performance
- Track API response times
- Monitor error rates

### 3. Set Up Analytics
- Google Analytics for frontend
- Application performance monitoring
- Error tracking (Sentry, LogRocket)

## 🔧 Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure CORS is configured for your frontend domain
   - Check if frontend URL is correct

2. **Database Connection Issues**
   - Verify MongoDB connection string
   - Check network access settings
   - Ensure database user has correct permissions

3. **Email Not Sending**
   - Verify email credentials
   - Check if 2FA is enabled for Gmail
   - Verify app password is correct

4. **Image Upload Issues**
   - Verify Cloudinary credentials
   - Check file size limits
   - Ensure proper file types

### Getting Help

- Check the application logs
- Verify all environment variables are set
- Test endpoints with Postman
- Check browser console for frontend errors

## 📞 Support

If you encounter issues during deployment:
- Check the [GitHub Issues](https://github.com/yourusername/service-booking-platform/issues)
- Create a new issue with detailed error information
- Include environment details and error logs

---

**Happy Deploying! 🚀** 