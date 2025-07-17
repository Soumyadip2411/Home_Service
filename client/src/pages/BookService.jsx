import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import Axios from "../utils/Axios";

import { FiClock, FiMapPin, FiFileText, FiCalendar, FiDollarSign, FiCheck, FiChevronLeft, FiChevronRight } from "react-icons/fi";

import BookingProgress from "../components/BookingProgress";

const BookService = () => {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState(null);
  const [showContact, setShowContact] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [bookingData, setBookingData] = useState({
    date: "",
    time: "",
    instructions: "",
    phone: "",
    durationType: "hours",
    duration: 1
  });
  const [bookingLoading, setBookingLoading] = useState(false);
  
  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Custom steps for booking flow
  const bookingSteps = [
    { id: 1, title: 'Date & Time', icon: FiClock, description: 'Select date and time' },
    { id: 2, title: 'Additional Details', icon: FiMapPin, description: 'Location and instructions' },
    { id: 3, title: 'Review & Confirm', icon: FiFileText, description: 'Review details and confirm' },
    { id: 4, title: 'Booking Complete', icon: FiDollarSign, description: 'Booking confirmed' }
  ];

  const [pincodeData, setPincodeData] = useState(["", "", "", "", "", ""]);
  const pincodeRef = useRef([]);

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
      setShowContact(true);
    } catch (error) {
      console.error("Interaction tracking failed:", error);
      setShowContact(true);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'dateTime') {
      // Handle datetime-local input
      const date = new Date(value);
      const minutes = date.getMinutes();
      const roundedMinutes = Math.round(minutes / 30) * 30;
      date.setMinutes(roundedMinutes);
      date.setSeconds(0);
      date.setMilliseconds(0);
      
      // Extract date and time separately
      const dateStr = date.toISOString().split('T')[0];
      const timeStr = date.toTimeString().split(' ')[0];
      
      setBookingData(prev => ({
        ...prev,
        date: dateStr,
        time: timeStr
      }));
    } else {
      setBookingData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Function to validate current step
  const validateStep = (step) => {
    switch (step) {
      case 1:
        return bookingData.date !== "" && bookingData.time !== "";
      case 2:
        return bookingData.location !== "";
      case 3:
        return true; // Review step is always valid
      default:
        return false;
    }
  };

  // Add this function to trigger tag boost interaction
  const triggerTagBoost = async (step) => {
    let interactionType = null;
    if (step === 1) interactionType = 'view';
    else if (step === 2) interactionType = 'click';
    else if (step === 3) interactionType = 'booking';
    if (interactionType) {
      try {
        await Axios.post(`/api/interactions/${serviceId}`, { interactionType });
      } catch (err) {
        // Ignore errors for boosting
      }
    }
  };

  // Update nextStep to trigger tag boost on step change
  const nextStep = () => {
    if (validateStep(currentStep)) {
      const next = Math.min(currentStep + 1, 4);
      setCurrentStep(next);
      triggerTagBoost(next - 1); // Boost for the step just completed
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

    // Check if date and time are provided
    if (!bookingData.date || !bookingData.time) {
      toast.error("Please select a date and time");
      return;
    }

    // Validate date - convert to Date object for comparison
    const selectedDateTime = new Date(`${bookingData.date}T${bookingData.time}`);
    
    // Check if the date is valid
    if (isNaN(selectedDateTime.getTime())) {
      toast.error("Please select a valid date and time");
      return;
    }
    
    const now = new Date();
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3); // Allow bookings up to 3 months in advance

    if (selectedDateTime < now) {
      toast.error("Please select a future date and time");
      return;
    }

    if (selectedDateTime > maxDate) {
      toast.error("Bookings can only be made up to 3 months in advance");
      return;
    }
    
    const bookingDataForBackend = {
  date: bookingData.date,
  time: bookingData.time,
  instructions: bookingData.instructions || "",
  phone: bookingData.phone || "",
  location: bookingData.location || "",
  pincode: bookingData.pincode || ""
};
    
    try {
      const response = await Axios({
        url: `/api/bookings`,
        method: "post",
        data: {
          serviceId,
          ...bookingDataForBackend
        },
      });

      if (response.data.success) {
        await Axios.post(`/api/interactions/${serviceId}`, {
          interactionType: "booking"
        });
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

  // Calendar functions
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    const days = [];
    
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const fetchAvailableSlots = async (date) => {
    try {
      setLoadingSlots(true);
      
      // Validate the date before using toISOString
      if (!date || isNaN(date.getTime())) {
        console.error('Invalid date provided to fetchAvailableSlots');
        return;
      }
      
      const response = await Axios.get(`/api/service/${serviceId}/availability`, {
        params: {
          date: date.toISOString().split('T')[0]
        }
      });
      
      if (response.data.success) {
        setAvailableSlots(response.data.availableSlots);
      } else {
        toast.error(response.data.message || 'Failed to fetch availability');
      }
    } catch (error) {
      console.error('Error fetching availability:', error);
      toast.error('Failed to fetch available time slots');
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleDateSelect = (date) => {
    if (!date || isNaN(date.getTime())) {
      console.error('Invalid date provided to handleDateSelect');
      return;
    }
    
    setSelectedDate(date);
    setBookingData(prev => ({ ...prev, date: date.toISOString().split('T')[0] }));
    fetchAvailableSlots(date);
  };

  const handleTimeSlotSelect = (time) => {
    setBookingData(prev => ({ ...prev, time }));
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date) => {
    return selectedDate?.toDateString() === date.toDateString();
  };

  const isPastDate = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const formatMonthYear = (date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
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
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Select Date & Time</h3>
            
            {/* Calendar Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
              {/* Calendar */}
              <div className="bg-white/50 rounded-lg p-3 sm:p-6">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-lg font-semibold text-gray-800">Select Date</h4>
                  <div className="flex items-center gap-2">
                    <motion.button
                      onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                      className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <FiChevronLeft className="w-4 h-4" />
                    </motion.button>
                    <span className="text-lg font-medium text-gray-700">
                      {formatMonthYear(currentMonth)}
                    </span>
                    <motion.button
                      onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                      className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <FiChevronRight className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1 mb-4">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {getDaysInMonth(currentMonth).map((date, index) => (
                    <motion.button
                      key={index}
                      onClick={() => date && !isPastDate(date) && handleDateSelect(date)}
                      disabled={!date || isPastDate(date)}
                      className={`p-3 text-center rounded-lg transition-all ${
                        !date
                          ? 'invisible'
                          : isPastDate(date)
                          ? 'text-gray-400 cursor-not-allowed'
                          : isSelected(date)
                          ? 'bg-green-500 text-white shadow-lg'
                          : isToday(date)
                          ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                      whileHover={date && !isPastDate(date) ? { scale: 1.05 } : {}}
                      whileTap={date && !isPastDate(date) ? { scale: 0.95 } : {}}
                    >
                      {date ? date.getDate() : ''}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Time Slots */}
              <div className="bg-white/50 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-6">
                  <FiClock className="text-gray-600" />
                  <h4 className="text-lg font-semibold text-gray-800">Available Time Slots</h4>
                </div>

                {loadingSlots ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 max-h-[calc(100vh-24rem)] sm:max-h-96 overflow-y-auto">
                    {availableSlots.length === 0 ? (
                      <div className="col-span-2 text-center py-8 text-gray-500">
                        <FiClock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>No available slots for this date</p>
                      </div>
                    ) : (
                      availableSlots.map((slot, index) => (
                        <motion.button
                          key={index}
                          onClick={() => handleTimeSlotSelect(slot.time)}
                          disabled={!slot.available || slot.booked}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            slot.booked
                              ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'
                              : slot.available
                              ? bookingData.time === slot.time
                                ? 'bg-green-500 border-green-500 text-white'
                                : 'bg-white border-green-200 hover:border-green-400 hover:shadow-md text-gray-700'
                              : 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'
                          }`}
                          whileHover={slot.available && !slot.booked ? { scale: 1.02 } : {}}
                          whileTap={slot.available && !slot.booked ? { scale: 0.98 } : {}}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{slot.time}</span>
                            {slot.booked ? (
                              <FiCheck className="w-4 h-4 text-red-500" />
                            ) : slot.available ? (
                              <FiCheck className="w-4 h-4 text-green-500" />
                            ) : null}
                          </div>
                        </motion.button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-end">
              <motion.button
                onClick={() => setCurrentStep(2)}
                disabled={!bookingData.date || !bookingData.time}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Continue
              </motion.button>
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
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Additional Details</h3>
            <div className="space-y-3 sm:space-y-4">
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
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={bookingData.location || ''}
                  onChange={(e) => setBookingData({ ...bookingData, location: e.target.value })}
                  placeholder="Your address or location"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Pin Code
                </label>
                <div className="flex gap-2">
                  {pincodeData.map((el, index) => (
                    <input
                      key={`pincode${index}`}
                      type="text"
                      maxLength={1}
                      value={el}
                      ref={ref => (pincodeRef.current[index] = ref)}
                      onChange={e => {
                        const value = e.target.value.replace(/\D/, '');
                        const newData = [...pincodeData];
                        newData[index] = value;
                        setPincodeData(newData);
                        if (value && index < 5) {
                          pincodeRef.current[index + 1]?.focus();
                        }
                        if (!value && index > 0) {
                          pincodeRef.current[index - 1]?.focus();
                        }
                        // Update bookingData.pincode as a string
                        setBookingData(prev => ({ ...prev, pincode: newData.join("") }));
                      }}
                      className="w-10 h-10 text-lg font-bold text-center rounded-lg bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                    />
                  ))}
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
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Continue
              </motion.button>
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
            <div className="bg-white/10 backdrop-blur-md rounded-lg sm:rounded-xl p-4 sm:p-6 border border-white/20">
              <h4 className="text-lg font-semibold text-white mb-4">Booking Summary</h4>
              
              <div className="space-y-3 text-white/90">
                <div className="flex justify-between">
                  <span>Service:</span>
                  <span className="font-medium">{service?.title}</span>
                </div>
                <div className="flex justify-between">
                  <span>Date & Time:</span>
                  <span className="font-medium">
                    {bookingData.date && bookingData.time 
                      ? new Date(`${bookingData.date}T${bookingData.time}`).toLocaleString() 
                      : 'Not set'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Duration:</span>
                  <span className="font-medium">{service?.duration} hour{service?.duration !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex justify-between">
                  <span>Location:</span>
                  <span className="font-medium">{bookingData.location || 'Not set'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pin Code:</span>
                  <span className="font-medium">{bookingData.pincode || 'Not set'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Price:</span>
                  <span className="font-bold text-green-400">₹{service?.price}</span>
                </div>
                {bookingData.instructions && (
                  <div className="flex justify-between">
                    <span>Instructions:</span>
                    <span className="font-medium">{bookingData.instructions}</span>
                  </div>
                )}
                {bookingData.phone && (
                  <div className="flex justify-between">
                    <span>Phone:</span>
                    <span className="font-medium">{bookingData.phone}</span>
                  </div>
                )}
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
                onClick={handleSubmit}
                disabled={bookingLoading}
                className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {bookingLoading ? 'Booking...' : 'Confirm Booking'}
              </motion.button>
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

  useEffect(() => {
    setBookingData(prev => ({ ...prev, pincode: pincodeData.join("") }));
  }, [pincodeData]);

  if (!service) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <motion.div
      className="min-h-screen py-6 sm:py-12 px-2 sm:px-6 lg:px-8 relative"
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
          className="bg-white/20 dark:bg-gray-800/20 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-8 shadow-xl"
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
              className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-4 mb-4"
            >
              <img
                src={service?.provider?.avatar || `https://ui-avatars.com/api/?name=${service?.provider?.name}`}
                alt={service?.provider?.name}
                className="w-20 h-20 sm:w-16 sm:h-16 rounded-full object-cover ring-4 ring-green-500/30"
              />
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100">{service?.title}</h1>
                <p className="text-gray-600 dark:text-gray-400">by {service?.provider?.name}</p>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap justify-center sm:justify-start items-center gap-4 sm:gap-6 text-sm text-gray-600 dark:text-gray-400"
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
            {renderStepContent()}
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default BookService;
