import React, { useEffect, useState } from "react";
import Axios from "../utils/Axios";
import SummaryApi from "../common/SummaryApi";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

const OPENCAGE_API_KEY = import.meta.env.VITE_OPENCAGE_API_KEY;

const fetchLocationName = async (lat, lng) => {
  if (!lat || !lng || !OPENCAGE_API_KEY) return null;
  try {
    const response = await fetch(
      `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lng}&key=${OPENCAGE_API_KEY}`
    );
    const data = await response.json();
    if (data.results && data.results[0]) {
      return data.results[0].formatted;
    }
    return null;
  } catch (err) {
    return null;
  }
};

const YourServices = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locationNames, setLocationNames] = useState({});
  const [locationLoading, setLocationLoading] = useState(false);

  const fetchProviderServices = async () => {
    try {
      const response = await Axios({
        url: "/api/service/", 
        method: "get",
      });

      if (response.data.success) {
        setServices(response.data.data);
      } else {
        toast.error("Failed to load services");
      }
    } catch (error) {
      console.error("Error loading services:", error);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviderServices();
  }, []);

  useEffect(() => {
    const fetchAllLocations = async () => {
      setLocationLoading(true);
      const locs = {};
      await Promise.all(
        services.map(async (service) => {
          const coords = service.location?.coordinates;
          if (coords && coords.length === 2) {
            const lat = coords[1];
            const lng = coords[0];
            const name = await fetchLocationName(lat, lng);
            locs[service._id] = name || `${lat}, ${lng}`;
          }
        })
      );
      setLocationNames(locs);
      setLocationLoading(false);
    };
    if (services.length > 0) fetchAllLocations();
  }, [services]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-6"
    >
      <motion.h2
        className="text-2xl font-bold mb-6 text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        Your Services
      </motion.h2>

      {loading ? (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">Loading...</motion.p>
      ) : services.length === 0 ? (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">You have not added any services yet.</motion.p>
      ) : (
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: {
              transition: {
                staggerChildren: 0.08
              }
            }
          }}
        >
          <AnimatePresence>
            {services.map((service) => (
              <motion.div
                key={service._id}
                className="border p-5 rounded-xl shadow-md bg-white/80 backdrop-blur-md hover:shadow-xl transition-all duration-300"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 30 }}
                whileHover={{ scale: 1.03 }}
              >
                <h3 className="font-bold text-lg mb-1">{service.title}</h3>
                <p className="text-sm text-gray-600 mb-2">{service.description}</p>
                <p className="text-sm mb-1">
                  <strong>Price:</strong> ₹{service.price}
                </p>
                <p className="text-sm mb-1">
                  <strong>Duration:</strong> {service.duration}
                </p>
                <p className="text-sm mb-1">
                  <strong>Category:</strong> {service.category?.name || "N/A"}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  <strong>Location:</strong>{" "}
                  {locationLoading && !locationNames[service._id] ? (
                    <span className="animate-pulse text-gray-400">Fetching...</span>
                  ) : (
                    locationNames[service._id] || "N/A"
                  )}
                </p>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </motion.div>
  );
};

export default YourServices;
