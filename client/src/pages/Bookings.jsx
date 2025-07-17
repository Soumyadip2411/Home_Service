import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FiStar, FiClock, FiMapPin } from "react-icons/fi";
import Axios from "../utils/Axios";
import SummaryApi from "../common/SummaryApi";
import ChatSection from '../components/ChatSection';
import { useSelector } from 'react-redux';

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const userId = useSelector(state => state.user._id);
  const userRole = useSelector(state => state.user.role);
  const [openChatId, setOpenChatId] = useState(null);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await Axios({
          ...SummaryApi.getMyBookings,
          method: "GET",
        });

        if (response.data.success) {
     
          setBookings(response.data.data);
        }
      } catch (error) {
        toast.error("Failed to fetch bookings");
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const handleReviewClick = (booking) => {
    if (!booking.service?._id) {
      toast.error("Service information not available for review");
      return;
    }
    navigate(`/review/${booking._id}`, {
      state: { serviceId: booking.service._id }
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center sm:text-left">Your Bookings</h2>
      {bookings.length === 0 ? (
        <div className="text-center py-8 sm:py-12">
          <p className="text-gray-500 text-base sm:text-lg mb-4">No bookings found</p>
          <button
            onClick={() => navigate('/services')}
            className="mt-2 sm:mt-4 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors w-full sm:w-auto"
          >
            Browse Services
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {bookings.map((booking) => (
          <motion.div
            key={booking._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/10 backdrop-blur-md rounded-xl p-4 sm:p-6 border border-white/20 relative flex flex-col"
          >
            <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">{booking.service?.title || "Service not found"}</h3>
            <div className="space-y-2 sm:space-y-3 mb-4 flex-grow">
              <p className="flex items-center">
                <FiClock className="mr-2" />
                {booking.date && booking.time 
                  ? (() => {
                      const dateTime = `${booking.date}T${booking.time}`;
                      const parsedDate = new Date(dateTime);
                      return !isNaN(parsedDate) 
                        ? parsedDate.toLocaleDateString()
                        : "Invalid date format";
                    })()
                  : booking.scheduledAt 
                    ? new Date(booking.scheduledAt).toLocaleDateString()
                    : "Date not set"
                }
              </p>
              <p className="flex items-center">
                <FiMapPin className="mr-2" />
                {booking.location || "Location not specified"}
              </p>
              <p className="text-sm">
                Provider: {booking.provider?.name || "Provider not found"}
              </p>
              <p className="text-sm">
                Duration: {booking.service?.duration ? `${booking.service.duration} hour${booking.service.duration !== 1 ? 's' : ''}` : "N/A"}
              </p>
              <p className="text-sm">
                Price: ₹{booking.service?.price || "N/A"}
              </p>
              <p className={`text-sm inline-block px-3 py-1 rounded-full ${
                booking.status === "completed" ? "bg-green-500/20" : 
                booking.status === "confirmed" ? "bg-blue-500/20" :
                booking.status === "cancelled" ? "bg-red-500/20" :
                "bg-yellow-500/20"
              }`}>
                Status: {booking.status}
              </p>
            </div>

            {booking.status === "completed" && !booking.hasReview && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleReviewClick(booking)}
                className="w-full mt-3 sm:mt-4 flex items-center justify-center gap-2 bg-green-500 text-white py-2.5 sm:py-3 px-4 rounded-lg hover:bg-green-600 transition-colors text-sm sm:text-base"
              >
                <FiStar className="text-lg" />
                Write Review
              </motion.button>
            )}
            {/* Chat Button for confirmed or completed bookings */}
            {(booking.status === 'confirmed' || booking.status === 'completed') && (
              <button
                className="mt-2 sm:mt-3 px-4 py-2.5 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full text-sm sm:text-base"
                onClick={() => navigate(`/chat/${booking._id}`)}
              >
                {userRole === 'PROVIDER' ? 'Chat with your client' : 'Chat with your provider'}
              </button>
            )}
          </motion.div>
                    ))}
          </div>
        )}
      </div>
    );
};

export default Bookings;