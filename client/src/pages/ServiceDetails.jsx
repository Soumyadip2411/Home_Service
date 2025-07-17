import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Axios from "../utils/Axios";
import { toast } from "react-hot-toast";
import { FiClock, FiMapPin, FiStar, FiUser } from "react-icons/fi";
import { useSelector } from "react-redux";

const ServiceDetails = () => {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const user = useSelector((state) => state.user);
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);

  const fetchServiceDetails = async () => {
    try {
      const response = await Axios({
        url: `/api/service/${serviceId}`,
        method: "get",
      });

      if (response.data.success) {
        setService(response.data.data);
        setReviews(response.data.data.reviews || []);
      }
    } catch (error) {
      toast.error("Failed to load service details");
    } finally {
      setLoading(false);
    }
  };

  // Log view interaction when page loads
  const logViewInteraction = async () => {
    try {
      await Axios.post(`/api/interactions/${serviceId}`, {
        interactionType: "view"
      });
    } catch (error) {
      console.error('Failed to log view interaction:', error);
    }
  };

  useEffect(() => {
    fetchServiceDetails();
    // Log view interaction when page loads
    logViewInteraction();
  }, [serviceId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl text-gray-600">Service not found</h2>
      </div>
    );
  }

  const handleBookService = async () => {
    if (user._id === service.provider._id) {
      toast.error("You cannot book your own service!", {
        duration: 3000,
        position: "top-center",
        style: {
          background: "#FF4B4B",
          color: "white",
        },
      });
      return;
    }

    // Log click interaction when "Book Now" is clicked
    try {
      await Axios.post(`/api/interactions/${serviceId}`, {
        interactionType: "click"
      });
    } catch (error) {
      console.error('Failed to log click interaction:', error);
    }

    navigate(`/book-service/${serviceId}`);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/20 backdrop-blur-md rounded-xl shadow-xl overflow-hidden border border-white/20"
      >
        <div className="p-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 mb-6">
            <img
              src={service.provider?.avatar || `https://ui-avatars.com/api/?name=${service.provider?.name}`}
              alt={service.provider?.name}
              className="w-20 h-20 sm:w-16 sm:h-16 rounded-full object-cover ring-2 ring-green-500/30"
            />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">{service.title}</h1>
              <p className="text-sm sm:text-base text-white/80">Provided by {service.provider?.name}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-white/80">
                <FiClock />
                <span>Duration: {service.duration} hour{service.duration !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center gap-2 text-white/80">
                <FiMapPin />
                <span>Location: {service.location?.coordinates?.join(", ")}</span>
              </div>
              <div className="flex items-center gap-2 text-white/80">
                <FiStar className="text-yellow-400" />
                <span>Rating: {service.avgRating?.toFixed(1) || "New"}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-white mb-4">₹{service.price}</div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleBookService}
                className={`${
                  user._id === service?.provider._id 
                    ? 'bg-gray-500/90 cursor-not-allowed' 
                    : 'bg-green-500/90 hover:bg-green-600/90'
                } text-white px-6 py-3 rounded-lg transition-all duration-300 backdrop-blur-sm`}
                disabled={user._id === service?.provider._id}
              >
                {user._id === service?.provider._id ? 'Cannot Book Own Service' : 'Book Now'}
              </motion.button>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-white">Description</h2>
            <p className="text-white/80">{service.description}</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4 text-white">Reviews & Experiences</h2>
            {reviews.length === 0 ? (
              <p className="text-white/60">No reviews yet</p>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <motion.div
                    key={review._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/10"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <FiUser className="text-white/70" />
                      <span className="text-white/90 font-medium">{review.user?.name}</span>
                      <div className="flex items-center gap-1">
                        <FiStar className="text-yellow-400" />
                        <span className="text-white/80">{review.rating}</span>
                      </div>
                    </div>
                    <p className="text-white/80">{review.comment}</p>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
      {/* Add Reviews Section */}
      <div className="mt-8">
        <h3 className="text-2xl font-bold mb-4">Reviews</h3>
        {reviews.length > 0 ? (
          <div className="space-y-4">
            {reviews.map((review) => (
              <motion.div
                key={review._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/10 backdrop-blur-md rounded-lg p-4 border border-white/20"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex text-yellow-500">
                    {[...Array(5)].map((_, index) => ( // BY
                      <FiStar
                        key={index}
                        className={index < review.rating ? "fill-current" : ""}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-400">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-white/90">{review.comment}</p>
                <p className="text-sm text-gray-400 mt-2">
                  By {review.user?.name || "Unknown User"}
                </p>
              </motion.div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400">No reviews yet</p>
        )}
      </div>
    </div>
  );
};

export default ServiceDetails;