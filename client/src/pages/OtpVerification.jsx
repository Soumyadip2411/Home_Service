import React, { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import AxiosToastError from '../utils/AxiosToastError';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const OtpVerification = () => {
  const [data, setData] = useState(["", "", "", "", "", ""]);
  const inputRef = useRef([]);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!location?.state?.email) {
      navigate("/forgot-password");
    }
  }, []);

  const isOtpValid = data.every(el => el);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await Axios({
        ...SummaryApi.forgot_password_otp_verification,
        data: {
          otp: data.join(""),
          email: location?.state?.email,
        },
      });

      if (response.data.error) {
        toast.error(response.data.message);
      } else if (response.data.success) {
        toast.success(response.data.message);
        setData(["", "", "", "", "", ""]);
        navigate("/reset-password", {
          state: {
            data: response.data,
            email: location?.state?.email,
          },
        });
      }
    } catch (error) {
      AxiosToastError(error);
    }
  };

  const handleChange = (e, index) => {
    const value = e.target.value.replace(/\D/, '');
    const newData = [...data];
    newData[index] = value;
    setData(newData);

    if (value && index < 5) {
      inputRef.current[index + 1]?.focus();
    }
    if (!value && index > 0) {
      inputRef.current[index - 1]?.focus();
    }
  };

  return (
    <section
      className="w-full min-h-screen flex items-center justify-center bg-cover bg-center relative px-4"
      style={{
        backgroundImage:
          "url('https://images.unsplash.com/photo-1717475769536-ba7cce01dbd5?q=80&w=1632&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')",
      }}
    >
      <div className="absolute inset-0 bg-black/70 z-0" />

      <motion.div
        className="relative z-10 bg-neutral-900 text-white w-full max-w-md rounded-2xl p-8 border border-neutral-800 shadow-2xl backdrop-blur-md bg-opacity-90"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-2xl font-bold text-center text-green-400 mb-1">OTP Verification</h2>
        <p className="text-sm text-center text-neutral-400 mb-6">
          Enter the 6-digit code sent to your email
        </p>

        <form onSubmit={handleSubmit} className="grid gap-6">
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">Enter OTP:</label>
            <div className="flex justify-between gap-2">
              {data.map((el, index) => (
                <input
                  key={`otp${index}`}
                  type="text"
                  maxLength={1}
                  value={el}
                  ref={(ref) => (inputRef.current[index] = ref)}
                  onChange={(e) => handleChange(e, index)}
                  className="w-12 h-12 text-lg font-bold text-center rounded-lg bg-neutral-800 border border-neutral-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                />
              ))}
            </div>
          </div>

          <motion.button
            type="submit"
            disabled={!isOtpValid}
            className={`w-full py-3 rounded-lg font-semibold text-sm tracking-wide transition-all ${
              isOtpValid
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-neutral-700 cursor-not-allowed'
            }`}
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: isOtpValid ? 1.02 : 1 }}
          >
            Verify OTP
          </motion.button>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-400">
          Already have an account?{' '}
          <Link to="/login" className="text-green-500 font-medium hover:underline">
            Login here
          </Link>
        </p>
      </motion.div>
    </section>
  );
};

export default OtpVerification;
