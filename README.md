# 🏠 Home Service Platform - Hourly

A modern, full-stack home service booking platform built with React, Node.js, and MongoDB. Connect service providers with customers through an intelligent interface featuring AI-powered recommendations, real-time chat, location-based services, and seamless booking management.

![React](https://img.shields.io/badge/React-18.3.1-blue?style=for-the-badge&logo=react)
![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=for-the-badge&logo=node.js)
![MongoDB](https://img.shields.io/badge/MongoDB-6.0+-green?style=for-the-badge&logo=mongodb)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4.9-blue?style=for-the-badge&logo=tailwind-css)
![AI Powered](https://img.shields.io/badge/AI-Powered-orange?style=for-the-badge&logo=openai)

## ✨ Key Features

### 🤖 AI-Powered Recommendations
- **Hybrid Recommendation System**: Combines collaborative filtering, content-based filtering, and location-based filtering
- **Smart Tag Generation**: NLP-powered tag extraction from service descriptions and user interactions
- **Personalized Suggestions**: AI chatbot that learns from user preferences and provides intelligent service recommendations
- **Interaction Tracking**: Tracks clicks, views, bookings, and chat interactions for better recommendations
- **Real-time Learning**: Continuously improves recommendations based on user behavior

### 💬 Intelligent Chat System
- **AI Chatbot**: Smart bot that understands user queries and provides service recommendations
- **Real-time Messaging**: Live chat between customers and service providers
- **Contextual Suggestions**: Bot suggests relevant services based on conversation context
- **Tag Profile Management**: Automatically extracts and manages user interest tags from conversations
- **Enhanced UI**: Beautiful chat interface with bot message styling and recommendation sidebar

### 🗺️ Advanced Location Services
- **High-Accuracy Geolocation**: GPS-enabled location detection with accuracy tracking
- **Smart Address Resolution**: Intelligent reverse geocoding with multiple fallback options
- **Distance-Based Filtering**: Services filtered by proximity to user location
- **Interactive Maps**: Google Maps integration for service location visualization
- **Location-Based Recommendations**: Prioritizes nearby services in recommendations

### 🔐 Secure Authentication & User Management
- **Multi-role System**: Customer and Service Provider roles with role-based access
- **JWT Authentication**: Secure token-based authentication with refresh tokens
- **Email Verification**: OTP-based email verification system
- **Password Recovery**: Secure password reset with email confirmation
- **Profile Management**: Complete user profile customization with avatar support

### 📅 Smart Booking Management
- **Flexible Scheduling**: Book services by hours, days, or months
- **Real-time Availability**: Instant booking confirmation with provider notification
- **Booking History**: Complete booking history with status tracking
- **Timezone Handling**: Proper timezone management for accurate scheduling
- **Booking Analytics**: Track booking patterns and service popularity

### ⭐ Reviews & Ratings System
- **Service Reviews**: Customer reviews with detailed feedback
- **Provider Ratings**: Average rating calculations with review count
- **Review Moderation**: Admin tools for review management
- **Rating Impact**: Reviews influence recommendation scores

### 🎨 Modern UI/UX Design
- **Responsive Design**: Perfect experience across all devices
- **Smooth Animations**: Framer Motion powered transitions
- **Loading States**: Professional loading indicators and skeleton screens
- **Dark/Light Themes**: Beautiful, modern interface with theme support
- **Accessibility**: WCAG compliant design with keyboard navigation

## 🚀 Recent Enhancements

### 🎯 Enhanced Recommendation Engine
- **Improved Tag Matching**: Fuzzy matching with Levenshtein distance for better tag relevance
- **Time-based Decay**: Tags lose relevance over time to keep recommendations fresh
- **Threshold Pruning**: Removes low-relevance tags to maintain profile quality
- **Collaborative Filtering**: Considers similar users' preferences
- **Content-based Filtering**: Analyzes service descriptions and user interactions
- **Location Bonuses**: Extra scoring for services near user location

### 💬 Advanced Chat Features
- **Bot Message Styling**: Distinctive yellow-orange theme for bot messages
- **Recommendation Sidebar**: Real-time service suggestions during chat
- **Tag Extraction**: Automatically extracts relevant tags from bot responses
- **Contextual Prompts**: Smart suggestion buttons for common queries
- **Full-height Layout**: Immersive chat experience with fixed viewport

### 📍 Improved Location Detection
- **High Accuracy Mode**: GPS-enabled location with accuracy tracking
- **Smart Error Handling**: Specific error messages for different geolocation issues
- **Better Address Resolution**: Intelligent address building from coordinates
- **Loading States**: Visual feedback during location detection
- **Fallback Options**: Multiple address component fallbacks

### 🕒 Enhanced Timezone Management
- **Local Time Display**: Proper timezone handling in booking interface
- **ISO Conversion**: Accurate time conversion for backend storage
- **Date Validation**: Prevents booking past dates or dates too far in future
- **30-minute Intervals**: Smart time rounding for better scheduling

## 📸 Screenshots

### 🏠 Homepage
![Homepage](https://github.com/user-attachments/assets/e7fbe87d-16b1-406c-a9fe-84c2dbd7b501)
*Welcome page with featured services and categories*

### 🤖 AI Chatbot
![AI Chatbot](https://via.placeholder.com/800x400/4F46E5/FFFFFF?text=AI+Chatbot+Interface)
*Intelligent chatbot with recommendation sidebar*

### 🎯 Smart Recommendations
![Recommendations](https://github.com/user-attachments/assets/59ebed57-3629-4c03-a6d0-59efe39a1765)
*Personalized service recommendations based on user behavior*

### 📱 Service Details
![Service Details](https://github.com/user-attachments/assets/1f619e71-5efe-45dd-a794-6e018aaa187d)
*Detailed service information with reviews and booking options*

### 🗺️ Location Services
![Location Services](https://via.placeholder.com/800x400/10B981/FFFFFF?text=Location+Based+Services)
*Interactive map with service locations and distance calculation*

### 💬 Real-time Chat
![Real-time Chat](https://via.placeholder.com/800x400/8B5CF6/FFFFFF?text=Real-time+Chat+Interface)
*Live chat between customers and service providers*

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern React with hooks and functional components
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Smooth animations and transitions
- **React Router** - Client-side routing
- **Redux Toolkit** - State management
- **Axios** - HTTP client for API calls
- **React Hook Form** - Form handling and validation
- **React Hot Toast** - Beautiful notifications
- **React Icons** - Icon library

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - JSON Web Tokens for authentication
- **Multer** - File upload handling
- **Nodemailer** - Email sending functionality
- **Bcrypt** - Password hashing
- **Cloudinary** - Image storage and optimization

### AI & Machine Learning
- **Natural Language Processing** - Content-based filtering and tag extraction
- **Collaborative Filtering** - User-based recommendations
- **Location-based Filtering** - Geographic recommendations
- **Hybrid Recommendation System** - Combined approach for better accuracy
- **Fuzzy String Matching** - Levenshtein distance for tag matching
- **Time-based Decay** - Tag relevance decay over time

### External APIs
- **Google Maps API** - Location services and mapping
- **OpenCage Geocoding** - Reverse geocoding for address resolution
- **Cloudinary** - Image upload and management

## 📦 Installation

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (v6.0 or higher)
- npm or pnpm
- Google Maps API key
- Cloudinary account

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/home-service-platform.git
cd home-service-platform
```

### 2. Install Dependencies

#### Backend Setup
```bash
cd server
npm install
```

#### Frontend Setup
```bash
cd client
npm install
```

### 3. Environment Configuration

#### Backend (.env in server directory)
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/home-service
JWT_SECRET=your_jwt_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
```

#### Frontend (.env in client directory)
```env
VITE_API_URL=http://localhost:5000
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### 4. Database Setup
```bash
# Start MongoDB (if not running)
mongod

# The application will automatically create collections
```

### 5. Start the Application

#### Development Mode
```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm run dev
```

#### Production Mode
```bash
# Build frontend
cd client
npm run build

# Start backend
cd server
npm start
```

## 🚀 Usage

### For Service Providers
1. **Register** as a service provider
2. **Add Services** with location, pricing, and detailed descriptions
3. **Manage Bookings** and respond to customer requests via chat
4. **Track Performance** with analytics, reviews, and ratings
5. **Update Availability** and service details in real-time

### For Customers
1. **Browse Services** by category or location with smart filtering
2. **Get AI Recommendations** based on your preferences and behavior
3. **Chat with AI Bot** for personalized service suggestions
4. **Book Services** with flexible scheduling and location selection
5. **Rate & Review** completed services to help others
6. **Track Bookings** with real-time status updates

### AI Chatbot Features
1. **Ask Questions** about services, pricing, or availability
2. **Get Recommendations** based on your needs and preferences
3. **View Suggested Services** in the chat sidebar
4. **Extract Tags** automatically from conversations
5. **Improve Recommendations** through continued interaction

## 📁 Project Structure

```
home-service-platform/
├── client/                 # Frontend React application
│   ├── public/            # Static files
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   │   ├── Header.jsx
│   │   │   ├── ChatSection.jsx
│   │   │   ├── Recommendation.jsx
│   │   │   └── ...
│   │   ├── pages/         # Page components
│   │   │   ├── BotChat.jsx
│   │   │   ├── BookService.jsx
│   │   │   └── ...
│   │   ├── store/         # Redux store
│   │   ├── utils/         # Utility functions
│   │   └── common/        # Common configurations
│   └── package.json
├── server/                # Backend Node.js application
│   ├── controllers/       # Route controllers
│   │   ├── bot.controller.js
│   │   ├── recommendation.controller.js
│   │   └── ...
│   ├── models/           # MongoDB models
│   ├── routes/           # API routes
│   ├── middleware/       # Custom middleware
│   ├── utils/            # Utility functions
│   ├── recommendation service/  # AI recommendation algorithms
│   │   ├── collaborative_filtering.js
│   │   ├── content_based_filtering.js
│   │   ├── hybrid_filtering.js
│   │   └── location_based_filtering.js
│   └── package.json
├── SETUP.md              # Detailed setup instructions
├── GOOGLE_MAPS_SETUP.md  # Google Maps configuration
└── README.md
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/forgot-password` - Password recovery
- `POST /api/auth/reset-password` - Password reset
- `POST /api/auth/logout` - User logout

### Services
- `GET /api/service/all-services` - Get all services
- `POST /api/service/add-service` - Add new service
- `GET /api/service/:id` - Get service details
- `PUT /api/service/:id` - Update service
- `DELETE /api/service/:id` - Delete service

### Bookings
- `POST /api/booking/create-booking/:serviceId` - Create booking
- `GET /api/booking/user-bookings` - Get user bookings
- `PUT /api/booking/:id/status` - Update booking status
- `GET /api/booking/provider-bookings` - Get provider bookings

### AI & Recommendations
- `GET /api/recommendations` - Get personalized recommendations
- `POST /api/recommendations/extract-tags` - Extract tags from text
- `POST /api/recommendations/replace-profile` - Update user tag profile
- `POST /api/chat/bot` - AI chatbot responses
- `POST /api/interactions/:serviceId` - Track user interactions

### Chat System
- `POST /api/chat/chatroom/:bookingId` - Create chat room
- `GET /api/chat/chatroom/:bookingId/messages` - Get chat messages
- `POST /api/chat/chatroom/:bookingId/message` - Send message
- `GET /api/chat/user-chats` - Get user chat rooms

### Reviews & Ratings
- `POST /api/review/:serviceId` - Add review
- `GET /api/review/:serviceId` - Get service reviews
- `PUT /api/review/:id` - Update review
- `DELETE /api/review/:id` - Delete review

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/AmazingFeature`)
3. **Commit** your changes (`git commit -m 'Add some AmazingFeature'`)
4. **Push** to the branch (`git push origin feature/AmazingFeature`)
5. **Open** a Pull Request

### Development Guidelines
- Follow ESLint configuration
- Write meaningful commit messages
- Test your changes thoroughly
- Update documentation if needed
- Ensure responsive design works on all devices

## 🐛 Bug Reports

If you discover any bugs, please create an issue with:
- **Description** of the bug
- **Steps** to reproduce
- **Expected** vs **Actual** behavior
- **Screenshots** if applicable
- **Environment** details (browser, OS, etc.)

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **React Team** for the amazing framework
- **Tailwind CSS** for the utility-first CSS framework
- **Framer Motion** for smooth animations
- **MongoDB** for the flexible database
- **Google Maps API** for location services
- **OpenCage** for geocoding services
- **Cloudinary** for image management

## 📞 Support

- **Email**: soumyadip2411@gmail.com
- **Documentation**: [Wiki](https://github.com/yourusername/home-service-platform/wiki)
- **Issues**: [GitHub Issues](https://github.com/yourusername/home-service-platform/issues)

## 🚀 Deployment

### Vercel (Frontend)
```bash
npm install -g vercel
vercel --prod
```

### Railway/Heroku (Backend)
```bash
# Add environment variables in your hosting platform
# Deploy using their respective CLI tools
```

### Environment Variables for Production
Make sure to set all required environment variables in your hosting platform:
- Database connection string
- JWT secrets
- Email credentials
- Cloudinary credentials
- Google Maps API key

## 🔮 Future Enhancements

- **Real-time Notifications**: Push notifications for booking updates
- **Payment Integration**: Stripe/PayPal payment processing
- **Video Calls**: In-app video consultation feature
- **Service Scheduling**: Advanced calendar integration
- **Analytics Dashboard**: Detailed insights for providers
- **Mobile App**: React Native mobile application
- **Multi-language Support**: Internationalization
- **Advanced AI**: Machine learning for better recommendations

---

⭐ **Star this repository if you found it helpful!**

Made with ❤️ by Soumyadip Pramanik and team.
