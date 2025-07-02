import React, { useState, useRef, useEffect } from 'react';
import axios from '../utils/Axios';
import { FaRobot } from 'react-icons/fa';

const BotChat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Fetch chat history on mount
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data } = await axios.get('/api/chat/bot-chat/messages', {
          headers: {
            'auth-token': localStorage.getItem('token'),
          },
        });
        if (data.length === 0) {
          // If no history, show welcome message
          setMessages([{ sender: 'bot', text: 'Hi! I am your Home Service Assistant. How can I help you today?' }]);
        } else {
          setMessages(data.map(msg => ({ sender: msg.sender, text: msg.text, timestamp: msg.timestamp })));
        }
      } catch {
        setMessages([{ sender: 'bot', text: 'Hi! I am your Home Service Assistant. How can I help you today?' }]);
      }
    };
    fetchHistory();
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [messages]);

  const saveMessage = async (sender, text) => {
    try {
      await axios.post('/api/chat/bot-chat/message', { sender, text }, {
        headers: {
          'auth-token': localStorage.getItem('token'),
        },
      });
    } catch {}
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const userMessage = { sender: 'user', text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    await saveMessage('user', userMessage.text);
    try {
      const { data } = await axios.post('/api/chat/bot', { query: userMessage.text });
      const botMessage = { sender: 'bot', text: data.response };
      setMessages((prev) => [...prev, botMessage]);
      await saveMessage('bot', botMessage.text);
    } catch (err) {
      const botMessage = { sender: 'bot', text: 'Sorry, I could not process your request.' };
      setMessages((prev) => [...prev, botMessage]);
      await saveMessage('bot', botMessage.text);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-20 min-h-screen flex flex-col items-center bg-gradient-to-b from-white to-gray-50">
      <div className="w-full max-w-xl flex flex-col h-[80vh] border rounded-xl shadow-md overflow-hidden bg-white">
        <div className="flex items-center gap-3 px-5 py-4 bg-yellow-400 border-b sticky top-0 z-10">
          <FaRobot className="text-2xl text-black" />
          <h2 className="font-semibold text-black text-lg">Home Service Bot</h2>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 scroll-smooth scrollbar-thin scrollbar-thumb-yellow-300">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs px-4 py-2 rounded-2xl text-sm shadow-md ${msg.sender === 'user' ? 'bg-blue-500 text-white rounded-br-none' : msg.sender === 'bot' ? 'bg-yellow-100 text-gray-800 rounded-tl-none border' : 'bg-white text-gray-800 border border-gray-200'}`}>
                <p>{msg.text}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={handleSend} className="flex items-center gap-2 px-4 py-3 bg-white border-t sticky bottom-0">
          <input
            type="text"
            placeholder={loading ? 'Bot is typing...' : 'Type your question...'}
            className="flex-1 rounded-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 disabled:opacity-50"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            autoFocus
          />
          <button
            type="submit"
            className="bg-yellow-400 text-black px-4 py-2 rounded-full font-medium disabled:opacity-40 transition"
            disabled={loading || !input.trim()}
          >{loading ? '...' : 'Send'}</button>
        </form>
      </div>
    </div>
  );
};

export default BotChat; 