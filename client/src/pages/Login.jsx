import React, { useState, useEffect } from "react";
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa6";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Axios from "../utils/Axios";
import SummaryApi from "../common/SummaryApi";
import AxiosToastError from "../utils/AxiosToastError";
import fetchUserDetails from "../utils/fetchUserDetails";
import { useDispatch } from "react-redux";
import { setUserDetails } from "../store/userSlice";
import { motion } from "framer-motion";
import FaceLoginModal from "../components/FaceLoginModal";

const Login = () => {
  const [data, setData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showFaceModal, setShowFaceModal] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setData((prev) => ({ ...prev, [name]: value }));
  };

  const isValid = Object.values(data).every((val) => val.trim() !== "");

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0
    };

    toast.promise(
      new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            localStorage.setItem("userLat", latitude);
            localStorage.setItem("userLng", longitude);
            resolve("Location access granted");
          },
          (error) => {
            console.error("Location error:", error);
            switch (error.code) {
              case error.PERMISSION_DENIED:
                reject("Please allow location access to use all features");
                break;
              case error.POSITION_UNAVAILABLE:
                reject("Location information unavailable");
                break;
              case error.TIMEOUT:
                reject("Location request timed out");
                break;
              default:
                reject("An unknown error occurred");
            }
          },
          options
        );
      }),
      {
        loading: 'Getting your location...',
        success: 'Location updated successfully',
        error: (err) => err
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await Axios({ ...SummaryApi.login, data });

      if (response.data.error) {
        toast.error(response.data.message);
        return;
      }

      if (response.data.success) {
        toast.success(response.data.message);
        localStorage.setItem("accesstoken", response.data.data.accesstoken);
        localStorage.setItem("refreshToken", response.data.data.refreshToken);

        const userDetails = await fetchUserDetails();
        dispatch(setUserDetails(userDetails.data));
        setData({ email: "", password: "" });
        // Get location after successful login
        await handleGetLocation();
        navigate("/");
      }
    } catch (err) {
      AxiosToastError(err);
    }
  };

  const handleFaceLoginSuccess = async (user_id) => {
    // Optionally fetch tokens/user details here, or redirect
    toast.success("Logged in with face recognition!");
    // You may want to fetch tokens/user details from backend if needed
    // For now, just redirect to home
    navigate("/");
  };

  useEffect(() => {
    const token = localStorage.getItem("accesstoken");
    if (token) {
      navigate("/");
    }
  }, []);

  return (
    <motion.section
      className="min-h-screen bg-cover bg-center flex items-center justify-center"
      style={{
        backgroundImage:
          "url('https://images.unsplash.com/photo-1595170588111-c1e9d2d1adba?q=80&w=1476&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')",
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="bg-black bg-opacity-75 w-full max-w-md p-8 rounded-xl shadow-lg text-white"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-3xl font-bold mb-6 text-center text-green-400">
          Login to HomeService
        </h2>

        <form onSubmit={handleSubmit} className="grid gap-5">
          <motion.div
            className="flex flex-col gap-1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={data.email}
              onChange={handleChange}
              placeholder="Enter your email"
              className="bg-neutral-800 text-white p-3 rounded-lg border border-neutral-700 focus:border-green-500 outline-none transition-all duration-300 transform hover:scale-105 focus:scale-105"
            />
          </motion.div>

          <motion.div
            className="flex flex-col gap-1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={data.password}
                onChange={handleChange}
                placeholder="Enter your password"
                className="bg-neutral-800 text-white w-full p-3 pr-10 rounded-lg border border-neutral-700 focus:border-green-500 outline-none transition-all duration-300 transform hover:scale-105 focus:scale-105"
              />
              <span
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-lg cursor-pointer text-neutral-400 hover:text-white"
              >
                {showPassword ? <FaRegEye /> : <FaRegEyeSlash />}
              </span>
            </div>
            <Link
              to="/forgot-password"
              className="text-sm text-green-500 hover:underline text-right mt-1"
            >
              Forgot password?
            </Link>
          </motion.div>

          <motion.button
            type="submit"
            disabled={!isValid}
            className={`w-full py-3 rounded-lg font-semibold tracking-wide transition-all 
                            ${
                              isValid
                                ? "bg-green-600 hover:bg-green-700"
                                : "bg-neutral-700 cursor-not-allowed"
                            }`}
            whileHover={{ scale: isValid ? 1.05 : 1 }}
            whileTap={{ scale: isValid ? 0.98 : 1 }}
            transition={{ duration: 0.2 }}
          >
            Login
          </motion.button>
        </form>
        <button
          className="w-full mt-4 py-3 rounded-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-all"
          onClick={() => setShowFaceModal(true)}
          type="button"
        >
          Login with Face
        </button>
        <FaceLoginModal
          isOpen={showFaceModal}
          onClose={() => setShowFaceModal(false)}
          onLoginSuccess={handleFaceLoginSuccess}
        />

        <motion.p
          className="text-center mt-6 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          Don't have an account?{" "}
          <Link to="/register" className="text-green-500 hover:underline font-semibold">
            Register
          </Link>
        </motion.p>
      </motion.div>
    </motion.section>
  );
};

export default Login;
