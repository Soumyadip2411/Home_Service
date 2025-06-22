import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiClock, FiMapPin, FiStar } from 'react-icons/fi';

const BookingCard = ({ booking }) => {
  const navigate = useNavigate();

  return (
    <motion.div
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
      
      {booking.status === "completed" && !booking.hasReview && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate(`/review/${booking._id}`)}
          className="w-full mt-4 flex items-center justify-center gap-2 bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors"
        >
          <FiStar />
          Write Review
        </motion.button>
      )}
    </motion.div>
  );
};

export default BookingCard;