'use client';
import { useEffect, useState, useCallback } from 'react';
import { producerListDisputes, producerGetDispute, producerPostDisputeMessage } from '@/lib/api/disputes';
import CircleSpinner from '@/components/CircleSpinner';
import { 
  FaSearch, 
  FaFilter, 
  FaPaperPlane, 
  FaExclamationTriangle, 
  FaClock, 
  FaCheckCircle,
  FaUser,
  FaStore,
  FaComment,
  FaSync,
  FaArrowRight
} from 'react-icons/fa';

// SVG Pattern Component
const GridPattern = () => (
  <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern id="grid-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
        <circle cx="2" cy="2" r="1" fill="currentColor" opacity="0.1" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#grid-pattern)" />
  </svg>
);

const StatusBadge = ({ status }) => {
  const getStatusConfig = (status) => {
    const configs = {
      open: { color: 'bg-red-100 text-red-800 border-red-200', icon: FaExclamationTriangle },
      under_review: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: FaClock },
      awaiting_user: { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: FaUser },
      awaiting_producer: { color: 'bg-orange-100 text-orange-800 border-orange-200', icon: FaStore },
      resolved: { color: 'bg-green-100 text-green-800 border-green-200', icon: FaCheckCircle },
      refunded: { color: 'bg-purple-100 text-purple-800 border-purple-200', icon: FaCheckCircle },
      rejected: { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: FaExclamationTriangle },
    };
    return configs[status] || configs.open;
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border text-xs font-medium ${config.color}`}>
      <Icon className="text-xs" />
      <span>{status.replace(/_/g, ' ').toUpperCase()}</span>
    </div>
  );
};

export default function ProducerDisputesPage() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [filters, setFilters] = useState({ status: '', q: '' });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const rows = await producerListDisputes(filters);
      setList(rows || []);
    } catch { 
      setList([]); 
    } finally { 
      setLoading(false); 
    }
  }, [filters]);
  
  useEffect(() => { load(); }, [load]);

  const open = async (id) => {
    try { 
      const data = await producerGetDispute(id); 
      setActive(data); 
    } catch {}
  };

  const send = async () => {
    if (!active?.dispute || !reply.trim()) return;
    try { 
      setSending(true); 
      await producerPostDisputeMessage(active.dispute.id, { message: reply }); 
      setReply(''); 
      await open(active.dispute.id); 
    } finally { 
      setSending(false); 
    }
  };

  // Calculate dispute statistics
  const disputeStats = {
    total: list.length,
    open: list.filter(d => d.status === 'open').length,
    underReview: list.filter(d => d.status === 'under_review').length,
    awaitingProducer: list.filter(d => d.status === 'awaiting_producer').length,
  };

  return (
    

      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl shadow-lg">
                  <FaExclamationTriangle className="text-white text-xl" />
                </div>
                Dispute Management
              </h1>
              <p className="text-gray-600 mt-2">Resolve customer issues and maintain service quality</p>
            </div>
            
            <button
              onClick={load}
              className="flex items-center gap-2 px-6 py-3 bg-white border border-green-200 text-green-700 rounded-xl hover:bg-green-50 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <FaSync className={`text-sm ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Disputes</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">{disputeStats.total}</p>
                </div>
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <FaExclamationTriangle className="text-red-600 text-lg" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Open</p>
                  <p className="text-2xl font-bold text-red-600 mt-1">{disputeStats.open}</p>
                </div>
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <FaClock className="text-red-600 text-lg" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Under Review</p>
                  <p className="text-2xl font-bold text-yellow-600 mt-1">{disputeStats.underReview}</p>
                </div>
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <FaComment className="text-yellow-600 text-lg" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Your Response</p>
                  <p className="text-2xl font-bold text-orange-600 mt-1">{disputeStats.awaitingProducer}</p>
                </div>
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <FaStore className="text-orange-600 text-lg" />
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filter Section */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Search disputes by reason or order ID..."
                  value={filters.q}
                  onChange={(e) => setFilters(f => ({ ...f, q: e.target.value }))}
                  className="w-full border-0 bg-gray-50 px-4 py-3 rounded-xl pl-12 text-gray-700 focus:ring-2 focus:ring-green-500 focus:bg-white transition-all"
                />
                <FaSearch className="absolute top-3.5 left-4 text-gray-400" />
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-gray-600">
                  <FaFilter className="text-sm" />
                  <span className="text-sm font-medium">Filter by:</span>
                </div>
                <select
                  className="border-0 bg-gray-50 px-4 py-3 rounded-xl text-gray-700 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  value={filters.status}
                  onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))}
                >
                  <option value="">All Status</option>
                  <option value="open">Open</option>
                  <option value="under_review">Under Review</option>
                  <option value="awaiting_user">Awaiting Customer</option>
                  <option value="awaiting_producer">Awaiting Your Response</option>
                  <option value="resolved">Resolved</option>
                  <option value="refunded">Refunded</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Disputes List */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100/50 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800">Your Disputes</h2>
                <span className="text-sm text-gray-500">{list.length} items</span>
              </div>
            </div>

            <div className="max-h-[600px] overflow-y-auto">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <CircleSpinner size={48} />
                  <div className="text-gray-600 mt-4">Loading disputes...</div>
                </div>
              ) : list.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaCheckCircle className="text-gray-400 text-3xl" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">No disputes found</h3>
                  <p className="text-gray-500">
                    {filters.status || filters.q 
                      ? "Try adjusting your search or filter criteria" 
                      : "All customer issues are resolved"
                    }
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {list.map(dispute => (
                    <button
                      key={dispute.id}
                      onClick={() => open(dispute.id)}
                      className={`w-full text-left p-4 hover:bg-gray-50/80 transition-all duration-200 ${
                        active?.dispute?.id === dispute.id ? 'bg-green-50/80 border-r-4 border-green-500' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-800">#{dispute.id}</span>
                          <StatusBadge status={dispute.status} />
                        </div>
                        <div className="text-xs text-gray-500 text-right">
                          <div>Order #{dispute.orderId}</div>
                          <div>{new Date(dispute.createdAt).toLocaleDateString()}</div>
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-700 mb-2 line-clamp-2">
                        {dispute.reason}
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Created {new Date(dispute.createdAt).toLocaleDateString()}</span>
                        <div className="flex items-center gap-1">
                          <span>View Details</span>
                          <FaArrowRight className="text-xs" />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Dispute Details */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100/50 overflow-hidden">
            {!active ? (
              <div className="flex flex-col items-center justify-center h-full py-12">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaComment className="text-gray-400 text-3xl" />
                </div>
                <h3 className="text-xl font-semibold text-gray-600 mb-2">Select a Dispute</h3>
                <p className="text-gray-500 text-center px-6">
                  Choose a dispute from the list to view details and respond to the customer
                </p>
              </div>
            ) : (
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-800">
                        Dispute #{active.dispute.id}
                      </h2>
                      <p className="text-sm text-gray-600">Order #{active.dispute.orderId}</p>
                    </div>
                    <StatusBadge status={active.dispute.status} />
                  </div>
                </div>

                {/* Dispute Info */}
                <div className="p-6 border-b border-gray-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <label className="font-medium text-gray-700">Reason</label>
                      <p className="text-gray-800 mt-1">{active.dispute.reason}</p>
                    </div>
                    <div>
                      <label className="font-medium text-gray-700">Created</label>
                      <p className="text-gray-800 mt-1">
                        {new Date(active.dispute.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 max-h-96">
                  <h3 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">
                    Conversation ({active.messages?.length || 0} messages)
                  </h3>
                  
                  {(active.messages || []).map((message, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-xl border ${
                        message.senderRole === 'producer'
                          ? 'bg-green-50 border-green-200 ml-8'
                          : 'bg-gray-50 border-gray-200 mr-8'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                            message.senderRole === 'producer'
                              ? 'bg-green-500 text-white'
                              : message.senderRole === 'admin'
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-500 text-white'
                          }`}>
                            {message.senderRole === 'producer' ? 'P' : message.senderRole === 'admin' ? 'A' : 'C'}
                          </div>
                          <span className="font-medium text-gray-700 capitalize">
                            {message.senderRole}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(message.createdAt).toLocaleString()}
                        </span>
                      </div>
                      
                      {message.message && (
                        <p className="text-gray-800 text-sm leading-relaxed">
                          {message.message}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Reply Section */}
                <div className="p-6 border-t border-gray-100 bg-gray-50/50">
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Your Response
                    </label>
                    <div className="flex gap-3">
                      <textarea
                        value={reply}
                        onChange={(e) => setReply(e.target.value)}
                        placeholder="Type your response to resolve this dispute..."
                        rows="3"
                        className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-800 focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                      />
                      <button
                        disabled={sending || !reply.trim()}
                        onClick={send}
                        className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 self-end"
                      >
                        {sending ? (
                          <CircleSpinner size={16} />
                        ) : (
                          <FaPaperPlane className="text-sm" />
                        )}
                        {sending ? 'Sending...' : 'Send'}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500">
                      Your response will be visible to the customer and support team
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
  
  );
}