import React, { useState, useRef, useEffect } from 'react';
import axios from '../utils/Axios';
import { FaRobot, FaStar, FaMapMarkerAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom'

const BotChat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [recLoading, setRecLoading] = useState(false);
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

  // Tag profile update logic for localStorage
  const TAG_DECAY = 0.8;
  const TAG_BOOSTS = { bot: 1.0, content: 0.5, collab: 0.4 };
  const MAX_BOT_TAGS = 3; // Maximum tags to add from bot responses

  // Helper function to filter and prioritize bot tags
  const filterBotTags = (tags) => {
    if (!tags || tags.length === 0) return [];
    
    // Priority order: service categories > specific services > general terms
    const priorityCategories = [
      'cleaning', 'repair', 'beauty', 'fitness', 'education', 'technology', 
      'food', 'photography', 'legal', 'financial', 'health', 'home', 
      'pet', 'event', 'security', 'gardening', 'automotive'
    ];
    
    const specificServices = [
      'massage', 'tutoring', 'plumbing', 'electrical', 'carpentry', 'painting',
      'cooking', 'delivery', 'transport', 'consultation', 'installation'
    ];
    
    // Score tags based on priority
    const scoredTags = tags.map(tag => {
      let score = 0;
      const lowerTag = tag.toLowerCase();
      
      // High priority for service categories
      if (priorityCategories.includes(lowerTag)) {
        score += 10;
      }
      // Medium priority for specific services
      else if (specificServices.includes(lowerTag)) {
        score += 7;
      }
      // Lower priority for general terms
      else if (['professional', 'expert', 'quality', 'reliable', 'experienced'].includes(lowerTag)) {
        score += 3;
      }
      // Very low priority for generic terms
      else {
        score += 1;
      }
      
      return { tag, score };
    });
    
    // Sort by score and return top tags
    return scoredTags
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_BOT_TAGS)
      .map(item => item.tag);
  };

  // Utility to get the full tag profile breakdown from localStorage
  function getTagProfileBreakdown() {
    return JSON.parse(localStorage.getItem('userTagProfileBreakdown') || '{}');
  }

  // Utility to set the full tag profile breakdown in localStorage
  function setTagProfileBreakdown(profile) {
    localStorage.setItem('userTagProfileBreakdown', JSON.stringify(profile));
  }

  // Utility to get the flat tag profile (total scores)
  function getTagProfile() {
    const breakdown = getTagProfileBreakdown();
    const flat = {};
    for (let tag in breakdown) {
      flat[tag] = breakdown[tag].total;
    }
    return flat;
  }

  // Utility to sync tag profile to backend
  async function syncTagProfileToBackend(profile) {
    try {
      await axios.post('/api/recommendations/replace-profile', { profile }, {
        headers: {
          'auth-token': localStorage.getItem('token'),
        },
      });
    } catch (err) {
      // Optionally handle error
    }
  }

  // Update tag profile breakdown in localStorage
  function updateLocalTagProfile(newTags, source) {
    let profile = getTagProfileBreakdown();
    // Decay all tags
    for (let tag in profile) {
      for (let src of ['bot', 'content', 'collab']) {
        profile[tag][src] = (profile[tag][src] || 0) * TAG_DECAY;
      }
      profile[tag].total = (profile[tag].bot || 0) + (profile[tag].content || 0) + (profile[tag].collab || 0);
    }
    // Add/increase new tags
    for (let tag of newTags) {
      if (!profile[tag]) profile[tag] = { bot: 0, content: 0, collab: 0, total: 0 };
      profile[tag][source] = (profile[tag][source] || 0) + (TAG_BOOSTS[source] || 0.2);
      profile[tag].total = (profile[tag].bot || 0) + (profile[tag].content || 0) + (profile[tag].collab || 0);
    }
    setTagProfileBreakdown(profile);
    // Also update the flat profile for compatibility
    const flatProfile = getTagProfile();
    localStorage.setItem('userTagProfile', JSON.stringify(flatProfile));
    // Sync to backend in real time
    syncTagProfileToBackend(flatProfile);
    // Clean up unnecessary localStorage fields
    localStorage.removeItem('userTagProfileBreakdown');
    return flatProfile;
  }

  const fetchRecommendationsByProfile = async () => {
    setRecLoading(true);
    setRecommendations([]);
    try {
      const lat = parseFloat(localStorage.getItem('userLat'));
      const lng = parseFloat(localStorage.getItem('userLng'));
      if (!lat || !lng) return;
      const profile = getTagProfile();
      const { data } = await axios.post('/api/recommendations/profile-tags', {
        profile,
        lat,
        lng
      }, {
        headers: {
          'auth-token': localStorage.getItem('token'),
        },
      });
      setRecommendations(data.data || []);
    } catch {
      setRecommendations([]);
    } finally {
      setRecLoading(false);
    }
  };

  // Listen for real-time tag profile changes (across tabs)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'userTagProfile' || e.key === 'userTagProfileBreakdown') {
        fetchRecommendationsByProfile();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // On mount, fetch recommendations by current profile
  useEffect(() => {
    fetchRecommendationsByProfile();
    // eslint-disable-next-line
  }, []);

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
      // Extract tags from bot response and filter them
      const tagRes = await axios.post('/api/recommendations/extract-tags', { text: data.response });
      const allTags = tagRes.data.tags || [];
      const filteredTags = filterBotTags(allTags);
      
      if (filteredTags.length > 0) {
        updateLocalTagProfile(filteredTags, 'bot');
        fetchRecommendationsByProfile();
      } else {
        setRecommendations([]);
      }
    } catch (err) {
      const botMessage = { sender: 'bot', text: 'Sorry, I could not process your request.' };
      setMessages((prev) => [...prev, botMessage]);
      await saveMessage('bot', botMessage.text);
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  // Import useNavigate from react-router-dom at the top of your file:
  // ;
  const navigate = useNavigate();

  // Helper function to calculate distance
  const getDistance = (lat1, lon1, lat2, lon2) => {
    const toRad = (x) => (x * Math.PI) / 180;
    const R = 6371; 
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  return (
    <>
      <div className="fixed inset-0 bg-gradient-to-b from-white to-gray-50 flex flex-col items-center justify-center">
        <div className="w-full max-w-4xl flex flex-col h-full border rounded-xl shadow-md overflow-hidden bg-white">
          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-4 bg-yellow-400 border-b sticky top-0 z-10">
            <FaRobot className="text-2xl text-black" />
            <h2 className="font-semibold text-black text-lg">Home Service Bot</h2>
            <button
              onClick={() => navigate('/')}
              className="ml-auto bg-yellow-500 hover:bg-yellow-600 text-black font-medium px-4 py-2 rounded-full shadow transition"
            >
              Go Home
            </button>
          </div>
          
          {/* Main Content Area */}
          <div className="flex-1 flex overflow-hidden">
            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scroll-smooth scrollbar-thin scrollbar-thumb-yellow-300">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.sender === 'bot' && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white font-bold mr-2 shadow-md">
                        <FaRobot className="text-sm" />
                      </div>
                    )}
                    <div className={`max-w-xs px-4 py-3 rounded-2xl text-sm shadow-md ${
                      msg.sender === 'user' 
                        ? 'bg-blue-500 text-white rounded-br-none' 
                        : msg.sender === 'bot' 
                          ? 'bg-gradient-to-br from-yellow-50 to-orange-50 text-gray-800 rounded-tl-none border-2 border-yellow-200 shadow-lg' 
                          : 'bg-white text-gray-800 border border-gray-200'
                    }`}>
                      {msg.sender === 'bot' && (
                        <div className="flex items-center gap-2 mb-2">
                          <FaRobot className="text-yellow-500 text-xs" />
                          <span className="text-xs font-semibold text-yellow-600">AI Assistant</span>
                        </div>
                      )}
                      <p className="leading-relaxed">{msg.text}</p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              
              {/* Input Area */}
              <form onSubmit={handleSend} className="flex items-center gap-2 px-4 py-4 bg-white border-t">
                <input
                  type="text"
                  placeholder={loading ? 'Bot is typing...' : 'Type your question...'}
                  className="flex-1 rounded-full px-4 py-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 disabled:opacity-50"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={loading}
                  autoFocus
                />
                <button
                  type="submit"
                  className="bg-yellow-400 text-black px-6 py-3 rounded-full font-medium disabled:opacity-40 transition"
                  disabled={loading || !input.trim()}
                >{loading ? '...' : 'Send'}</button>
              </form>
            </div>
            
            {/* Recommendations Sidebar */}
            <div className="w-80 border-l bg-gray-50 flex flex-col">
              <div className="p-4 border-b bg-white">
                <h3 className="text-lg font-bold text-green-700">Recommended Services</h3>
                {recLoading && (
                  <p className="text-sm text-gray-500 mt-1">Loading...</p>
                )}
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {recommendations.length > 0 ? (
                  recommendations.slice(0, 3).map((service, idx) => {
                    const coords = {
                      lat: parseFloat(localStorage.getItem('userLat')),
                      lng: parseFloat(localStorage.getItem('userLng'))
                    };
                    const serviceLat = service.location?.coordinates[1];
                    const serviceLng = service.location?.coordinates[0];
                    const distance = getDistance(coords.lat, coords.lng, serviceLat, serviceLng);
                    
                    return (
                      <div key={service._id + idx} className="border rounded-lg overflow-hidden shadow-md bg-white min-h-[140px]">
                        <div className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <h3 className="text-base font-bold truncate">{service.title}</h3>
                            <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded">
                              {service.category?.name}
                            </span>
                          </div>

                          <div className="flex items-center mb-3">
                            <FaStar className="text-yellow-400 mr-1" />
                            <span className="font-semibold text-sm">
                              {service.avgRating?.toFixed(1) || 'New'}
                            </span>
                            <span className="text-gray-500 text-xs ml-2">
                              ({service.reviews?.length} reviews)
                            </span>
                          </div>

                          <div className="mb-4">
                            <p className="text-base font-bold text-green-600">
                              ₹{service.price}
                              <span className="text-sm text-gray-500 ml-2">
                                {service.duration}
                              </span>
                            </p>
                            {distance && (
                              <p className="flex items-center text-sm mt-2 text-gray-600">
                                <FaMapMarkerAlt className="mr-1 text-red-500" />
                                {distance.toFixed(1)} km away
                              </p>
                            )}
                          </div>

                          <button
                            onClick={() => navigate(`/service/${service._id}`)}
                            className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium py-2 rounded text-sm transition-all"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center text-gray-500 text-sm py-8">
                    Chat with the bot to get personalized recommendations
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BotChat; 