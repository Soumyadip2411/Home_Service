import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import ChatSection from '../components/ChatSection';

const ChatPage = () => {
  const { bookingId } = useParams();
  const userId = useSelector(state => state.user._id);
  const userRole = useSelector(state => state.user.role);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-start pt-8">
      
      <ChatSection bookingId={bookingId} userId={userId} userRole={userRole} />
    </div>
  );
};

export default ChatPage; 