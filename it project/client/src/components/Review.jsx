import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import Axios from "../utils/Axios";
import { FiStar } from "react-icons/fi";
import SummaryApi from "../common/SummaryApi"; // Fixed import path

const Review = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookingDetails = async () => {
      try {
        const response = await Axios({
          url: `/api/booking/get-bookings`,
          method: "get",
        });

        if (response.data.success) {
          const foundBooking = response.data.data.find(
            (b) => b._id === bookingId
          );
          if (foundBooking) {
            setBooking(foundBooking);
          } else {
            toast.error("Booking not found");
            navigate("/bookings");
          }
        }
      } catch (error) {
        toast.error("Failed to fetch booking details");
        navigate("/bookings");
      } finally {
        setLoading(false);
      }
    };

    fetchBookingDetails();
  }, [bookingId, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!rating) {
        return toast.error("Please select a rating");
      }
      if (!comment.trim()) {
        return toast.error("Please add a comment");
      }
      if (!booking || !booking.service) {
        return toast.error("Invalid booking data");
      }

      const response = await Axios({
        url: `/api/review/create/${booking.service._id}`,
        method: "post",
        data: {
          rating: parseInt(rating),
          comment: comment.trim(),
          bookingId
        }
      });

      if (response.data.success) {
        toast.success("Review submitted successfully");
        navigate("/bookings");
      } else {
        toast.error(response.data.message || "Failed to submit review");
      }
    } catch (error) {
      console.error("Review submission error:", error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Failed to submit review. Please try again.");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!booking) return null;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Rate Service</h2>
      <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
        <h3 className="text-xl font-semibold mb-4">{booking.service.title}</h3>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <motion.button
                  key={star}
                  type="button"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setRating(star)}
                  className={`text-2xl ${
                    star <= rating ? "text-yellow-500" : "text-gray-400"
                  }`}
                >
                  <FiStar
                    className={star <= rating ? "fill-current" : ""}
                  />
                </motion.button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Comment</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-green-500 focus:ring-1 focus:ring-green-500"
              rows="4"
              required
            />
          </div>

          <motion.button
            type="submit"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            disabled={!rating || !comment}
          >
            Submit Review
          </motion.button>
        </form>
      </div>
    </div>
  );
};

export default Review;