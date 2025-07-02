import React, { useEffect, useState, useRef } from 'react';
import axios from '../utils/Axios';

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase();
}

const suggestedPrompts = [
  'What services do you offer?',
  'How do I cancel a booking?',
  'What are your working hours?',
  'Can I reschedule my appointment?',
  'Is there a refund policy?'
];

const ChatSection = ({ bookingId, userId, userRole }) => {
  const [chatRoom, setChatRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    const fetchChatRoom = async () => {
      try {
        const { data } = await axios.get(`/api/chat/chatroom/${bookingId}`);
        setChatRoom(data);
      } catch {
        setChatRoom(null);
      }
    };
    fetchChatRoom();
  }, [bookingId]);

  useEffect(() => {
    if (!chatRoom) return;

    const fetchMessages = async () => {
      try {
        const { data } = await axios.get(`/api/chat/chatroom/${chatRoom._id}/messages`);
        setMessages(data);
      } catch {
        setMessages([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 2000);
    return () => clearInterval(interval);
  }, [chatRoom]);

  useEffect(() => {
    if (isAtBottom && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [messages, isAtBottom]);

  const handleScroll = () => {
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    setIsAtBottom(scrollTop + clientHeight >= scrollHeight - 10);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !chatRoom?.isActive) return;
    setSending(true);
    try {
      await axios.post(`/api/chat/chatroom/${chatRoom._id}/message`, { message: input });
      setInput('');
    } finally {
      setSending(false);
    }
  };

  const handleBotAsk = async (query) => {
    if (!chatRoom?.isActive) return;
    setSending(true);
    try {
      await axios.post(`/api/chat/chatroom/${chatRoom._id}/message`, { message: query });
      const { data } = await axios.post(`/api/chat/bot`, { query });
      await axios.post(`/api/chat/chatroom/${chatRoom._id}/message`, { message: data.response, senderId: 'bot' });

      const { data: newMessages } = await axios.get(`/api/chat/chatroom/${chatRoom._id}/messages`);
      setMessages(newMessages);
      setInput('');
    } catch {
      setMessages((prev) => [...prev, {
        _id: Date.now(),
        senderId: 'bot',
        message: 'Bot failed to respond.',
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setSending(false);
    }
  };

  if (!chatRoom) {
    return <div className="p-4 text-center text-gray-500">No chat available for this booking.</div>;
  }

  const chatPartner = userRole === 'PROVIDER' ? 'Client' : 'Provider';

  return (
    <div className="min-h-screen flex justify-center items-center bg-gradient-to-b from-white to-gray-50 px-4">
      <div className="w-full max-w-2xl flex flex-col h-[calc(100vh-120px)] sm:h-[80vh] border rounded-xl shadow-lg bg-white overflow-hidden relative">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 bg-white border-b">
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-lg">
            {getInitials(chatPartner)}
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 text-base">Chat with {chatPartner}</h2>
            <p className={`text-xs ${chatRoom.isActive ? 'text-green-600' : 'text-red-500'}`}>
              {chatRoom.isActive ? 'Active' : 'Closed'}
            </p>
          </div>
        </div>

        {/* Chat Messages */}
        <div
          ref={chatContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-4 py-3 space-y-2 scroll-smooth scrollbar-thin scrollbar-thumb-blue-300"
        >
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <div className="w-8 h-8 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
            </div>
          ) : messages.length === 0 ? (
            <p className="text-center text-gray-400 mt-10">No messages yet. Start the conversation!</p>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderId === userId;
              const isBot = msg.senderId === 'bot';
              return (
                <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  {!isMe && !isBot && (
                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-700 font-bold mr-2">
                      {getInitials(chatPartner)}
                    </div>
                  )}
                  <div className={`max-w-xs px-4 py-2 rounded-2xl text-sm shadow ${isMe ? 'bg-blue-500 text-white rounded-br-none' : isBot ? 'bg-yellow-100 text-gray-800 rounded-tl-none border' : 'bg-white text-gray-800 rounded-bl-none border'}`}>
                    <p>{msg.message}</p>
                    <span className="block text-[10px] text-gray-400 text-right mt-1">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {isMe && (
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold ml-2">
                      {getInitials('You')}
                    </div>
                  )}
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Scroll to bottom button */}
        {!isAtBottom && (
          <button
            className="absolute bottom-24 right-4 bg-blue-500 text-white px-3 py-1 text-xs rounded-full shadow-lg animate-bounce z-10"
            onClick={() => {
              messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
              setIsAtBottom(true);
            }}
          >
            ↓ Go Below
          </button>
        )}

        {/* Suggested Prompts */}
        {chatRoom.isActive && userRole!=='PROVIDER'&&(
          <div className="bg-white px-4 py-2 border-t text-sm flex flex-wrap gap-2">
            {suggestedPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleBotAsk(prompt)}
                className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded-full transition text-xs"
                disabled={sending}
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {/* Input Area */}
        <form onSubmit={handleSend} className="flex items-center gap-2 px-4 py-3 bg-white border-t sticky bottom-0">
          <input
            type="text"
            placeholder={chatRoom.isActive ? 'Type your message...' : 'Chat closed'}
            className="flex-1 rounded-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={!chatRoom.isActive || sending}
          />
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded-full font-medium disabled:opacity-40 transition"
            disabled={!chatRoom.isActive || sending || !input.trim()}
          >
            {sending ? '...' : 'Send'}
          </button>
          <button
            type="button"
            className="ml-2 text-sm text-blue-600 hover:underline"
            onClick={() => handleBotAsk(input)}
            disabled={!chatRoom.isActive || sending || !input.trim()}
          >
            Ask Bot
          </button>
        </form>

        {/* Closed Chat Notice */}
        {!chatRoom.isActive && (
          <div className="text-center text-xs py-2 text-red-500 bg-gray-100">Chat is closed. You can still view messages.</div>
        )}
      </div>
    </div>
  );
};

export default ChatSection;
