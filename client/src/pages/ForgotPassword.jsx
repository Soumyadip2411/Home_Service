import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import AxiosToastError from '../utils/AxiosToastError';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const ForgotPassword = () => {
    const [data, setData] = useState({ email: '' });
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setData(prev => ({ ...prev, [name]: value }));
    };

    const isValid = Object.values(data).every(val => val.trim() !== '');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await Axios({ ...SummaryApi.forgot_password, data });
            if (response.data.error) {
                toast.error(response.data.message);
            } else if (response.data.success) {
                toast.success(response.data.message);
                navigate('/verification-otp', { state: data });
                setData({ email: '' });
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
                    "url('https://images.unsplash.com/photo-1742943892619-501567da0c62?q=80&w=1469&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')",
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
                    Forgot Your Password?
                </h2>
                <p className="text-xs text-center text-neutral-400 mb-5">
                    We’ll send a verification code to your email
                </p>

                <form onSubmit={handleSubmit} className="grid gap-4">
                    <motion.div
                        className="flex flex-col gap-1"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1, duration: 0.4 }}
                    >
                        <label
                            htmlFor="email"
                            className="text-xs font-medium text-neutral-300"
                        >
                            Email
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={data.email}
                            onChange={handleChange}
                            placeholder="Enter your email"
                            className="bg-neutral-800 text-white text-sm p-3 rounded-md border border-neutral-700 focus:border-green-500 outline-none transition-all duration-300 transform hover:scale-105 focus:scale-105"
                        />
                    </motion.div>

                    <motion.button
                        type="submit"
                        disabled={!isValid}
                        className={`w-full py-3 text-white text-sm font-semibold rounded-lg tracking-wide transition-all transform ${
                            isValid
                                ? 'bg-green-600 hover:bg-green-700 cursor-pointer'
                                : 'bg-neutral-700 cursor-not-allowed'
                        }`}
                        whileHover={{ scale: isValid ? 1.05 : 1 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        Send OTP
                    </motion.button>
                </form>

                <motion.p
                    className="text-center mt-4 text-xs text-neutral-400"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                >
                    Already have an account?{' '}
                    <Link to="/login" className="text-green-500 hover:underline font-semibold">
                        Login
                    </Link>
                </motion.p>
            </motion.div>
        </section>
    );
};

export default ForgotPassword;
