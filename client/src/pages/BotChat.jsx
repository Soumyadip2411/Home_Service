import React from 'react';
import ChatSection from '../components/ChatSection';

const BotChat = () => {
  // For now, we can use a dummy bookingId and userId, or refactor ChatSection to support bot-only mode
  // In a real implementation, you might want a dedicated bot chat component
  return (
    <div className="pt-20"> {/* Add padding for header */}
      <h2 className="text-center text-2xl font-bold mb-4">Ask the Home Service Bot</h2>
      <ChatSection bookingId={null} userId={"bot-user"} userRole={"USER"} isBotChat />
    </div>
  );
};

export default BotChat; 