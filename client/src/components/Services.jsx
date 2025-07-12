import React, { useEffect, useState } from "react";
import Axios from "../utils/Axios";
import SummaryApi from "../common/SummaryApi";
import { toast } from "react-hot-toast";
import AddService from "./AddService";
import ServiceMapView from "./ServiceMapView";
import { useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FiSearch, FiTag, FiDollarSign, FiMapPin, FiClock, FiStar, FiGrid, FiMap } from "react-icons/fi";
import { useLocation } from "react-router-dom";

const Services = () => {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddService, setShowAddService] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'map'
  const [mapError, setMapError] = useState(false);
  const user = useSelector((state) => state.user);
  const navigate = useNavigate();
  const location = useLocation();

  // Filter states
  const [filters, setFilters] = useState({
    search: "",
    category: "All Categories",
    rating: "Any Rating",
    maxPrice: "",
    provider: "",
    radius: "",
  });

  const fetchAllServices = async (searchQuery = "") => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery.trim()) {
        params.append('search', searchQuery);
      }
      
      const response = await Axios({
        url: `/api/service/all-services${params.toString() ? `?${params.toString()}` : ''}`,
        method: "get",
      });

      if (response.data) {
        setServices(response.data);
      } else {
        toast.error("Failed to load services");
      }
    } catch (error) {
      console.error("Error loading services:", error);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await Axios({
        ...SummaryApi.getAllCategories,
      });
      if (response.data.success) {
        setCategories(response.data.data);
        
        // Get category ID from URL query params and set the filter
        const params = new URLSearchParams(location.search);
        const categoryId = params.get('category');
        
        if (categoryId) {
          const selectedCategory = response.data.data.find(cat => cat._id === categoryId);
          if (selectedCategory) {
            setFilters(prev => ({ ...prev, category: selectedCategory.name }));
          }
        }
      }
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  useEffect(() => {
    fetchAllServices();
    fetchCategories();
  }, [location.search]);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (filters.search !== "") {
        fetchAllServices(filters.search);
      } else {
        fetchAllServices();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [filters.search]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // Add this function to calculate distance
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in km
  };

  // Add this function to format distance
  const formatDistance = (distance) => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)} m`;
    }
    return `${Math.round(distance * 10) / 10} km`;
  };

  // Client-side filtering for other filters (category, price, rating, etc.)
  const filteredServices = services.filter(service => {
    const userLat = parseFloat(localStorage.getItem("userLat"));
    const userLng = parseFloat(localStorage.getItem("userLng"));
    
    const matchesCategory = filters.category === "All Categories" || service.category?.name === filters.category;
    const matchesRating = filters.rating === "Any Rating" || service.avgRating >= parseFloat(filters.rating);
    const matchesPrice = !filters.maxPrice || service.price <= parseFloat(filters.maxPrice);
    const matchesProvider = !filters.provider || service.provider?.name.toLowerCase().includes(filters.provider.toLowerCase());
    
    // Distance filter
    let matchesDistance = true;
    if (filters.radius && userLat && userLng && service.location?.coordinates) {
      const distance = calculateDistance(
        userLat,
        userLng,
        service.location.coordinates[1],
        service.location.coordinates[0]
      );
      matchesDistance = distance <= parseFloat(filters.radius);
    }

    return matchesCategory && matchesRating && matchesPrice && matchesProvider && matchesDistance;
  });

  // Handle map view toggle with error handling
  const handleViewModeChange = (mode) => {
    if (mode === 'map') {
      // Check if Google Maps API key is available
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      if (!apiKey || apiKey === 'YOUR_API_KEY') {
        setMapError(true);
        toast.error("Google Maps is not configured. Please check your API key.");
        return;
      }
      setMapError(false);
    }
    setViewMode(mode);
  };

  return (
    <div className="p-6">
      {user.role === "PROVIDER" && (
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-8 flex gap-4"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowAddService(true)}
            className="bg-gradient-to-r from-green-600 to-green-500 text-white px-6 py-3 rounded-lg hover:from-green-700 hover:to-green-600 transition-all duration-300 shadow-lg"
          >
            Add New Service
          </motion.button>
          {!showAddService && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/your-services")}
              className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-blue-600 transition-all duration-300 shadow-lg"
            >
              Your Services
            </motion.button>
          )}
        </motion.div>
      )}
      <AnimatePresence>
        {showAddService && (
          <motion.div
            key="add-service-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            style={{ minHeight: '100vh' }}
          >
            <motion.div
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 120, damping: 18 }}
              className="relative w-full max-w-3xl mx-auto"
            >
              <button
                onClick={() => setShowAddService(false)}
                className="absolute -top-5 -right-5 bg-white text-gray-700 hover:bg-gray-100 rounded-full shadow-lg p-2 z-10 border border-gray-200 transition-all duration-200"
                aria-label="Close"
                style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <AddService onServiceAdded={fetchAllServices} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter Section */}
      <motion.div
        className="bg-white/40 backdrop-blur-md p-6 rounded-xl shadow-xl mb-8 border border-white/20"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <div className="relative">
            <FiSearch className="absolute left-3 top-[38px] text-gray-500" />
            <label className="block text-sm font-medium text-gray-700 mb-2">Search Services</label>
            <input
              type="text"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Search by title, tags, provider, or category..."
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/70 backdrop-blur-sm border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300"
            />
          </div>

          <div className="relative">
            <FiTag className="absolute left-3 top-[38px] text-gray-500" />
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              name="category"
              value={filters.category}
              onChange={handleFilterChange}
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/70 backdrop-blur-sm border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300"
            >
              <option value="All Categories">All Categories</option>
              {categories.map((category) => (
                <option key={category._id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <FiDollarSign className="absolute left-3 top-[38px] text-gray-500" />
            <label className="block text-sm font-medium text-gray-700 mb-2">Max Price (₹)</label>
            <input
              type="number"
              name="maxPrice"
              value={filters.maxPrice}
              onChange={handleFilterChange}
              placeholder="Enter maximum price"
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/70 backdrop-blur-sm border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300"
            />
          </div>

          <div className="relative">
            <FiMapPin className="absolute left-3 top-[38px] text-gray-500" />
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Distance (km)
            </label>
            <input
              type="number"
              name="radius"
              value={filters.radius}
              onChange={handleFilterChange}
              placeholder="Max distance in km"
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/70 backdrop-blur-sm border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300"
            />
          </div>
        </div>
      </motion.div>

      {/* View Mode Toggle */}
      <motion.div
        className="flex justify-between items-center mb-6"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center space-x-2">
          <span className="text-gray-700 font-medium">View Mode:</span>
          <div className="flex bg-white/70 backdrop-blur-sm rounded-lg p-1 border border-gray-200">
            <button
              onClick={() => handleViewModeChange('grid')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all duration-300 ${
                viewMode === 'grid'
                  ? 'bg-green-500 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <FiGrid className="w-4 h-4" />
              <span className="text-sm font-medium">Grid</span>
            </button>
            <button
              onClick={() => handleViewModeChange('map')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all duration-300 ${
                viewMode === 'map'
                  ? 'bg-green-500 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <FiMap className="w-4 h-4" />
              <span className="text-sm font-medium">Map</span>
            </button>
          </div>
        </div>
        
        <div className="text-sm text-gray-600">
          {filteredServices.length} service{filteredServices.length !== 1 ? 's' : ''} found
        </div>
      </motion.div>

      {/* Content based on view mode */}
      <AnimatePresence mode="wait">
        {viewMode === 'map' ? (
          <motion.div
            key="map"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            {mapError ? (
              <div className="col-span-full text-center py-12 text-gray-500">
                Google Maps is not configured. Please check your API key.
              </div>
            ) : (
              <ServiceMapView services={filteredServices} />
            )}
          </motion.div>
        ) : (
          <motion.div
            key="grid"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {loading ? (
              <div className="col-span-full flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
              </div>
            ) : filteredServices.length === 0 ? (
              <motion.div
                className="col-span-full text-center py-12 text-gray-500"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                No services found
              </motion.div>
            ) : (
              filteredServices.map((service, index) => {
                // Calculate distance for each service
                const userLat = parseFloat(localStorage.getItem("userLat"));
                const userLng = parseFloat(localStorage.getItem("userLng"));
                let distanceText = "Distance unavailable";
                
                if (userLat && userLng && service.location?.coordinates) {
                  const distance = calculateDistance(
                    userLat,
                    userLng,
                    service.location.coordinates[1],
                    service.location.coordinates[0]
                  );
                  distanceText = formatDistance(distance);
                }

                return (
                  <motion.div
                    key={service._id}
                    className="group relative backdrop-blur-sm bg-white/10 dark:bg-gray-800/10 rounded-2xl overflow-hidden border border-white/20 dark:border-gray-700/20 hover:bg-white/20 dark:hover:bg-gray-800/20 transition-all duration-500 cursor-pointer"
                    onClick={() => navigate(`/service/${service._id}`)}
                    variants={{
                      hidden: { y: 20, opacity: 0 },
                      visible: {
                        y: 0,
                        opacity: 1,
                        transition: { 
                          type: "spring", 
                          stiffness: 100, 
                          damping: 12,
                          delay: index * 0.1 
                        }
                      }
                    }}
                    whileHover={{ 
                      y: -8, 
                      scale: 1.02,
                      transition: { type: "spring", stiffness: 300, damping: 20 }
                    }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {/* Popular Badge */}
                    {service.avgRating && service.avgRating >= 4.5 && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 + 0.2 }}
                        className="absolute top-4 right-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg z-10"
                      >
                        ⭐ Popular
                      </motion.div>
                    )}

                    {/* New Badge */}
                    {!service.avgRating && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 + 0.2 }}
                        className="absolute top-4 right-4 bg-gradient-to-r from-blue-400 to-purple-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg z-10"
                      >
                        🆕 New
                      </motion.div>
                    )}

                    {/* Hover Overlay */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      initial={false}
                    />

                    <div className="p-6 relative z-10">
                      <div className="flex items-center gap-4 mb-4">
                        <motion.div
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          className="relative"
                        >
                          <img
                            src={service.provider?.avatar || `https://ui-avatars.com/api/?name=${service.provider?.name}`}
                            alt={service.provider?.name}
                            className="w-12 h-12 rounded-full object-cover ring-2 ring-green-500/30 group-hover:ring-green-500 transition-all duration-300"
                          />
                          
                          
                        </motion.div>
                        <div>
                          <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-100 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors duration-300">
                            {service.title}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors duration-300">
                            by {service.provider?.name}
                          </p>
                        </div>
                      </div>
                      
                      {/* Enhanced Distance Display */}
                      <motion.div 
                        className="flex items-center gap-2 mb-4 text-gray-600 dark:text-gray-400"
                        whileHover={{ x: 5 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <FiMapPin className="text-green-500 group-hover:text-green-600 transition-colors duration-300" />
                        <span className="text-sm font-medium">{distanceText}</span>
                      </motion.div>
                      
                      <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2 group-hover:line-clamp-none transition-all duration-300 group-hover:text-gray-700 dark:group-hover:text-gray-300">
                        {service.description}
                      </p>
                      
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <motion.span 
                            className="text-2xl font-bold bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent"
                            whileHover={{ scale: 1.05 }}
                          >
                            ₹{service.price}
                          </motion.span>
                          <motion.div 
                            className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900/30 px-3 py-1 rounded-full group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors duration-300"
                            whileHover={{ scale: 1.05 }}
                          >
                            <FiClock className="w-4 h-4 text-blue-500" />
                            <span className="text-blue-700 dark:text-blue-300 font-medium">{service.duration} hr{service.duration !== 1 ? 's' : ''}</span>
                          </motion.div>
                        </div>
                        <motion.div 
                          className="flex items-center gap-1 bg-yellow-100 dark:bg-yellow-900/30 px-3 py-1 rounded-full group-hover:bg-yellow-200 dark:group-hover:bg-yellow-900/50 transition-colors duration-300"
                          whileHover={{ scale: 1.05 }}
                        >
                          <span className="text-yellow-500">★</span>
                          <span className="text-yellow-700 dark:text-yellow-300 font-medium">{service.avgRating?.toFixed(1) || "New"}</span>
                        </motion.div>
                      </div>

                      <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                        <motion.span 
                          className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600 font-medium group-hover:bg-gray-200 transition-colors duration-300"
                          whileHover={{ scale: 1.05 }}
                        >
                          {service.category?.name}
                        </motion.span>
                        <motion.button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/book-service/${service._id}`);
                          }}
                          className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg hover:from-green-700 hover:to-green-600 transition-all duration-300 shadow-md hover:shadow-lg font-medium"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Book Now
                        </motion.button>
                      </div>
                    </div>

                    {/* Ripple Effect on Click */}
                    <motion.div
                      className="absolute inset-0 bg-white/20 dark:bg-gray-600/20 rounded-2xl"
                      initial={{ scale: 0, opacity: 0 }}
                      whileTap={{ scale: 2, opacity: 0 }}
                      transition={{ duration: 0.6 }}
                    />
                  </motion.div>
                );
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Services;
