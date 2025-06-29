import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Axios from "../utils/Axios";
import SummaryApi from "../common/SummaryApi";
import AxiosToastError from "../utils/AxiosToastError";
import { motion } from "framer-motion";

const Register = () => {
  const [data, setData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    mobile: "",
  });
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setData((prev) => ({ ...prev, [name]: value }));
  };

  const isValid =
    Object.values(data).every((val) => val.trim() !== "") &&
    data.password === data.confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (data.password !== data.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      const response = await Axios({
        ...SummaryApi.register,
        data: {
          name: data.name,
          email: data.email,
          password: data.password,
          mobile: data.mobile,
        },
      });

      if (response.data.error) {
        toast.error(response.data.message);
      }

      if (response.data.success) {
        toast.success(response.data.message);
        navigate("/login");
      }
    } catch (error) {
      AxiosToastError(error);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("accesstoken");
    if (token) {
      navigate("/home");
    }
  }, []);

  return (
    <section
      className="min-h-screen flex items-center justify-center bg-cover bg-center relative"
      style={{
        backgroundImage:
          "url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c')",
      }}
    >
      <div className="absolute inset-0 bg-black/70 z-0" />

      <motion.div
        className="relative z-10 bg-neutral-900 w-full max-w-sm p-6 rounded-xl shadow-xl border border-neutral-800 backdrop-blur-md bg-opacity-90 max-h-[90vh] overflow-y-auto"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-2xl font-semibold mb-3 text-center text-green-400">
          Welcome to HomeService
        </h2>
        <p className="text-xs text-center text-neutral-400 mb-5">
          Sign up to access trusted home services
        </p>

        <form onSubmit={handleSubmit} className="grid gap-4">
          {["name", "email", "password", "confirmPassword", "mobile"].map(
            (field, idx) => (
              <motion.div
                key={idx}
                className="flex flex-col gap-1"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1, duration: 0.4 }}
              >
                <label
                  htmlFor={field}
                  className="text-xs font-medium capitalize text-neutral-300"
                >
                  {field === "confirmPassword"
                    ? "Confirm Password"
                    : field.charAt(0).toUpperCase() + field.slice(1)}
                </label>
                <input
                  type={field.includes("password") ? "password" : "text"}
                  name={field}
                  id={field}
                  value={data[field]}
                  onChange={handleChange}
                  placeholder={
                    field === "confirmPassword"
                      ? "Re-enter password"
                      : `Enter your ${field}`
                  }
                  className="bg-neutral-800 text-white text-sm p-3 rounded-md border border-neutral-700 focus:border-green-500 outline-none transition-all duration-300 transform hover:scale-105 focus:scale-105"
                />
              </motion.div>
            )
          )}

          <motion.button
            type="submit"
            disabled={!isValid}
            className={`w-full py-3 text-white text-sm font-semibold rounded-lg tracking-wide transition-all transform ${
              isValid
                ? "bg-green-600 hover:bg-green-700 cursor-pointer"
                : "bg-neutral-700 cursor-not-allowed"
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            {data.name ? `Register ${data.name}` : "Register"}
          </motion.button>
        </form>

        <motion.p
          className="text-center mt-4 text-xs text-neutral-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-green-500 hover:underline font-semibold"
          >
            Login
          </Link>
        </motion.p>
      </motion.div>
    </section>
  );
};

export default Register;
