import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/userSlice';
import { toast } from 'react-hot-toast';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import { FiMapPin } from 'react-icons/fi';
import { FaRobot } from 'react-icons/fa';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user);
  
  const isBookingsActive = location.pathname === '/bookings';
  const isServicesActive = location.pathname === '/services';
  const isRecommendationsActive = location.pathname === '/recommendations';
  const [currentLocation, setCurrentLocation] = useState('Loading location...');
  const [providerRequestLoading, setProviderRequestLoading] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef(null);

  // Add handleLogout function
  const handleLogout = async () => {
    try {
      // Sync tag profile to backend before logout
      const tagProfile = JSON.parse(localStorage.getItem('userTagProfile') || '{}');
      if (Object.keys(tagProfile).length > 0) {
        await Axios.post('/api/recommendations/replace-profile', { profile: tagProfile });
      }
      const response = await Axios(SummaryApi.logout);
      if (response.data.success) {
        localStorage.removeItem("accesstoken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("userLat");
        localStorage.removeItem("userLng");
        localStorage.removeItem("userTagProfile");
        dispatch(logout());
        toast.success("Logged out successfully");
        navigate("/login");
      }
    } catch (error) {
      toast.error("Failed to logout");
    }
  };

  // Add this function to get real location
  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          localStorage.setItem('userLat', lat);
          localStorage.setItem('userLng', lng);
          window.location.reload(); // Reload to update location in header and recommendations
        },
        (error) => {
          alert('Unable to retrieve your location. Please allow location access.');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  const handleProviderRequest = async () => {
    setProviderRequestLoading(true);
    try {
      const response = await Axios.post('/api/user/request-provider');
      if (response.data.success) {
        toast.success('Request sent to admin!');
      } else {
        toast.error(response.data.message || 'Failed to send request');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send request');
    } finally {
      setProviderRequestLoading(false);
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

  // Hide dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 bg-black/80 backdrop-blur-md z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center gap-6">
            {/* User Profile Section */}
            <div className="relative flex items-center gap-3" ref={profileMenuRef}>
              <img
                src={user.avatar || "https://ui-avatars.com/api/?name=" + user.name}
                alt="Profile"
                className="w-10 h-10 rounded-full border-2 border-green-500 cursor-pointer"
                onClick={() => setShowProfileMenu((prev) => !prev)}
              />
              <div>
                <h3 className="text-white font-medium">{user.name}</h3>
                <p className="text-gray-300 text-sm">{user.role}</p>
              </div>
              {/* Profile Dropdown */}
              {showProfileMenu && user.role === 'USER' && (
                <div className="absolute left-0 top-12 bg-white shadow-lg rounded p-3 z-50 min-w-[180px] flex flex-col items-start">
                  <button
                    onClick={handleProviderRequest}
                    className="w-full px-3 py-2 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:opacity-60 text-left"
                    disabled={providerRequestLoading}
                  >
                    {providerRequestLoading ? 'Requesting...' : 'Ask to be Provider'}
                  </button>
                </div>
              )}
            </div>

            {/* Location Display */}
            <div className="flex items-center  text-gray-300">
              <FiMapPin className="text-green-500" />
              <span className="text-sm">{currentLocation}</span>
              <button
                onClick={getUserLocation}
                className="ml-2 px-2 py-1 bg-green-600 text-white rounded text-xs"
              >
                Use My Location
              </button>
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
              onClick={() => navigate('/bot-chat')}
              className="px-6 py-2 rounded-lg font-medium transition-all bg-yellow-400 text-black hover:bg-yellow-300 flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FaRobot className="text-lg" />
              Chatbot
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