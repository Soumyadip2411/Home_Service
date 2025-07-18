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
import SearchByFaceModal from "./SearchByFaceModal";
import ReactDOM from "react-dom";

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

  const [showFaceModal, setShowFaceModal] = useState(false);
  const [faceSearchResults, setFaceSearchResults] = useState(null); // null or array
  const [faceSearchLoading, setFaceSearchLoading] = useState(false);
  const [faceSearchError, setFaceSearchError] = useState("");

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

  // Handler for face search result
  const handleFaceSearch = async (imageSrc, onProviderResult) => {
    setFaceSearchLoading(true);
    setFaceSearchError("");
    setFaceSearchResults(null);
    try {
      // Convert base64 to blob
      const res = await fetch(imageSrc);
      const blob = await res.blob();
      const formData = new FormData();
      formData.append("file", blob, "frame.jpg");
      const response = await Axios.post("/api/face/search-provider", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (response.data.success && response.data.services && response.data.provider) {
        setFaceSearchResults(response.data.services);
        if (onProviderResult) onProviderResult(response.data.provider.name);
      } else {
        setFaceSearchError(response.data.msg || "No provider found.");
        if (onProviderResult) onProviderResult(null);
      }
    } catch (err) {
      setFaceSearchError("No provider found or error occurred.");
      if (onProviderResult) onProviderResult(null);
    } finally {
      setFaceSearchLoading(false);
    }
  };

  // When provider name is found, set it in the search box
  const handleProviderName = (providerName) => {
    if (providerName) {
      // Normalize: trim and collapse multiple spaces
      const normalized = providerName.trim().replace(/\s+/g, ' ');
      setFilters(prev => ({ ...prev, search: normalized }));

      // Fallback: after a short delay, if no results, try first or last name
      setTimeout(() => {
        if (faceSearchResults && faceSearchResults.length === 0) {
          const parts = normalized.split(' ');
          if (parts.length > 1) {
            // Try first name
            setFilters(prev => ({ ...prev, search: parts[0] }));
            // Or try last name after another delay
            setTimeout(() => {
              if (faceSearchResults && faceSearchResults.length === 0) {
                setFilters(prev => ({ ...prev, search: parts[parts.length - 1] }));
              }
            }, 800);
          }
        }
      }, 1200);
    }
    setShowFaceModal(false);
    setFaceSearchResults(null);
    setFaceSearchError("");
  };

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
    <div className="p-2 sm:p-4 md:p-6">
      {/* Render SearchByFaceModal as a portal so it overlays the whole app */}
      {showFaceModal && ReactDOM.createPortal(
        <SearchByFaceModal
          isOpen={showFaceModal}
          onClose={() => {
            setShowFaceModal(false);
            setFaceSearchResults(null);
            setFaceSearchError("");
          }}
          onProviderName={handleProviderName}
        />, document.body
      )}

      {user.role === "PROVIDER" && (
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-4 sm:mb-8 flex flex-col sm:flex-row gap-3 sm:gap-4"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowAddService(true)}
            className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-green-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:from-green-700 hover:to-green-600 transition-all duration-300 shadow-lg text-base sm:text-lg"
          >
            Add New Service
          </motion.button>
          {!showAddService && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/your-services")}
              className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-blue-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:from-blue-700 hover:to-blue-600 transition-all duration-300 shadow-lg text-base sm:text-lg"
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm min-h-screen p-2 sm:p-0"
          >
            <motion.div
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 120, damping: 18 }}
              className="relative w-full max-w-lg sm:max-w-3xl mx-auto"
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
        className="bg-white/40 backdrop-blur-md p-3 sm:p-6 rounded-xl shadow-xl mb-6 sm:mb-8 border border-white/20"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 sm:gap-6">
          {/* Search by Face Button */}
          <div className="col-span-1 flex items-end">
            <button
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-3 sm:px-4 py-2 rounded-lg shadow hover:from-cyan-600 hover:to-blue-600 transition-all font-semibold text-sm sm:text-base"
              onClick={() => setShowFaceModal(true)}
            >
              <span role="img" aria-label="face">🔍</span> Search by Face
            </button>
          </div>

          <div className="relative">
            <FiSearch className="absolute left-3 top-[38px] text-gray-500" />
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Search Services</label>
            <input
              type="text"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Search by title, tags, provider, or category..."
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/70 backdrop-blur-sm border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300 text-sm sm:text-base"
            />
          </div>

          <div className="relative">
            <FiTag className="absolute left-3 top-[38px] text-gray-500" />
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Category</label>
            <select
              name="category"
              value={filters.category}
              onChange={handleFilterChange}
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/70 backdrop-blur-sm border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300 text-sm sm:text-base"
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
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Max Price (₹)</label>
            <input
              type="number"
              name="maxPrice"
              value={filters.maxPrice}
              onChange={handleFilterChange}
              placeholder="Enter maximum price"
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/70 backdrop-blur-sm border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300 text-sm sm:text-base"
            />
          </div>

          <div className="relative">
            <FiMapPin className="absolute left-3 top-[38px] text-gray-500" />
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
              Distance (km)
            </label>
            <input
              type="number"
              name="radius"
              value={filters.radius}
              onChange={handleFilterChange}
              placeholder="Max distance in km"
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/70 backdrop-blur-sm border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300 text-sm sm:text-base"
            />
          </div>
        </div>
      </motion.div>

      {/* View Mode Toggle */}
      <motion.div
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-2 sm:gap-0"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center space-x-2 mb-2 sm:mb-0">
          <span className="text-gray-700 font-medium text-sm sm:text-base">View Mode:</span>
          <div className="flex bg-white/70 backdrop-blur-sm rounded-lg p-1 border border-gray-200">
            <button
              onClick={() => handleViewModeChange('grid')}
              className={`flex items-center space-x-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-md transition-all duration-300 ${
                viewMode === 'grid'
                  ? 'bg-green-500 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-800'
              } text-xs sm:text-sm`}
            >
              <FiGrid className="w-4 h-4" />
              <span className="hidden xs:inline text-xs sm:text-sm font-medium">Grid</span>
            </button>
            <button
              onClick={() => handleViewModeChange('map')}
              className={`flex items-center space-x-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-md transition-all duration-300 ${
                viewMode === 'map'
                  ? 'bg-green-500 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-800'
              } text-xs sm:text-sm`}
            >
              <FiMap className="w-4 h-4" />
              <span className="hidden xs:inline text-xs sm:text-sm font-medium">Map</span>
            </button>
          </div>
        </div>
        <div className="text-xs sm:text-sm text-gray-600">
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
        ) : faceSearchResults ? (
          <motion.div
            key="face-search-results"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6"
          >
            {faceSearchResults.length === 0 ? (
              <motion.div
                className="col-span-full text-center py-12 text-gray-500"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                No provider found
              </motion.div>
            ) : (
              faceSearchResults.map((service, index) => {
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
                    className="group relative backdrop-blur-sm bg-white/10 dark:bg-gray-800/10 rounded-2xl overflow-hidden border border-white/20 dark:border-gray-700/20 hover:bg-white/20 dark:hover:bg-gray-800/20 transition-all duration-500 cursor-pointer p-3 sm:p-6"
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
                        className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-semibold shadow-lg z-10"
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
                        className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-gradient-to-r from-blue-400 to-purple-500 text-white px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-semibold shadow-lg z-10"
                      >
                        🆕 New
                      </motion.div>
                    )}

                    {/* Hover Overlay */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      initial={false}
                    />

                    <div className="p-2 sm:p-6 relative z-10">
                      <div className="flex items-center gap-2 sm:gap-4 mb-2 sm:mb-4">
                        <motion.div
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          className="relative"
                        >
                          {service.provider?.avatar ? (
                            <img
                              src={service.provider.avatar}
                              alt={service.provider?.name}
                              className="w-8 h-8 sm:w-12 sm:h-12 rounded-full object-cover ring-2 ring-green-500/30 group-hover:ring-green-500 transition-all duration-300"
                            />
                          ) : (
                            <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center text-white font-bold ring-2 ring-green-500/30 group-hover:ring-green-500 transition-all duration-300 text-xs sm:text-base">
                              {service.provider?.name
                                ? service.provider.name
                                    .split(' ')
                                    .map(word => word.charAt(0))
                                    .join('')
                                    .toUpperCase()
                                    .slice(0, 2)
                                : 'SP'}
                            </div>
                          )}
                        </motion.div>
                        <div>
                          <h3 className="font-semibold text-base sm:text-lg text-gray-800 dark:text-gray-100 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors duration-300">
                            {service.title}
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors duration-300">
                            by {service.provider?.name}
                          </p>
                        </div>
                      </div>
                      {/* Enhanced Distance Display */}
                      <motion.div 
                        className="flex items-center gap-1 sm:gap-2 mb-2 sm:mb-4 text-gray-600 dark:text-gray-400"
                        whileHover={{ x: 5 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <FiMapPin className="text-green-500 group-hover:text-green-600 transition-colors duration-300" />
                        <span className="text-xs sm:text-sm font-medium">{distanceText}</span>
                      </motion.div>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2 sm:mb-4 line-clamp-2 group-hover:line-clamp-none transition-all duration-300 group-hover:text-gray-700 dark:group-hover:text-gray-300">
                        {service.description}
                      </p>
                      <div className="flex items-center justify-between mb-2 sm:mb-4">
                        <div className="flex items-center gap-2 sm:gap-4">
                          <motion.span 
                            className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent"
                            whileHover={{ scale: 1.05 }}
                          >
                            ₹{service.price}
                          </motion.span>
                          <motion.div 
                            className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900/30 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors duration-300"
                            whileHover={{ scale: 1.05 }}
                          >
                            <FiClock className="w-4 h-4 text-blue-500" />
                            <span className="text-xs sm:text-base text-blue-700 dark:text-blue-300 font-medium">{service.duration} hr{service.duration !== 1 ? 's' : ''}</span>
                          </motion.div>
                        </div>
                        <motion.div 
                          className="flex items-center gap-1 bg-yellow-100 dark:bg-yellow-900/30 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full group-hover:bg-yellow-200 dark:group-hover:bg-yellow-900/50 transition-colors duration-300"
                          whileHover={{ scale: 1.05 }}
                        >
                          <span className="text-yellow-500">★</span>
                          <span className="text-xs sm:text-base text-yellow-700 dark:text-yellow-300 font-medium">{service.avgRating?.toFixed(1) || "New"}</span>
                        </motion.div>
                      </div>
                      <div className="flex justify-between items-center pt-2 sm:pt-4 border-t border-gray-200">
                        <motion.span 
                          className="px-2 sm:px-3 py-0.5 sm:py-1 bg-gray-100 rounded-full text-xs sm:text-sm text-gray-600 font-medium group-hover:bg-gray-200 transition-colors duration-300"
                          whileHover={{ scale: 1.05 }}
                        >
                          {service.category?.name}
                        </motion.span>
                        <motion.button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/book-service/${service._id}`);
                          }}
                          className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg hover:from-green-700 hover:to-green-600 transition-all duration-300 shadow-md hover:shadow-lg font-medium text-xs sm:text-base"
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
        ) : (
          <motion.div
            key="grid"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6"
          >
            {loading ? (
              <div className="col-span-full flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-t-2 border-b-2 border-green-500"></div>
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
                    className="group relative backdrop-blur-sm bg-white/10 dark:bg-gray-800/10 rounded-2xl overflow-hidden border border-white/20 dark:border-gray-700/20 hover:bg-white/20 dark:hover:bg-gray-800/20 transition-all duration-500 cursor-pointer p-3 sm:p-6"
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
                        className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-semibold shadow-lg z-10"
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
                        className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-gradient-to-r from-blue-400 to-purple-500 text-white px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-semibold shadow-lg z-10"
                      >
                        🆕 New
                      </motion.div>
                    )}

                    {/* Hover Overlay */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      initial={false}
                    />

                    <div className="p-2 sm:p-6 relative z-10">
                      <div className="flex items-center gap-2 sm:gap-4 mb-2 sm:mb-4">
                        <motion.div
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          className="relative"
                        >
                          {service.provider?.avatar ? (
                            <img
                              src={service.provider.avatar}
                              alt={service.provider?.name}
                              className="w-8 h-8 sm:w-12 sm:h-12 rounded-full object-cover ring-2 ring-green-500/30 group-hover:ring-green-500 transition-all duration-300"
                            />
                          ) : (
                            <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center text-white font-bold ring-2 ring-green-500/30 group-hover:ring-green-500 transition-all duration-300 text-xs sm:text-base">
                              {service.provider?.name
                                ? service.provider.name
                                    .split(' ')
                                    .map(word => word.charAt(0))
                                    .join('')
                                    .toUpperCase()
                                    .slice(0, 2)
                                : 'SP'}
                            </div>
                          )}
                        </motion.div>
                        <div>
                          <h3 className="font-semibold text-base sm:text-lg text-gray-800 dark:text-gray-100 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors duration-300">
                            {service.title}
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors duration-300">
                            by {service.provider?.name}
                          </p>
                        </div>
                      </div>
                      {/* Enhanced Distance Display */}
                      <motion.div 
                        className="flex items-center gap-1 sm:gap-2 mb-2 sm:mb-4 text-gray-600 dark:text-gray-400"
                        whileHover={{ x: 5 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <FiMapPin className="text-green-500 group-hover:text-green-600 transition-colors duration-300" />
                        <span className="text-xs sm:text-sm font-medium">{distanceText}</span>
                      </motion.div>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2 sm:mb-4 line-clamp-2 group-hover:line-clamp-none transition-all duration-300 group-hover:text-gray-700 dark:group-hover:text-gray-300">
                        {service.description}
                      </p>
                      <div className="flex items-center justify-between mb-2 sm:mb-4">
                        <div className="flex items-center gap-2 sm:gap-4">
                          <motion.span 
                            className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent"
                            whileHover={{ scale: 1.05 }}
                          >
                            ₹{service.price}
                          </motion.span>
                          <motion.div 
                            className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900/30 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors duration-300"
                            whileHover={{ scale: 1.05 }}
                          >
                            <FiClock className="w-4 h-4 text-blue-500" />
                            <span className="text-xs sm:text-base text-blue-700 dark:text-blue-300 font-medium">{service.duration} hr{service.duration !== 1 ? 's' : ''}</span>
                          </motion.div>
                        </div>
                        <motion.div 
                          className="flex items-center gap-1 bg-yellow-100 dark:bg-yellow-900/30 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full group-hover:bg-yellow-200 dark:group-hover:bg-yellow-900/50 transition-colors duration-300"
                          whileHover={{ scale: 1.05 }}
                        >
                          <span className="text-yellow-500">★</span>
                          <span className="text-xs sm:text-base text-yellow-700 dark:text-yellow-300 font-medium">{service.avgRating?.toFixed(1) || "New"}</span>
                        </motion.div>
                      </div>
                      <div className="flex justify-between items-center pt-2 sm:pt-4 border-t border-gray-200">
                        <motion.span 
                          className="px-2 sm:px-3 py-0.5 sm:py-1 bg-gray-100 rounded-full text-xs sm:text-sm text-gray-600 font-medium group-hover:bg-gray-200 transition-colors duration-300"
                          whileHover={{ scale: 1.05 }}
                        >
                          {service.category?.name}
                        </motion.span>
                        <motion.button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/book-service/${service._id}`);
                          }}
                          className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg hover:from-green-700 hover:to-green-600 transition-all duration-300 shadow-md hover:shadow-lg font-medium text-xs sm:text-base"
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
