import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Axios from "../utils/Axios";
import { toast } from "react-hot-toast";
import { FiClock, FiMapPin, FiStar } from "react-icons/fi";

const CategoryServices = () => {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategoryServices = async () => {
      try {
        const [servicesResponse, categoryResponse] = await Promise.all([
          Axios({
            url: `/api/service/all-services?category=${categoryId}`,
            method: "get",
          }),
          Axios({
            url: `/api/category/${categoryId}`,
            method: "get",
          }),
        ]);

        if (servicesResponse.data.success && categoryResponse.data.success) {
          setServices(servicesResponse.data.data);
          setCategory(categoryResponse.data.data);
        }
      } catch (error) {
        toast.error("Failed to load services");
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryServices();
  }, [categoryId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h2 className="text-3xl font-bold text-white mb-2">{category?.name}</h2>
        <p className="text-white/70">{category?.description}</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service, index) => (
          <motion.div
            key={service._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white/10 backdrop-blur-md rounded-xl overflow-hidden border border-white/20 hover:border-white/40 transition-all duration-300 cursor-pointer"
            onClick={() => navigate(`/service/${service._id}`)}
          >
            <div className="relative h-48">
              <img
                src={service.provider?.avatar || `https://ui-avatars.com/api/?name=${service.title}`}
                alt={service.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <h3 className="text-xl font-semibold text-white">{service.title}</h3>
                <p className="text-white/70 text-sm">By {service.provider?.name}</p>
              </div>
            </div>

            <div className="p-4 space-y-3">
              <p className="text-white/80 line-clamp-2">{service.description}</p>
              
              <div className="flex items-center justify-between text-white/70">
                <div className="flex items-center gap-2">
                  <FiClock className="text-green-400" />
                  <span>{service.duration}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FiStar className="text-yellow-400" />
                  <span>{service.rating || "New"}</span>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4">
                <span className="text-2xl font-bold text-white">₹{service.price}</span>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2 bg-green-500/90 text-white rounded-lg hover:bg-green-600/90 transition-colors duration-300"
                >
                  Book Now
                </motion.button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {services.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <p className="text-white/70 text-lg">No services available in this category yet.</p>
        </motion.div>
      )}
    </div>
  );
};

export default CategoryServices;