import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion"; // Add AnimatePresence here
import Axios from "../utils/Axios";
import SummaryApi from "../common/SummaryApi";
import AxiosToastError from "../utils/AxiosToastError";
import { useNavigate } from "react-router-dom";
import AddCategory from "./AddCategory";
import { useSelector } from "react-redux";

const Categories = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const user = useSelector((state) => state.user);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await Axios({
        ...SummaryApi.getAllCategories,
      });

      if (response.data.success) {
        setCategories(response.data.data);
      }
    } catch (error) {
      AxiosToastError(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-200"></div>
      </div>
    );
  }

  const handleCategoryClick = (categoryId) => {
    // Navigate to services page with category query parameter
    navigate(`/services?category=${categoryId}`);
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl text-purple-300 font-semibold">Home Services Categories</h2>
        {(user.role === "ADMIN" || user.role === "PROVIDER") && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowAddCategory(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-300"
          >
            Add Category
          </motion.button>
        )}
      </div>

      <AnimatePresence>
        {showAddCategory && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-6 bg-white/80 backdrop-blur-md rounded-xl p-6 shadow-xl"
          >
            <AddCategory
              onCategoryAdded={() => {
                fetchCategories();
                setShowAddCategory(false);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {categories.map((category) => (
          <motion.div
            key={category._id}
            onClick={() => handleCategoryClick(category._id)}
            className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow duration-300"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="relative h-48">
              <img
                src={category.image}
                alt={category.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-4 bg-white">
              <h3 className="text-lg font-medium text-gray-800 text-center">
                {category.name}
              </h3>
              {category.description && (
                <p className="mt-2 text-sm text-gray-600 text-center">
                  {category.description}
                </p>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Categories;
