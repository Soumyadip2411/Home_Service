import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import Axios from "../utils/Axios";
import SummaryApi from "../common/SummaryApi";
import { FiClock, FiMapPin, FiFileText, FiCalendar, FiDollarSign } from "react-icons/fi";
import GoogleMapLocationPicker from "../components/GoogleMapLocationPicker";
import { updateLocalTagProfile } from '../components/Recommendation';

const BookService = () => {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState(null);
  const [showContact, setShowContact] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [bookingData, setBookingData] = useState({
    scheduledAt: "",
    location: "",
    notes: "",
    durationType: "hours", // hours, days, months
    duration: 1,
  });

  useEffect(() => {
    const fetchServiceDetails = async () => {
      try {
        const response = await Axios({
          url: `/api/service/${serviceId}`,
          method: "get",
        });
        if (response.data.success) {
          setService(response.data.data);
        }
      } catch (error) {
        toast.error("Failed to load service details");
      }
    };
    fetchServiceDetails();
  }, [serviceId]);

  const handleContactClick = async () => {
    try {
      await Axios.post(`/api/interactions/${serviceId}`, {
        interactionType: "click"
      });
      // Update tag profile for content-based filtering
      if (service && service.tags && service.tags.length > 0) {
        updateLocalTagProfile(service.tags, 'content');
      }
      setShowContact(true);
    } catch (error) {
      console.error("Interaction tracking failed:", error);
      setShowContact(true);
    }
  };
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'scheduledAt') {
      // Round the selected time to the nearest 30-minute interval
      const date = new Date(value);
      const minutes = date.getMinutes();
      const roundedMinutes = Math.round(minutes / 30) * 30;
      date.setMinutes(roundedMinutes);
      date.setSeconds(0);
      date.setMilliseconds(0);
      
      // Format date in local timezone for datetime-local input
      const formatLocalDateTime = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      };
      
      setBookingData(prev => ({
        ...prev,
        [name]: formatLocalDateTime(date)
      }));
    } else {
      setBookingData(prev => ({ ...prev, [name]: value }));
    }
  };

  const calculateTotalPrice = () => {
    if (!service) return 0;
    const basePrice = service.price;
    const multiplier = {
      hours: 1,
      days: 8,
      months: 240,
    };
    return basePrice * multiplier[bookingData.durationType] * bookingData.duration;
  };

  const handleSubmit = async (e) => {
    console.log("called")
    e.preventDefault();

    // Validate date - convert local time to Date object for comparison
    const selectedDate = new Date(bookingData.scheduledAt);
    const now = new Date();
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3); // Allow bookings up to 3 months in advance

    if (selectedDate < now) {
      toast.error("Please select a future date and time");
      return;
    }

    if (selectedDate > maxDate) {
      toast.error("Bookings can only be made up to 3 months in advance");
      return;
    }
    
    // Convert local time to ISO string for backend (preserving the intended local time)
    const localDateTime = new Date(bookingData.scheduledAt);
    const bookingDataForBackend = {
      ...bookingData,
      scheduledAt: localDateTime.toISOString(),
      totalPrice: calculateTotalPrice(),
    };
    
    console.log(bookingDataForBackend)
    try {
      const response = await Axios({
        url: `/api/booking/create-booking/${serviceId}`,
        method: "post",
        data: bookingDataForBackend,
      });

      if (response.data.success) {
        await Axios.post(`/api/interactions/${serviceId}`, {
          interactionType: "booking"
        });
        // Update tag profile for content-based filtering
        if (service && service.tags && service.tags.length > 0) {
          updateLocalTagProfile(service.tags, 'content');
        }
        toast.success("Booking created successfully!");
        navigate(-1);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create booking");
    }
  };

  // Get service location for map
  const getServiceLocation = () => {
    if (!service?.location?.coordinates) return null;
    return {
      lat: service.location.coordinates[1],
      lng: service.location.coordinates[0]
    };
  };

  // Helper function to format current time for min attribute
  const getCurrentDateTimeLocal = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Helper function to format max date (3 months from now)
  const getMaxDateTimeLocal = () => {
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3);
    const year = maxDate.getFullYear();
    const month = String(maxDate.getMonth() + 1).padStart(2, '0');
    const day = String(maxDate.getDate()).padStart(2, '0');
    const hours = String(maxDate.getHours()).padStart(2, '0');
    const minutes = String(maxDate.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Update the datetime-local input to show min and max dates
  return (
    <motion.div
      className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        backgroundImage: "url('https://images.unsplash.com/photo-1521783593447-5702b9bfd267?q=80&w=1470&auto=format&fit=crop')",
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />
      
      <div className="max-w-4xl mx-auto relative z-10">
        <motion.div
          className="bg-white/10 backdrop-blur-md py-8 px-6 shadow-2xl rounded-2xl border border-white/20"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <motion.div 
            className="flex items-center justify-center mb-8"
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="text-center">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => navigate(`/services`)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium flex items-center gap-2"
                >
                  &larr; Back to Service
                </button>
                <div></div> {/* Spacer for centering */}
              </div>
              <h2 className="text-3xl font-extrabold text-white mb-2">Book Your Service</h2>
              <p className="text-white/70">Fill in the details to schedule your service</p>
            </div>
          </motion.div>

          {service && (
            <motion.div 
              className="mb-8 p-6 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <h3 className="text-xl font-semibold text-white mb-2">{service.title}</h3>
              <p className="text-white/70 mb-4">{service.description}</p>
              <div className="flex items-center justify-between text-white/90">
                <span className="flex items-center">
                  <FiDollarSign className="mr-2" />
                  Base Price: ₹{service.price}/hour
                </span>
                <span className="flex items-center">
                  <FiClock className="mr-2" />
                  {service.duration}
                </span>
              </div>
              
              {/* Service Location Map */}
              {getServiceLocation() && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-lg font-semibold text-white flex items-center">
                      <FiMapPin className="mr-2" />
                      Service Location
                    </h4>
                    <button
                      onClick={() => setShowMap(!showMap)}
                      className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                    >
                      {showMap ? 'Hide Map' : 'Show Map'}
                    </button>
                  </div>
                  
                  {showMap && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <GoogleMapLocationPicker
                        initialLocation={getServiceLocation()}
                        showSearchBox={false}
                        height="300px"
                        readOnly={true}
                        markers={[{
                          lat: getServiceLocation().lat,
                          lng: getServiceLocation().lng,
                          title: service.title
                        }]}
                      />
                    </motion.div>
                  )}
                </div>
              )}
              
              {/* Add contact details section */}
              {!showContact ? (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleContactClick}
                  className="w-full mt-4 flex justify-center items-center py-3 px-6 rounded-xl text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 font-medium"
                >
                  See Contact Details
                </motion.button>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-4 p-4 bg-blue-500/20 rounded-lg border border-blue-500/30"
                >
                  <h4 className="text-lg font-semibold text-white mb-2">Provider Contact</h4>
                  <p className="text-white/90">Email: {service?.provider?.email}</p>
                  <p className="text-white/90">Phone: {service?.provider?.mobile}</p>
                  <p className="text-sm text-white/70 mt-2">
                    Please book the service to get full contact details
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Date and Time Field */}
            <motion.div
              className="group"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <label className="block text-sm font-medium text-white mb-2 flex items-center">
                <FiCalendar className="mr-2" />
                Schedule Date & Time
              </label>
              <input
                type="datetime-local"
                name="scheduledAt"
                required
                value={bookingData.scheduledAt}
                onChange={handleChange}
                step="1800" // Set step to 30 minutes (1800 seconds)
                className="w-full px-4 py-3 rounded-lg bg-gray-800/60 border border-gray-600 text-gray-200 placeholder-gray-400 focus:ring-2 focus:ring-green-500/50 focus:border-transparent transition-all duration-300 backdrop-blur-sm"
                min={getCurrentDateTimeLocal()}
                max={getMaxDateTimeLocal()}
              />
            </motion.div>

            {/* Duration Selection */}
            <motion.div
              className="grid grid-cols-2 gap-4"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <div>
                <label className="block text-sm font-medium text-white mb-2 flex items-center">
                  <FiClock className="mr-2" />
                  Duration Type
                </label>
                <select
                  name="durationType"
                  value={bookingData.durationType}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg bg-gray-800/60 border border-gray-600 text-gray-200 focus:ring-2 focus:ring-green-500/50 focus:border-transparent transition-all duration-300 backdrop-blur-sm"
                >
                  <option value="hours" className="bg-gray-800">Hours</option>
                  <option value="days" className="bg-gray-800">Days</option>
                  <option value="months" className="bg-gray-800">Months</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">Duration</label>
                <input
                  type="number"
                  name="duration"
                  min="1"
                  value={bookingData.duration}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg bg-gray-800/60 border border-gray-600 text-gray-200 focus:ring-2 focus:ring-green-500/50 focus:border-transparent transition-all duration-300 backdrop-blur-sm"
                />
              </div>
            </motion.div>

            {/* Location Field */}
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <label className="block text-sm font-medium text-white mb-2 flex items-center">
                <FiMapPin className="mr-2" />
                Service Location
              </label>
              <input
                type="text"
                name="location"
                required
                value={bookingData.location}
                onChange={handleChange}
                placeholder="Enter service location"
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/20 text-white placeholder-white/50 focus:ring-2 focus:ring-green-500/50 focus:border-transparent transition-all duration-300 backdrop-blur-sm"
              />
            </motion.div>

            {/* Notes Field */}
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <label className="block text-sm font-medium text-white mb-2 flex items-center">
                <FiFileText className="mr-2" />
                Additional Notes
              </label>
              <textarea
                name="notes"
                rows="3"
                value={bookingData.notes}
                onChange={handleChange}
                placeholder="Any special requirements or notes"
                className="w-full px-4 py-3 rounded-lg bg-gray-800/60 border border-gray-600 text-gray-200 placeholder-gray-400 focus:ring-2 focus:ring-green-500/50 focus:border-transparent transition-all duration-300 backdrop-blur-sm resize-none"
              />
            </motion.div>

            {/* Total Price Display */}
            {service && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.9 }}
                className="mt-6 p-6 rounded-xl bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-white/20 backdrop-blur-md"
              >
                <div className="flex justify-between items-center">
                  <h4 className="text-lg font-semibold text-white">Total Price</h4>
                  <p className="text-3xl font-bold text-green-400">₹{calculateTotalPrice()}</p>
                </div>
              </motion.div>
            )}

            {/* Submit Button */}
            <motion.button
              type="submit"
              className="w-full flex justify-center items-center py-4 px-6 rounded-xl text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-300 font-medium text-lg backdrop-blur-sm"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Confirm Booking
            </motion.button>
          </form>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default BookService;
