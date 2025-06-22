import React, { useEffect, useState } from "react";
import Axios from "../utils/Axios";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";
import { useSelector } from "react-redux";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { FiStar } from "react-icons/fi";

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("requests");
  const user = useSelector((state) => state.user);
  const navigate = useNavigate();

  const fetchBookings = async () => {
    try {
      const response = await Axios({
        url: view === "requests" 
          ? "/api/booking/get-bookings"
          : "/api/booking/my-bookings",
        method: "get",
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

  useEffect(() => {
    fetchBookings();
  }, [view]);

  const handleStatusUpdate = async (bookingId, newStatus) => {
    try {
      const response = await Axios({
        url: `/api/booking/update-booking-status/${bookingId}`,
        method: "post",
        data: { status: newStatus },
      });

      if (response.data.success) {
        toast.success(`Booking ${newStatus} successfully`);
        fetchBookings();
      }
    } catch (error) {
      toast.error("Failed to update booking status");
    }
  };

  const StatusActions = ({ booking }) => {
    if (user.role !== "PROVIDER" || view === "myrequests") return null;

    if (booking.status === "pending") {
      return (
        <div className="flex gap-2">
          <button
            onClick={() => handleStatusUpdate(booking._id, "confirmed")}
            className="px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            Confirm
          </button>
          <button
            onClick={() => handleStatusUpdate(booking._id, "cancelled")}
            className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Cancel
          </button>
        </div>
      );
    }

    if (booking.status === "confirmed") {
      return (
        <button
          onClick={() => handleStatusUpdate(booking._id, "completed")}
          className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Mark as Completed
        </button>
      );
    }

    return null;
  };

  const ReviewButton = ({ booking }) => {
    // Show review button for completed bookings that haven't been reviewed yet
    if (booking.status !== "completed" || booking.hasReview) return null;

    return (
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => navigate(`/review/${booking._id}`)}
        className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors flex items-center gap-2"
      >
        <FiStar />
        Rate Service
      </motion.button>
    );
  };

  return (
    <div className="p-6">
      {user.role === "PROVIDER" && (
        <div className="mb-6 flex gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setView("requests")}
            className={`px-4 py-2 rounded-lg transition-all duration-300 ${
              view === "requests"
                ? "bg-green-500 text-white"
                : "bg-white/10 text-gray-600 hover:bg-white/20"
            }`}
          >
            Service Requests
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setView("myrequests")}
            className={`px-4 py-2 rounded-lg transition-all duration-300 ${
              view === "myrequests"
                ? "bg-green-500 text-white"
                : "bg-white/10 text-gray-600 hover:bg-white/20"
            }`}
          >
            My Requests
          </motion.button>
        </div>
      )}

      <h2 className="text-2xl font-bold mb-6">
        {user.role === "PROVIDER" 
          ? view === "requests" 
            ? "Service Requests" 
            : "My Requests"
          : "My Requests"}
      </h2>

      {loading ? (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        </div>
      ) : (
        <div className="grid gap-6">
          {bookings.map((booking) => (
            <motion.div key={booking._id} className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold">{booking.service.title}</h3>
                  <p className="text-gray-600">
                    {user.role === "PROVIDER" && view === "requests"
                      ? `Customer: ${booking.customer.name}`
                      : `Provider: ${booking.provider.name}`}
                  </p>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-lg font-bold">₹{booking.service.price}</span>
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    booking.status === "confirmed" ? "bg-green-100 text-green-800" :
                    booking.status === "completed" ? "bg-blue-100 text-blue-800" :
                    booking.status === "cancelled" ? "bg-red-100 text-red-800" :
                    "bg-yellow-100 text-yellow-800"
                  }`}>
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-gray-600">Scheduled for:</p>
                  <p className="font-medium">
                    {format(new Date(booking.scheduledAt), "PPP p")}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Location:</p>
                  <p className="font-medium">{booking.location}</p>
                </div>
              </div>

              {booking.notes && (
                <div className="mb-4">
                  <p className="text-gray-600">Notes:</p>
                  <p className="font-medium">{booking.notes}</p>
                </div>
              )}

              <div className="flex justify-between items-center mt-4">
                {user.role === "PROVIDER" && view === "requests" ? (
                  <StatusActions booking={booking} />
                ) : (
                  <>
                    <div className="text-sm text-gray-400">
                      {booking.status === "completed" && !booking.hasReview && 
                        "You can now rate this service"}
                    </div>
                    <ReviewButton booking={booking} />
                  </>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Bookings;
