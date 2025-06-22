import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiClock, FiMapPin, FiStar } from 'react-icons/fi';

const BookingList = ({ bookings }) => {
  const navigate = useNavigate();

  const renderActionButton = (booking) => {
    if (booking.status === "completed" && !booking.hasReview) {
      return (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          onClick={() => navigate(`/review/${booking._id}`)}
        >
          <FiStar className="inline mr-2" />
          Write Review
        </motion.button>
      );
    }
    return null;
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {bookings.map((booking) => (
        <motion.div
          key={booking._id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20"
        >
          <h3 className="text-xl font-semibold mb-4">{booking.service.title}</h3>
          <div className="space-y-2 mb-4">
            <p className="flex items-center">
              <FiClock className="mr-2" />
              {new Date(booking.scheduledAt).toLocaleDateString()}
            </p>
            <p className="flex items-center">
              <FiMapPin className="mr-2" />
              {booking.location}
            </p>
            <p className="text-sm bg-white/20 inline-block px-3 py-1 rounded-full">
              Status: {booking.status}
            </p>
          </div>
          {renderActionButton(booking)}
        </motion.div>
      ))}
    </div>
  );
};

export default BookingList;