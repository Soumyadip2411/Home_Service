import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FaUsers, 
  FaUserTie, 
  FaClock, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaEye,
  FaCheck,
  FaTimes,
  FaArrowLeft
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import axios from '../utils/Axios';

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase();
}

function Avatar({ avatar, name, size = 'w-10 h-10' }) {
  if (avatar) {
    return (
      <img
        src={avatar}
        alt={name}
        className={`${size} rounded-full object-cover`}
      />
    );
  }
  
  return (
    <div className={`${size} rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm`}>
      {getInitials(name)}
    </div>
  );
}

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProviders: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    rejectedRequests: 0
  });
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [action, setAction] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsResponse, requestsResponse] = await Promise.all([
        axios.get('/api/admin/stats'),
        axios.get('/api/admin/provider-requests')
      ]);

      if (statsResponse.data.success) {
        setStats(statsResponse.data.data);
      }

      if (requestsResponse.data.success) {
        setRequests(requestsResponse.data.data);
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
      if (error.response?.status === 403) {
        toast.error('Access denied. Admin only.');
        navigate('/');
        return;
      }
      toast.error('Failed to fetch admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (requestId, actionType) => {
    setSelectedRequest(requests.find(req => req._id === requestId));
    setAction(actionType);
    setShowModal(true);
  };

  const confirmAction = async () => {
    if (!selectedRequest) return;

    try {
      setProcessing(true);
      const endpoint = action === 'approve' 
        ? `/api/admin/approve-request/${selectedRequest._id}`
        : `/api/admin/reject-request/${selectedRequest._id}`;

      const response = await axios.post(endpoint, {
        adminNotes: adminNotes
      });

      if (response.data.success) {
        toast.success(`Request ${action === 'approve' ? 'approved' : 'rejected'} successfully`);
        setShowModal(false);
        setAdminNotes('');
        fetchData(); // Refresh data
      }
    } catch (error) {
      console.error('Error processing request:', error);
      toast.error('Failed to process request');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'approved': return 'text-green-600 bg-green-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <FaClock className="text-yellow-600" />;
      case 'approved': return <FaCheckCircle className="text-green-600" />;
      case 'rejected': return <FaTimesCircle className="text-red-600" />;
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="w-8 h-8 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
            >
              <FaArrowLeft />
              <span>Back to Home</span>
            </button>
            <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
          </div>
          <div className="text-sm text-gray-600">
            Managing Provider Requests
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FaUsers className="text-blue-600 text-xl" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-800">{stats.totalUsers}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <FaUserTie className="text-green-600 text-xl" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Providers</p>
                <p className="text-2xl font-bold text-gray-800">{stats.totalProviders}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <FaClock className="text-yellow-600 text-xl" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-800">{stats.pendingRequests}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <FaCheckCircle className="text-green-600 text-xl" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-gray-800">{stats.approvedRequests}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 rounded-lg">
                <FaTimesCircle className="text-red-600 text-xl" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-gray-800">{stats.rejectedRequests}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Provider Requests Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl shadow-lg overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Provider Requests</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Requested
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {requests.map((request, index) => (
                  <motion.tr
                    key={request._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <Avatar avatar={request.userId?.avatar} name={request.userName} />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {request.userName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {request.userId?.mobile || 'No phone'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {request.userEmail}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                        {getStatusIcon(request.status)}
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {request.status === 'pending' ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleAction(request._id, 'approve')}
                            className="flex items-center gap-1 text-green-600 hover:text-green-900 transition-colors"
                          >
                            <FaCheck className="text-sm" />
                            Approve
                          </button>
                          <button
                            onClick={() => handleAction(request._id, 'reject')}
                            className="flex items-center gap-1 text-red-600 hover:text-red-900 transition-colors"
                          >
                            <FaTimes className="text-sm" />
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-400">Processed</span>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {requests.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No provider requests found.
            </div>
          )}
        </motion.div>
      </div>

      {/* Action Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {action === 'approve' ? 'Approve' : 'Reject'} Provider Request
            </h3>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                User: <span className="font-medium">{selectedRequest?.userName}</span>
              </p>
              <p className="text-sm text-gray-600">
                Email: <span className="font-medium">{selectedRequest?.userEmail}</span>
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin Notes (Optional)
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
                placeholder="Add any notes about this decision..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmAction}
                disabled={processing}
                className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors ${
                  action === 'approve' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700'
                } disabled:opacity-50`}
              >
                {processing ? 'Processing...' : (action === 'approve' ? 'Approve' : 'Reject')}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard; 