import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/userSlice';
import { toast } from 'react-hot-toast';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import { FiMapPin } from 'react-icons/fi';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user);
  
  const isBookingsActive = location.pathname === '/bookings';
  const isServicesActive = location.pathname === '/services';
  const isRecommendationsActive = location.pathname === '/recommendations';
  const [currentLocation, setCurrentLocation] = useState('Loading location...');

  // Add handleLogout function
  const handleLogout = async () => {
    try {
      const response = await Axios(SummaryApi.logout);
      
      if (response.data.success) {
        localStorage.removeItem("accesstoken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("userLat");
        localStorage.removeItem("userLng");
        
        dispatch(logout());
        toast.success("Logged out successfully");
        navigate("/login");
      }
    } catch (error) {
      toast.error("Failed to logout");
    }
  };

  useEffect(() => {
    const userLat = localStorage.getItem('userLat');
    const userLng = localStorage.getItem('userLng');

    if (userLat && userLng) {
      // Convert coordinates to address using reverse geocoding
      fetch(`https://api.opencagedata.com/geocode/v1/json?q=${userLat}+${userLng}&key=84c8eaa39d454ab8a34547a3c3043670`)
        .then(response => response.json())
        .then(data => {
          if (data.results && data.results[0]) {
            const address = data.results[0].formatted.split(',')[1] || data.results[0].formatted;
            setCurrentLocation(address);
          }
        })
        .catch(() => setCurrentLocation('Location unavailable'));
    } else {
      setCurrentLocation('Location unavailable');
    }
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 bg-black/80 backdrop-blur-md z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center gap-6">
            {/* User Profile Section */}
            <div className="flex items-center gap-3">
              <img
                src={user.avatar || "https://ui-avatars.com/api/?name=" + user.name}
                alt="Profile"
                className="w-10 h-10 rounded-full border-2 border-green-500"
              />
              <div>
                <h3 className="text-white font-medium">{user.name}</h3>
                <p className="text-gray-300 text-sm">{user.role}</p>
              </div>
            </div>

            {/* Location Display */}
            <div className="flex items-center gap-2 text-gray-300">
              <FiMapPin className="text-green-500" />
              <span className="text-sm">{currentLocation}</span>
            </div>
          </div>

          {/* Updated Navigation Buttons */}
          <motion.nav className="flex gap-4">
            <motion.button 
              onClick={() => navigate('/')}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                !isBookingsActive && !isServicesActive && !isRecommendationsActive
                  ? 'bg-green-600 text-white' 
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Home
            </motion.button>
            <motion.button 
              onClick={() => navigate('/recommendations')}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                isRecommendationsActive 
                  ? 'bg-green-600 text-white' 
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Recommendations
            </motion.button>
            <motion.button 
              onClick={() => navigate('/bookings')}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                isBookingsActive 
                  ? 'bg-green-600 text-white' 
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Bookings
            </motion.button>
            <motion.button 
              onClick={() => navigate('/services')}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                isServicesActive 
                  ? 'bg-green-600 text-white' 
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Services
            </motion.button>
            <motion.button 
              onClick={handleLogout}
              className="px-6 py-2 rounded-lg font-medium bg-red-600 text-white hover:bg-red-700"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Logout
            </motion.button>
          </motion.nav>
        </div>
      </div>
    </div>
  );
};

export default Header;