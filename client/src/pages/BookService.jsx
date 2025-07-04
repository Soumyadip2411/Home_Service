import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import Axios from "../utils/Axios";

import { FiClock, FiMapPin, FiFileText, FiCalendar, FiDollarSign, FiCheck } from "react-icons/fi";

import BookingProgress from "../components/BookingProgress";
import { updateLocalTagProfile } from '../components/Recommendation';

const BookService = () => {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState(null);
  const [showContact, setShowContact] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [bookingData, setBookingData] = useState({
    scheduledAt: "",
    location: "",
    notes: "",
    durationType: "hours", // hours, days, months
    duration: 1,
  });

  // Custom steps for booking flow
  const bookingSteps = [
    { id: 1, title: 'Service Details', icon: FiClock, description: 'Select service and time' },
    { id: 2, title: 'Location & Duration', icon: FiMapPin, description: 'Choose location and duration' },
    { id: 3, title: 'Review & Confirm', icon: FiFileText, description: 'Review details and confirm' },
    { id: 4, title: 'Booking Complete', icon: FiDollarSign, description: 'Booking confirmed' }
  ];

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

  // Function to validate current step
  const validateStep = (step) => {
    switch (step) {
      case 1:
        return bookingData.scheduledAt !== "";
      case 2:
        return bookingData.location !== "" && bookingData.duration > 0;
      case 3:
        return true; // Review step is always valid
      default:
        return false;
    }
  };

  // Function to go to next step
  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    } else {
      toast.error("Please fill in all required fields before proceeding");
    }
  };

  // Function to go to previous step
  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e) => {
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
        setCurrentStep(4);
        toast.success("Booking created successfully!");
        setTimeout(() => {
          navigate(-1);
        }, 2000);
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

  // Helper function to format max date (3 months from now) for max attribute
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

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <h3 className="text-xl font-semibold text-white mb-4">Step 1: Service Details</h3>
            
            {/* Date and Time Field */}
            <div className="group">
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
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <h3 className="text-xl font-semibold text-white mb-4">Step 2: Location & Duration</h3>
            
            {/* Duration Selection */}
            <div className="grid grid-cols-2 gap-4">
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
            </div>

            {/* Location Field */}
            <div>
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
            </div>

            {/* Notes Field */}
            <div>
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
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <h3 className="text-xl font-semibold text-white mb-4">Step 3: Review & Confirm</h3>
            
            {/* Review Summary */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <h4 className="text-lg font-semibold text-white mb-4">Booking Summary</h4>
              
              <div className="space-y-3 text-white/90">
                <div className="flex justify-between">
                  <span>Service:</span>
                  <span className="font-medium">{service?.title}</span>
                </div>
                <div className="flex justify-between">
                  <span>Date & Time:</span>
                  <span className="font-medium">
                    {bookingData.scheduledAt ? new Date(bookingData.scheduledAt).toLocaleString() : 'Not set'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Location:</span>
                  <span className="font-medium">{bookingData.location || 'Not set'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Duration:</span>
                  <span className="font-medium">{bookingData.duration} {bookingData.durationType}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Price:</span>
                  <span className="font-bold text-green-400">₹{calculateTotalPrice()}</span>
                </div>
              </div>
            </div>
          </motion.div>
        );

      case 4:
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-6"
          >
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto">
              <FiCheck className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white">Booking Confirmed!</h3>
            <p className="text-white/70">Your booking has been successfully created. You will receive a confirmation email shortly.</p>
          </motion.div>
        );

      default:
        return null;
    }
  };

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
          className="bg-white/20 dark:bg-gray-800/20 backdrop-blur-sm rounded-2xl p-8 shadow-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Service Details Header */}
          <div className="mb-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-4 mb-4"
            >
              <img
                src={service?.provider?.avatar || `https://ui-avatars.com/api/?name=${service?.provider?.name}`}
                alt={service?.provider?.name}
                className="w-16 h-16 rounded-full object-cover ring-4 ring-green-500/30"
              />
              <div>
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">{service?.title}</h1>
                <p className="text-gray-600 dark:text-gray-400">by {service?.provider?.name}</p>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400"
            >
              <div className="flex items-center gap-2">
                <span className="text-yellow-500">★</span>
                <span>{service?.avgRating?.toFixed(1) || "New"} rating</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500">₹</span>
                <span className="font-semibold">{service?.price}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-blue-500">📍</span>
                <span>{service?.distance?.toFixed(1)} km away</span>
              </div>
            </motion.div>
          </div>

          {/* Booking Progress */}
          <BookingProgress currentStep={currentStep} totalSteps={4} />

          {/* Step Content */}
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="mt-8"
          >
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Service Details</h3>
                  <div className="bg-white/50 dark:bg-gray-700/50 rounded-lg p-6">
                    <p className="text-gray-700 dark:text-gray-300 mb-4">{service?.description}</p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-600 dark:text-gray-400">Category:</span>
                        <span className="ml-2 text-gray-800 dark:text-gray-200">{service?.category?.name}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600 dark:text-gray-400">Price:</span>
                        <span className="ml-2 text-green-600 dark:text-green-400 font-semibold">₹{service?.price}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <motion.button
                    onClick={() => setCurrentStep(2)}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Continue
                  </motion.button>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Select Date & Time</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Preferred Date
                      </label>
                      <input
                        type="date"
                        value={bookingData.date}
                        onChange={(e) => setBookingData({ ...bookingData, date: e.target.value })}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Preferred Time
                      </label>
                      <input
                        type="time"
                        value={bookingData.time}
                        onChange={(e) => setBookingData({ ...bookingData, time: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <motion.button
                    onClick={() => setCurrentStep(1)}
                    className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Back
                  </motion.button>
                  <motion.button
                    onClick={() => setCurrentStep(3)}
                    disabled={!bookingData.date || !bookingData.time}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Continue
                  </motion.button>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Additional Details</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Special Instructions
                      </label>
                      <textarea
                        value={bookingData.instructions}
                        onChange={(e) => setBookingData({ ...bookingData, instructions: e.target.value })}
                        rows={4}
                        placeholder="Any special requirements or instructions..."
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Contact Phone
                      </label>
                      <input
                        type="tel"
                        value={bookingData.phone}
                        onChange={(e) => setBookingData({ ...bookingData, phone: e.target.value })}
                        placeholder="Your contact number"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <motion.button
                    onClick={() => setCurrentStep(2)}
                    className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Back
                  </motion.button>
                  <motion.button
                    onClick={() => setCurrentStep(4)}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Review & Book
                  </motion.button>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Review & Confirm</h3>
                  <div className="bg-white/50 dark:bg-gray-700/50 rounded-lg p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="font-medium text-gray-600 dark:text-gray-400">Service:</span>
                        <span className="ml-2 text-gray-800 dark:text-gray-200">{service?.title}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600 dark:text-gray-400">Provider:</span>
                        <span className="ml-2 text-gray-800 dark:text-gray-200">{service?.provider?.name}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600 dark:text-gray-400">Date:</span>
                        <span className="ml-2 text-gray-800 dark:text-gray-200">{bookingData.date}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600 dark:text-gray-400">Time:</span>
                        <span className="ml-2 text-gray-800 dark:text-gray-200">{bookingData.time}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600 dark:text-gray-400">Price:</span>
                        <span className="ml-2 text-green-600 dark:text-green-400 font-semibold">₹{service?.price}</span>
                      </div>
                      {bookingData.phone && (
                        <div>
                          <span className="font-medium text-gray-600 dark:text-gray-400">Phone:</span>
                          <span className="ml-2 text-gray-800 dark:text-gray-200">{bookingData.phone}</span>
                        </div>
                      )}
                    </div>
                    {bookingData.instructions && (
                      <div>
                        <span className="font-medium text-gray-600 dark:text-gray-400">Instructions:</span>
                        <p className="mt-1 text-gray-800 dark:text-gray-200">{bookingData.instructions}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <motion.button
                    onClick={() => setCurrentStep(3)}
                    className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Back
                  </motion.button>
                  <motion.button
                    onClick={handleSubmit}
                    className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Confirm Booking
                  </motion.button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default BookService;
