import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../components/Header';
import { motion } from 'framer-motion';

const Home = () => {
  return (
    <div 
      className="min-h-screen bg-cover bg-center relative"
      style={{
        backgroundImage: "url('https://images.unsplash.com/photo-1521783593447-5702b9bfd267?q=80&w=1470&auto=format&fit=crop')"
      }}
    >
      <div className="absolute inset-0 bg-black/60 z-0" />
      
      <Header />
      
      <motion.div 
        className="relative z-10 container mx-auto px-4 py-8 mt-20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="bg-white/20 backdrop-blur-sm rounded-xl shadow-xl p-6 min-h-[calc(100vh-120px)] overflow-y-auto"
        >
          <Outlet />
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Home;
