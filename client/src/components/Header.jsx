import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/userSlice';
import { toast } from 'react-hot-toast';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import { FiMapPin, FiChevronDown } from 'react-icons/fi';
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
  const [locationLoading, setLocationLoading] = useState(false);
  const [providerRequestLoading, setProviderRequestLoading] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showLocationMenu, setShowLocationMenu] = useState(false);
  const profileMenuRef = useRef(null);
  const locationMenuRef = useRef(null);

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

  // Improved function to get accurate location
  const getUserLocation = () => {
    setLocationLoading(true);
    setCurrentLocation('Getting your location...');
    setShowLocationMenu(false); // Close dropdown when starting location update
    
    if (!navigator.geolocation) {
      setCurrentLocation('Geolocation not supported');
      setLocationLoading(false);
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    // High accuracy geolocation options
    const options = {
      enableHighAccuracy: true,  // Request high accuracy
      timeout: 10000,           // 10 second timeout
      maximumAge: 300000        // Cache for 5 minutes
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const accuracy = position.coords.accuracy;
        
        console.log(`Location obtained - Lat: ${lat}, Lng: ${lng}, Accuracy: ${accuracy}m`);
        
        // Store coordinates
        localStorage.setItem('userLat', lat);
        localStorage.setItem('userLng', lng);
        
        // Get address from coordinates
        getAddressFromCoordinates(lat, lng);
      },
      (error) => {
        console.error('Geolocation error:', error);
        setLocationLoading(false);
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setCurrentLocation('Location access denied');
            toast.error('Please allow location access in your browser settings');
            break;
          case error.POSITION_UNAVAILABLE:
            setCurrentLocation('Location unavailable');
            toast.error('Location information is unavailable');
            break;
          case error.TIMEOUT:
            setCurrentLocation('Location timeout');
            toast.error('Location request timed out. Please try again');
            break;
          default:
            setCurrentLocation('Location error');
            toast.error('Unable to get your location');
        }
      },
      options
    );
  };

  // Improved function to get address from coordinates
  const getAddressFromCoordinates = async (lat, lng) => {
    try {
      // Try multiple geocoding services for better accuracy
      const openCageUrl = `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lng}&key=84c8eaa39d454ab8a34547a3c3043670&language=en&limit=1`;
      
      const response = await fetch(openCageUrl);
      const data = await response.json();
      
      if (data.results && data.results[0]) {
        const result = data.results[0];
        const components = result.components;
        
        // Build a more accurate address
        let address = '';
        
        if (components.city || components.town) {
          address = components.city || components.town;
        } else if (components.village) {
          address = components.village;
        } else if (components.suburb) {
          address = components.suburb;
        } else if (components.county) {
          address = components.county;
        } else {
          // Fallback to formatted address
          address = result.formatted.split(',')[0];
        }
        
        // Add state if available
        if (components.state) {
          address += `, ${components.state}`;
        }
        
        setCurrentLocation(address);
        toast.success('Location updated successfully!');
      } else {
        setCurrentLocation('Address not found');
        toast.error('Could not find address for your location');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      setCurrentLocation('Address lookup failed');
      toast.error('Failed to get address for your location');
    } finally {
      setLocationLoading(false);
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
      getAddressFromCoordinates(parseFloat(userLat), parseFloat(userLng));
    } else {
      setCurrentLocation('Location not set');
    }
  }, []);

  // Hide dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
      if (locationMenuRef.current && !locationMenuRef.current.contains(event.target)) {
        setShowLocationMenu(false);
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

            {/* Location Dropdown */}
            <div className="relative" ref={locationMenuRef}>
              <button
                onClick={() => setShowLocationMenu((prev) => !prev)}
                className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
              >
                <FiMapPin className="text-green-500" />
                <span className="text-sm min-w-[120px] text-left">
                  {locationLoading ? (
                    <span className="flex items-center gap-1">
                      <div className="w-3 h-3 border-t-2 border-green-500 rounded-full animate-spin"></div>
                      Getting location...
                    </span>
                  ) : (
                    currentLocation
                  )}
                </span>
                <FiChevronDown className={`text-xs transition-transform ${showLocationMenu ? 'rotate-180' : ''}`} />
              </button>
              
              {/* Location Dropdown Menu */}
              {showLocationMenu && (
                <div className="absolute left-0 top-10 bg-white shadow-lg rounded-lg p-3 z-50 min-w-[200px]">
                  <div className="mb-3">
                    <h4 className="text-sm font-semibold text-gray-800 mb-2">Location Settings</h4>
                    <p className="text-xs text-gray-600 mb-3">
                      Current: {currentLocation}
                    </p>
                  </div>
                  
                  <button
                    onClick={getUserLocation}
                    disabled={locationLoading}
                    className="w-full px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {locationLoading ? (
                      <>
                        <div className="w-4 h-4 border-t-2 border-white rounded-full animate-spin"></div>
                        Getting Location...
                      </>
                    ) : (
                      <>
                        <FiMapPin className="text-sm" />
                        Use My Location
                      </>
                    )}
                  </button>
                  
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                      This helps us show you relevant services nearby
                    </p>
                  </div>
                </div>
              )}
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