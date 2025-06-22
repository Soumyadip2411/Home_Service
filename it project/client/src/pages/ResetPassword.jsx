import React, { useEffect, useState } from 'react';
import { FaRegEye, FaRegEyeSlash } from 'react-icons/fa6';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import SummaryApi from '../common/SummaryApi';
import toast from 'react-hot-toast';
import AxiosToastError from '../utils/AxiosToastError';
import Axios from '../utils/Axios';
import { motion } from 'framer-motion';

const ResetPassword = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [data, setData] = useState({
    email: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const valid = Object.values(data).every(el => el.trim() !== '');

  useEffect(() => {
    if (!(location?.state?.data?.success)) {
      navigate('/');
    }

    if (location?.state?.email) {
      setData(prev => ({ ...prev, email: location.state.email }));
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (data.newPassword !== data.confirmPassword) {
      toast.error('New password and confirm password must match.');
      return;
    }

    try {
      const response = await Axios({ ...SummaryApi.resetPassword, data });

      if (response.data.error) {
        toast.error(response.data.message);
      } else if (response.data.success) {
        toast.success(response.data.message);
        navigate('/login');
        setData({ email: '', newPassword: '', confirmPassword: '' });
      }
    } catch (error) {
      AxiosToastError(error);
    }
  };

  return (
    <section
      className="min-h-screen flex items-center justify-center bg-cover bg-center relative"
      style={{
        backgroundImage:
          "url('https://images.unsplash.com/photo-1742728572950-585516ec2425?q=80&w=1372&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')",
      }}
    >
      <div className="absolute inset-0 bg-black/70 z-0" />

      <motion.div
        className="relative z-10 bg-neutral-900 w-full max-w-lg p-8 rounded-2xl shadow-2xl border border-neutral-800 text-white backdrop-blur-md bg-opacity-90"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-2xl font-semibold text-center mb-2 text-green-400">
          Reset Your Password
        </h2>
        <p className="text-sm text-center text-neutral-400 mb-6">
          Create a strong and memorable password
        </p>

        <form onSubmit={handleSubmit} className="grid gap-5">
          {/* New Password */}
          <div className="grid gap-1">
            <label htmlFor="newPassword" className="text-sm font-medium">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="newPassword"
                name="newPassword"
                value={data.newPassword}
                onChange={handleChange}
                placeholder="Enter new password"
                className="w-full p-3 rounded-lg bg-neutral-800 text-white border border-neutral-700 focus:border-green-500 outline-none transition transform hover:scale-[1.01] focus:scale-[1.01]"
              />
              <div
                onClick={() => setShowPassword(prev => !prev)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 cursor-pointer"
              >
                {showPassword ? <FaRegEye /> : <FaRegEyeSlash />}
              </div>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="grid gap-1">
            <label htmlFor="confirmPassword" className="text-sm font-medium">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={data.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm password"
                className="w-full p-3 rounded-lg bg-neutral-800 text-white border border-neutral-700 focus:border-green-500 outline-none transition transform hover:scale-[1.01] focus:scale-[1.01]"
              />
              <div
                onClick={() => setShowConfirmPassword(prev => !prev)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 cursor-pointer"
              >
                {showConfirmPassword ? <FaRegEye /> : <FaRegEyeSlash />}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <motion.button
            type="submit"
            disabled={!valid}
            className={`w-full py-3 rounded-lg text-sm font-semibold tracking-wide transition-all ${
              valid
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-neutral-700 cursor-not-allowed'
            }`}
            whileTap={{ scale: 0.98 }}
            whileHover={{ scale: valid ? 1.02 : 1 }}
          >
            Change Password
          </motion.button>
        </form>

        <p className="text-center mt-6 text-sm text-neutral-400">
          Remembered your password?{' '}
          <Link to="/login" className="text-green-500 hover:underline font-semibold">
            Login
          </Link>
        </p>
      </motion.div>
    </section>
  );
};

export default ResetPassword;
