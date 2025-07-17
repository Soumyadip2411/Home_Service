import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../components/Header';
import { motion } from 'framer-motion';

const Home = () => {
  return (
    <div 
      className="min-h-screen bg-cover bg-center relative"
      style={{
        backgroundImage: "url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1500&q=80')", 
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat"
      }}
    >
      <div className="absolute inset-0 bg-black/60 z-0" />    
      <Header />
      
      <motion.div 
        className="relative z-10 container mx-auto px-3 sm:px-4 md:px-6 py-6 sm:py-8 mt-16 sm:mt-20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="bg-white/20 backdrop-blur-sm rounded-lg sm:rounded-xl shadow-xl p-4 sm:p-6 min-h-[calc(100vh-120px)] overflow-y-auto"
        >
          <Outlet />
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Home;
