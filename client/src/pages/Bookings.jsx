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
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6">Your Bookings</h2>
      {bookings.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No bookings found</p>
          <button
            onClick={() => navigate('/services')}
            className="mt-4 px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            Browse Services
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bookings.map((booking) => (
          <motion.div
            key={booking._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 relative"
          >
            <h3 className="text-xl font-semibold mb-4">{booking.service?.title || "Service not found"}</h3>
            <div className="space-y-2 mb-4">
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
                className="w-full mt-4 flex items-center justify-center gap-2 bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors"
              >
                <FiStar className="text-lg" />
                Write Review
              </motion.button>
            )}
            {/* Chat Button for confirmed or completed bookings */}
            {(booking.status === 'confirmed' || booking.status === 'completed') && (
              <button
                className="mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors w-full"
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