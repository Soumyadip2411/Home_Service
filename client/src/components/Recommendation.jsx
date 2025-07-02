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

const TAG_DECAY = 0.8;
const TAG_BOOSTS = { bot: 1.0, content: 0.5, collab: 0.4 };

// Utility to get the full tag profile breakdown from localStorage
function getTagProfileBreakdown() {
  return JSON.parse(localStorage.getItem('userTagProfileBreakdown') || '{}');
}

// Utility to set the full tag profile breakdown in localStorage
function setTagProfileBreakdown(profile) {
  localStorage.setItem('userTagProfileBreakdown', JSON.stringify(profile));
}

// Utility to get the flat tag profile (total scores)
function getTagProfile() {
  const breakdown = getTagProfileBreakdown();
  const flat = {};
  for (let tag in breakdown) {
    flat[tag] = breakdown[tag].total;
  }
  return flat;
}

// Utility to sync tag profile to backend
async function syncTagProfileToBackend(profile) {
  try {
    await Axios.post('/api/recommendations/replace-profile', { profile }, {
      headers: {
        'auth-token': localStorage.getItem('token'),
      },
    });
  } catch (err) {
    // Optionally handle error
  }
}

// Update tag profile breakdown in localStorage
function updateLocalTagProfile(newTags, source) {
  let profile = getTagProfileBreakdown();
  // Decay all tags
  for (let tag in profile) {
    for (let src of ['bot', 'content', 'collab']) {
      profile[tag][src] = (profile[tag][src] || 0) * TAG_DECAY;
    }
    profile[tag].total = (profile[tag].bot || 0) + (profile[tag].content || 0) + (profile[tag].collab || 0);
  }
  // Add/increase new tags
  for (let tag of newTags) {
    if (!profile[tag]) profile[tag] = { bot: 0, content: 0, collab: 0, total: 0 };
    profile[tag][source] = (profile[tag][source] || 0) + (TAG_BOOSTS[source] || 0.2);
    profile[tag].total = (profile[tag].bot || 0) + (profile[tag].content || 0) + (profile[tag].collab || 0);
  }
  setTagProfileBreakdown(profile);
  // Also update the flat profile for compatibility
  const flatProfile = getTagProfile();
  localStorage.setItem('userTagProfile', JSON.stringify(flatProfile));
  // Sync to backend in real time
  syncTagProfileToBackend(flatProfile);
  return flatProfile;
}

const Recommendation = ({ searchQuery }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showDebug, setShowDebug] = useState(false);
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
      let response;
      // Always use userTagProfile from localStorage
      const tagProfile = getTagProfile();
      const tagBreakdown = getTagProfileBreakdown();
      response = await Axios.post('/api/recommendations/profile-tags', {
        profile: tagProfile,
        lat: coords.lat,
        lng: coords.lng,
        page: pageNumber,
        limit: 12
      }, {
        headers: {
          'auth-token': localStorage.getItem('token'),
        },
      });
      let recs = response.data.data;
      // No need to re-score, backend does hybrid scoring
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
    // Listen for changes to userTagProfile in localStorage
    const handleStorageChange = (e) => {
      if (e.key === 'userTagProfile' || e.key === 'userTagProfileBreakdown') {
        loadRecommendations(1, true);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
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
      // Update local tag profile with service tags (content-based)
      if (serviceTags.length > 0) {
        updateLocalTagProfile(serviceTags, 'content');
      }
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

      {showDebug && (
        <div className="mb-6 p-4 bg-gray-50 border rounded text-xs overflow-x-auto">
          <div className="mb-2 font-semibold">Your Tag Profile Breakdown:</div>
          <pre className="mb-2 bg-white p-2 rounded border max-h-40 overflow-y-auto">{JSON.stringify(getTagProfileBreakdown(), null, 2)}</pre>
          <div className="mb-2 font-semibold">Current Recommendations (with scores):</div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b">
                <th className="pr-2">Title</th>
                <th className="pr-2">tagScore</th>
                <th className="pr-2">contentScore</th>
                <th className="pr-2">locationScore</th>
                <th className="pr-2">popularityScore</th>
                <th className="pr-2">finalScore</th>
              </tr>
            </thead>
            <tbody>
              {recommendations.slice(0, 5).map((s, i) => (
                <tr key={s._id + i} className="border-b">
                  <td className="pr-2">{s.title}</td>
                  <td className="pr-2">{(s.tagScore ?? 0).toFixed(3)}</td>
                  <td className="pr-2">{(s.contentScore ?? 0).toFixed(3)}</td>
                  <td className="pr-2">{(s.locationScore ?? 0).toFixed(3)}</td>
                  <td className="pr-2">{(s.popularityScore ?? 0).toFixed(3)}</td>
                  <td className="pr-2">{(s.score ?? 0).toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recommendations
          .slice(0, 5)
          .map((service, index) => {
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

      {/* (Optional) Debug section to show tag profile breakdown */}
      {/* <pre>{JSON.stringify(getTagProfileBreakdown(), null, 2)}</pre> */}
    </div>
  );
};

export default Recommendation;

export { updateLocalTagProfile };