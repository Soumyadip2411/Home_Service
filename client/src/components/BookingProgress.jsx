import React from 'react';
import { motion } from 'framer-motion';
import { FiCheck, FiCalendar, FiClock, FiFileText, FiCheckCircle } from 'react-icons/fi';

const BookingProgress = ({ currentStep, totalSteps }) => {
  const steps = [
    { id: 1, title: 'Service Details', icon: FiFileText },
    { id: 2, title: 'Date & Time', icon: FiCalendar },
    { id: 3, title: 'Additional Info', icon: FiClock },
    { id: 4, title: 'Review & Book', icon: FiCheckCircle },
  ];

  return (
    <div className="mb-4 sm:mb-8 px-2 sm:px-4 overflow-x-auto">
      <div className="flex flex-row items-center justify-between gap-1 sm:gap-2 min-w-max pb-2">
        {steps.map((step, index) => {
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;
          const Icon = step.icon;

          return (
            <div key={step.id} className="flex flex-col sm:flex-row items-center w-full sm:w-auto">
              <motion.div
                className={`relative flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 transition-all duration-300 ${
                  isCompleted
                    ? 'bg-green-500 border-green-500 text-white'
                    : isCurrent
                    ? 'bg-blue-500 border-blue-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400'
                }`}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.1 }}
              >
                {isCompleted ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <FiCheck className="w-5 h-5" />
                  </motion.div>
                ) : (
                  <Icon className="w-5 h-5" />
                )}
              </motion.div>

              {/* Step Title */}
              <div className="ml-2 sm:ml-3">
                <motion.p
                  className={`text-xs sm:text-sm font-medium transition-colors duration-300 ${
                    isCompleted
                      ? 'text-green-600 dark:text-green-400'
                      : isCurrent
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 + 0.1 }}
                >
                  {step.title}
                </motion.p>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <motion.div
                  className={`hidden sm:flex w-8 sm:w-12 h-0.5 mx-2 sm:mx-4 transition-all duration-300 ${
                    isCompleted
                      ? 'bg-green-500'
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: isCompleted ? 1 : 0 }}
                  transition={{ delay: index * 0.1 + 0.2 }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Progress Bar */}
      <motion.div
        className="mt-4 sm:mt-6 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 sm:h-2 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <motion.div
          className="h-full bg-gradient-to-r from-green-500 to-blue-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
          transition={{ duration: 0.5, delay: 0.6 }}
        />
      </motion.div>

      {/* Step Counter */}
      <motion.div
        className="mt-3 sm:mt-4 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        <span className="text-sm text-gray-600 dark:text-gray-400">
          Step {currentStep} of {totalSteps}
        </span>
      </motion.div>
    </div>
  );
};

export default BookingProgress;