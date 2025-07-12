import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Axios from '../utils/Axios';
import { motion } from 'framer-motion';
import { FaStar, FaMapMarkerAlt, FaSyncAlt } from 'react-icons/fa';
import toast from 'react-hot-toast';

const getDistance = (lat1, lon1, lat2, lon2) => {
    const toRad = (x) => (x * Math.PI) / 180;
    const R = 6371; 
  
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
  
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const Recommendation = ({ searchQuery }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const navigate = useNavigate();

  // Get coordinates from localStorage
  const [coords, setCoords] = useState(() => ({
    lat: parseFloat(localStorage.getItem('userLat')),
    lng: parseFloat(localStorage.getItem('userLng'))
  }));

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'userLat' || e.key === 'userLng') {
        const newLat = parseFloat(localStorage.getItem('userLat'));
        const newLng = parseFloat(localStorage.getItem('userLng'));
        setCoords({ lat: newLat, lng: newLng });
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const loadRecommendations = async (pageNumber = 1, reset = false) => {
    try {
      setLoading(true);
      // Use the main recommendation endpoint that uses database profile for hybrid recommendations
      const response = await Axios.get('/api/recommendations', {
        params: {
          lat: coords.lat,
          lng: coords.lng,
          page: pageNumber,
          limit: 12
        },
      });
      
      let recs = response.data.data;
      
      // Sort services by their recommendation scores (highest first)
      recs.sort((a, b) => {
        const scoreA = a.score || 0;
        const scoreB = b.score || 0;
        return scoreB - scoreA; // Descending order
      });
      
      if (reset) {
        setRecommendations(recs);
        setPage(1);
      } else {
        setRecommendations(prev => [...prev, ...recs]);
      }
      setHasMore(response.data.pagination.totalPages > pageNumber);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (coords.lat && coords.lng) {
      loadRecommendations(1, true);
    }
  }, [coords, searchQuery]);

  const handleScroll = () => {
    if (window.innerHeight + document.documentElement.scrollTop + 100 >= 
      document.documentElement.offsetHeight && !loading && hasMore) {
      setPage(prev => prev + 1);
      loadRecommendations(page + 1);
    }
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loading, hasMore]);

  const handleRefresh = () => {
    loadRecommendations(1, true);
  };

  const handleServiceClick = async (serviceId, serviceTags = []) => {
    try {
      // Track service interaction (backend will update database profile)
      await Axios.post(`/api/interactions/${serviceId}`, {
        interactionType: "view"
      });
      navigate(`/service/${serviceId}`);
    } catch (error) {
      toast.error('Failed to track interaction');
    }
  };

  if (!coords.lat || !coords.lng) {
    return (
      <div className="text-center py-12 text-red-500">
        Location data not found. Please update your location settings.
      </div>
    );
  }

  // Get top 5 recommendations sorted by score
  const topRecommendations = recommendations
    .sort((a, b) => {
      const scoreA = a.score || 0;
      const scoreB = b.score || 0;
      return scoreB - scoreA; // Descending order
    })
    .slice(0, 5);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">
          Recommended Services Near You
          <span className="text-sm ml-2 font-normal text-gray-500">
            ({coords.lat.toFixed(4)}, {coords.lng.toFixed(4)})
          </span>
        </h2>
        <div className="flex gap-2 items-center">
          <button
            onClick={handleRefresh}
            className="p-2 hover:bg-gray-100 rounded-full"
            disabled={loading}
          >
            <FaSyncAlt className={`text-lg ${loading ? 'animate-spin' : ''}`} />
          </button>
          
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {topRecommendations.map((service, index) => {
            const serviceLat = service.location?.coordinates[1];
            const serviceLng = service.location?.coordinates[0];
            const distance = getDistance(coords.lat, coords.lng, serviceLat, serviceLng);

            return (
              <motion.div
                key={service._id + index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="border rounded-lg overflow-hidden shadow-lg hover:shadow-xl bg-white"
              >
                <div className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-bold truncate">{service.title}</h3>
                    <span className="bg-indigo-100 text-indigo-800 text-sm px-2 py-1 rounded">
                      {service.category?.name}
                    </span>
                  </div>

                  <div className="flex items-center mb-2">
                    <FaStar className="text-yellow-400 mr-1" />
                    <span className="font-semibold">
                      {service.avgRating?.toFixed(1) || 'New'}
                    </span>
                    <span className="text-gray-500 text-sm ml-2">
                      ({service.reviews?.length} reviews)
                    </span>
                  </div>

                  <div className="mb-3">
                    <p className="text-lg font-bold text-green-600">
                      ₹{service.price}
                      <span className="text-sm text-gray-500 ml-2">
                        {service.duration}
                      </span>
                    </p>
                    {distance && (
                      <p className="flex items-center text-sm mt-1">
                        <FaMapMarkerAlt className="mr-1 text-red-500" />
                        {distance.toFixed(1)} km away
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => handleServiceClick(service._id, service.tags || [])}
                    className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium py-2 rounded-lg transition-all"
                  >
                    View Details
                  </button>
                </div>
              </motion.div>
            );
          })}
      </div>

      {loading && (
        <div className="text-center py-6 text-gray-500">
          Loading more recommendations...
        </div>
      )}

      {!hasMore && !loading && (
        <div className="text-center py-6 text-gray-500">
          No more services to show
        </div>
      )}
    </div>
  );
};

export default Recommendation;