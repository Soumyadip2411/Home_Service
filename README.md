# 🚀 Service Booking Platform

A modern, full-stack service booking platform built with React, Node.js, and MongoDB. Connect service providers with customers through an intuitive interface with location-based services, real-time recommendations, and seamless booking management.

![Service Booking Platform](https://img.shields.io/badge/React-18.3.1-blue?style=for-the-badge&logo=react)
![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=for-the-badge&logo=node.js)
![MongoDB](https://img.shields.io/badge/MongoDB-6.0+-green?style=for-the-badge&logo=mongodb)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4.9-blue?style=for-the-badge&logo=tailwind-css)

## ✨ Features

### 🔐 Authentication & User Management
- **Multi-role System**: Customer and Service Provider roles
- **Secure Authentication**: JWT-based authentication with refresh tokens
- **Email Verification**: OTP-based email verification system
- **Password Recovery**: Secure password reset functionality
- **Profile Management**: Complete user profile customization

### 🗺️ Location-Based Services
- **Interactive Maps**: Google Maps integration for service location
- **Distance Calculation**: Real-time distance from user location
- **Location Search**: Search services by area or address
- **Geolocation**: Automatic user location detection

### 🎯 Smart Recommendations
- **Hybrid Filtering**: Combines collaborative, content-based, and location-based filtering
- **Personalized Suggestions**: AI-powered service recommendations
- **Interaction Tracking**: Tracks user behavior for better recommendations
- **Category-based Filtering**: Browse services by category

### 📅 Booking Management
- **Real-time Booking**: Instant service booking with scheduling
- **Booking History**: Complete booking history for users
- **Status Tracking**: Real-time booking status updates
- **Duration Flexibility**: Book by hours, days, or months

### ⭐ Reviews & Ratings
- **Service Reviews**: Customer reviews and ratings
- **Provider Ratings**: Average rating calculations
- **Review Management**: Moderation and management tools

### 🎨 Modern UI/UX
- **Responsive Design**: Works perfectly on all devices
- **Dark/Light Themes**: Beautiful, modern interface
- **Smooth Animations**: Framer Motion powered animations
- **Loading States**: Professional loading indicators

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

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - JSON Web Tokens for authentication
- **Multer** - File upload handling
- **Nodemailer** - Email sending functionality
- **Bcrypt** - Password hashing

### AI & Machine Learning
- **Natural Language Processing** - Content-based filtering
- **Collaborative Filtering** - User-based recommendations
- **Location-based Filtering** - Geographic recommendations
- **Hybrid Recommendation System** - Combined approach

## 📦 Installation

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (v6.0 or higher)
- npm or pnpm

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/service-booking-platform.git
cd service-booking-platform
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
MONGODB_URI=mongodb://localhost:27017/service-booking
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
2. **Add Services** with location, pricing, and details
3. **Manage Bookings** and respond to customer requests
4. **Track Performance** with analytics and reviews

### For Customers
1. **Browse Services** by category or location
2. **Search & Filter** services based on preferences
3. **Book Services** with flexible scheduling
4. **Rate & Review** completed services

## 📁 Project Structure

```
service-booking-platform/
├── client/                 # Frontend React application
│   ├── public/            # Static files
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── store/         # Redux store
│   │   ├── utils/         # Utility functions
│   │   └── common/        # Common configurations
│   └── package.json
├── server/                # Backend Node.js application
│   ├── controllers/       # Route controllers
│   ├── models/           # MongoDB models
│   ├── routes/           # API routes
│   ├── middleware/       # Custom middleware
│   ├── utils/            # Utility functions
│   └── package.json
└── README.md
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/forgot-password` - Password recovery
- `POST /api/auth/reset-password` - Password reset

### Services
- `GET /api/service/all-services` - Get all services
- `POST /api/service/add-service` - Add new service
- `GET /api/service/:id` - Get service details
- `PUT /api/service/:id` - Update service

### Bookings
- `POST /api/booking/create-booking/:serviceId` - Create booking
- `GET /api/booking/user-bookings` - Get user bookings
- `PUT /api/booking/:id/status` - Update booking status

### Recommendations
- `GET /api/recommendations` - Get personalized recommendations

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

## 🐛 Bug Reports

If you discover any bugs, please create an issue with:
- **Description** of the bug
- **Steps** to reproduce
- **Expected** vs **Actual** behavior
- **Screenshots** if applicable
- **Environment** details

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **React Team** for the amazing framework
- **Tailwind CSS** for the utility-first CSS framework
- **Framer Motion** for smooth animations
- **MongoDB** for the flexible database
- **Google Maps API** for location services

## 📞 Support

- **Email**: soumyadip2411@gmail.com
- **Documentation**: [Wiki](https://github.com/yourusername/service-booking-platform/wiki)
- **Issues**: [GitHub Issues](https://github.com/yourusername/service-booking-platform/issues)

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

---

⭐ **Star this repository if you found it helpful!**

Made with ❤️ by Soumyadip Pramanik and teams. 
