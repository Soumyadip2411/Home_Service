import React, { useState, useEffect } from "react";
import  SummaryApi  from "../common/SummaryApi"; // adjust the path if needed
import { toast } from "react-hot-toast"; // optional for feedback
import Axios from "../utils/Axios"
import GoogleMapLocationPicker from "./GoogleMapLocationPicker";

const AddService = () => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    duration: "",
    latitude: "",
    longitude: "",
    category: "",
  });

  const [categories, setCategories] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);

  // 📦 Fetch categories
  useEffect(() => {
    fetchCategories()
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
    } 
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
    if (location) {
      setFormData(prev => ({
        ...prev,
        latitude: location.lat.toString(),
        longitude: location.lng.toString(),
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        latitude: "",
        longitude: "",
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    // Validate location
    if (!selectedLocation) {
      toast.error("Please select a location on the map");
      return;
    }

    try {
      const response = await Axios({
        ...SummaryApi.addService,
        data: formData,
      });
  
      if (response.data.success) {
        toast.success("Service added successfully!");
        console.log("Response:", response.data);
        // Optionally clear form:
        setFormData({
          title: "",
          description: "",
          price: "",
          duration: "",
          latitude: "",
          longitude: "",
          category: "",
        });
        setSelectedLocation(null);
      } else {
        toast.error(response.data.message || "Failed to add service.");
      }
    } catch (error) {
      console.error("Add service error:", error);
      toast.error("Something went wrong while adding service.");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Add New Service</h2>
        <p className="text-yellow-700 bg-yellow-100 p-3 rounded mb-4 text-sm">
          📍 Please select your service center location on the map below.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4">
        <input
          type="text"
          name="title"
          placeholder="Service Title"
          value={formData.title}
          onChange={handleChange}
          className="border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
        <textarea
          name="description"
          placeholder="Service Description"
          value={formData.description}
          onChange={handleChange}
          className="border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows="3"
          required
        />
        <div className="grid grid-cols-2 gap-4">
          <input
            type="number"
            name="price"
            placeholder="Price per hour"
            value={formData.price}
            onChange={handleChange}
            className="border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
          <input
            type="text"
            name="duration"
            placeholder="Duration (e.g., 2 hours)"
            value={formData.duration}
            onChange={handleChange}
            className="border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        {/* Category Dropdown */}
        <select
          name="category"
          value={formData.category}
          onChange={handleChange}
          className="border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        >
          <option value="">Select Category</option>
          {categories.map((cat) => (
            <option key={cat._id} value={cat._id}>
              {cat.name}
            </option>
          ))}
        </select>

        {/* Google Maps Location Picker */}
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">
            Service Location *
          </label>
          <GoogleMapLocationPicker
            onLocationSelect={handleLocationSelect}
            showSearchBox={true}
            height="400px"
            readOnly={false}
          />
        </div>

        {/* Read-only GPS inputs for reference */}
        <div className="grid grid-cols-2 gap-4">
          <input
            type="text"
            name="latitude"
            placeholder="Latitude"
            value={formData.latitude}
            readOnly
            className="border p-3 rounded-lg bg-gray-100 text-gray-600"
          />
          <input
            type="text"
            name="longitude"
            placeholder="Longitude"
            value={formData.longitude}
            readOnly
            className="border p-3 rounded-lg bg-gray-100 text-gray-600"
          />
        </div>

        <button
          type="submit"
          disabled={!selectedLocation}
          className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Add Service
        </button>
      </form>
    </div>
  );
};

export default AddService;
