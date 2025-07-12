import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { FiCamera, FiX, FiUpload } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import Axios from '../utils/Axios';

const AvatarUpload = ({ currentAvatar, userName, onAvatarUpdate, onClose }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size should be less than 5MB');
        return;
      }

      setSelectedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select an image first');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', selectedFile);

      const response = await Axios.put('/api/user/upload-avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        toast.success('Avatar updated successfully!');
        onAvatarUpdate(response.data.data.avatar);
        onClose();
      } else {
        toast.error(response.data.message || 'Failed to upload avatar');
      }
    } catch (error) {
      console.error('Avatar upload error:', error);
      toast.error(error.response?.data?.message || 'Failed to upload avatar');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setUploading(true);
    try {
      const response = await Axios.delete('/api/user/remove-avatar');

      if (response.data.success) {
        toast.success('Avatar removed successfully!');
        onAvatarUpdate('');
        onClose();
      } else {
        toast.error(response.data.message || 'Failed to remove avatar');
      }
    } catch (error) {
      console.error('Avatar removal error:', error);
      toast.error(error.response?.data?.message || 'Failed to remove avatar');
    } finally {
      setUploading(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-800">Update Avatar</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FiX className="text-xl" />
          </button>
        </div>

        {/* Current Avatar Display */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            {currentAvatar ? (
              <img
                src={currentAvatar}
                alt="Current Avatar"
                className="w-24 h-24 rounded-full object-cover border-4 border-green-500"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center text-white text-2xl font-bold border-4 border-green-500">
                {getInitials(userName)}
              </div>
            )}
            <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-2">
              <FiCamera className="text-white text-sm" />
            </div>
          </div>
        </div>

        {/* File Upload Section */}
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-500 transition-colors">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center gap-2 text-gray-600 hover:text-green-600 transition-colors"
            >
              <FiUpload className="text-3xl" />
              <span className="font-medium">Click to select image</span>
              <span className="text-sm text-gray-500">JPG, PNG, GIF (max 5MB)</span>
            </button>
          </div>

          {/* Preview */}
          {preview && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <h4 className="text-sm font-medium text-gray-700 mb-2">Preview:</h4>
              <img
                src={preview}
                alt="Preview"
                className="w-20 h-20 rounded-full object-cover mx-auto border-2 border-green-500"
              />
            </motion.div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            {currentAvatar && (
              <button
                onClick={handleRemoveAvatar}
                disabled={uploading}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors"
              >
                {uploading ? 'Removing...' : 'Remove Avatar'}
              </button>
            )}
            <button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors"
            >
              {uploading ? 'Uploading...' : 'Upload Avatar'}
            </button>
          </div>
        </div>

        {/* Tips */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-1">Tips:</h4>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• Use a square image for best results</li>
            <li>• Maximum file size: 5MB</li>
            <li>• Supported formats: JPG, PNG, GIF</li>
          </ul>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AvatarUpload; 