'use client';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { userListDisputes, userGetDispute, userPostDisputeMessage } from '@/lib/api/disputes';
import { 
  FiMessageSquare, 
  FiAlertTriangle, 
  FiSend,
  FiRefreshCw,
  FiUser,
  FiShoppingBag,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiEye
} from 'react-icons/fi';
import { FaExclamationCircle, FaStore } from 'react-icons/fa';

export default function UserDisputesPage() {
  const t = useTranslations();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);

  const load = async () => {
    try { 
      setLoading(true); 
      const rows = await userListDisputes(); 
      setList(rows || []); 
    } catch { 
      setList([]); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { load(); }, []);

  const open = async (id) => { 
    try { 
      const data = await userGetDispute(id); 
      setActive(data); 
    } catch {} 
  };

  const send = async () => { 
    if (!active?.dispute || !reply.trim()) return; 
    try { 
      setSending(true); 
      await userPostDisputeMessage(active.dispute.id, { message: reply }); 
      setReply(''); 
      await open(active.dispute.id); 
    } finally { 
      setSending(false); 
    } 
  };

  const getStatusColor = (status) => {
    const colors = {
      open: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      under_review: 'bg-blue-100 text-blue-700 border-blue-200',
      awaiting_user: 'bg-orange-100 text-orange-700 border-orange-200',
      awaiting_producer: 'bg-red-100 text-red-700 border-red-200',
      resolved: 'bg-green-100 text-green-700 border-green-200',
      refunded: 'bg-green-100 text-green-700 border-green-200',
      rejected: 'bg-gray-100 text-gray-700 border-gray-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getStatusIcon = (status) => {
    const icons = {
      open: FiAlertTriangle,
      under_review: FiClock,
      awaiting_user: FiUser,
      awaiting_producer: FaStore,
      resolved: FiCheckCircle,
      refunded: FiCheckCircle,
      rejected: FiXCircle,
    };
    return icons[status] || FiAlertTriangle;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 py-4 sm:py-6 px-4">
      {/* Background Pattern */}
      <div className="fixed inset-0 opacity-5 pointer-events-none">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="user-disputes-pattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              <path d="M20 30 Q50 20 80 30 T140 30" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.2"/>
              <path d="M20 70 Q50 80 80 70 T140 70" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.2"/>
              <circle cx="30" cy="50" r="2" fill="currentColor" opacity="0.3"/>
              <circle cx="60" cy="50" r="2" fill="currentColor" opacity="0.3"/>
              <circle cx="90" cy="50" r="2" fill="currentColor" opacity="0.3"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#user-disputes-pattern)" className="text-green-600"/>
        </svg>
      </div>

      <div className="max-w-7xl mx-auto relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
              <FiAlertTriangle className="text-white text-xl" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">{t('disputes.title')}</h1>
              <p className="text-gray-600 text-sm md:text-base">{t('disputes.headerSubtitle')}</p>
            </div>
          </div>
          
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-green-200 text-green-700 hover:bg-green-50 transition-all shadow-sm hover:shadow-md font-medium"
          >
            <FiRefreshCw className={`text-lg ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{t('disputes.refresh')}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Disputes List */}
          <div className="bg-white rounded-3xl shadow-lg border border-green-100 overflow-hidden lg:max-h-[70vh] flex flex-col">
            <div className="p-6 border-b border-green-50 flex-shrink-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <FiMessageSquare className="text-green-600" />
                  {t('disputes.listTitle')}
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                    {list.length} {list.length === 1 ? t('disputes.dispute') : t('disputes.disputes')}
                  </span>
                </h2>
              </div>
            </div>

            {/* Disputes List */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex justify-center items-center py-16">
                  <div className="text-center">
                    <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-green-700 font-medium">Loading your disputes...</p>
                  </div>
                </div>
              ) : list.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FiCheckCircle className="text-green-600 text-3xl" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">{t('disputes.emptyTitle')}</h3>
                  <p className="text-gray-600 text-sm">
                    {t('disputes.emptyDescription')}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-green-50">
                  {list.map(dispute => {
                    const StatusIcon = getStatusIcon(dispute.status);
                    return (
                      <button
                        key={dispute.id}
                        onClick={() => open(dispute.id)}
                        className={`w-full text-left p-6 hover:bg-green-50 transition-colors ${
                          active?.dispute?.id === dispute.id ? 'bg-green-50 border-r-4 border-green-500' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                              <FaExclamationCircle className="text-orange-600 text-lg" />
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900 text-lg">
                                #{dispute.id} • {dispute.reason}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                                <FiShoppingBag className="text-sm" />
                                {t('disputes.order')} #{dispute.orderId}
                              </div>
                            </div>
                          </div>
                          
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${getStatusColor(dispute.status)}`}>
                            <StatusIcon className="text-xs" />
                            {dispute.status.replace('_', ' ')}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <FiClock className="text-sm" />
                            {new Date(dispute.createdAt).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1 text-green-600 font-medium">
                            <FiEye className="text-sm" />
                            {t('disputes.viewDetails')}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Dispute Details */}
          <div className="bg-white rounded-3xl shadow-lg border border-green-100 overflow-hidden">
            {!active ? (
              <div className="flex flex-col items-center justify-center h-full py-16 text-center">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiMessageSquare className="text-gray-400 text-3xl" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{t('disputes.selectPrompt')}</h3>
                <p className="text-gray-600 text-sm max-w-sm">
                  Select a dispute from the list to view conversation and respond
                </p>
              </div>
            ) : (
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="p-6 border-b border-green-50 bg-gradient-to-r from-green-50 to-emerald-50">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        Dispute #{active.dispute.id}
                      </h2>
                      <p className="text-gray-600 text-sm">
                        Order #{active.dispute.orderId} • Created {new Date(active.dispute.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold border ${getStatusColor(active.dispute.status)}`}>
                      {(() => { const Icon = getStatusIcon(active.dispute.status); return Icon ? <Icon className="text-sm" /> : null; })()}
                      {active.dispute.status.replace('_', ' ')}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-3 text-sm">
                    <div>
                      <div className="font-medium text-gray-700 mb-1">Reason</div>
                      <div className="text-gray-900 font-semibold text-lg">{active.dispute.reason}</div>
                    </div>
                    {active.dispute.description && (
                      <div>
                        <div className="font-medium text-gray-700 mb-1">Description</div>
                        <div className="text-gray-900 bg-white p-3 rounded-xl border border-green-100">
                          {active.dispute.description}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 max-h-96">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <FiMessageSquare className="text-green-600" />
                    {t('disputes.conversation')}
                  </h3>
                  
                  {(active.messages || []).length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <FiMessageSquare className="text-3xl text-gray-300 mx-auto mb-2" />
                      <p>{t('disputes.noMessagesYet')}</p>
                      <p className="text-sm">{t('disputes.startConversationSeller')}</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {(active.messages || []).map((message, index) => (
                        <div
                          key={index}
                          className={`flex gap-3 ${message.senderRole === 'user' ? 'flex-row-reverse' : ''}`}
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            message.senderRole === 'user' 
                              ? 'bg-green-500 text-white' 
                              : 'bg-gray-300 text-gray-700'
                          }`}>
                            {message.senderRole === 'user' ? <FiUser className="text-xs" /> : <FaStore className="text-xs" />}
                          </div>
                          <div className={`flex-1 ${message.senderRole === 'user' ? 'text-right' : ''}`}>
                            <div className={`inline-block px-4 py-3 rounded-2xl max-w-xs lg:max-w-md ${
                              message.senderRole === 'user'
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {message.message && (
                                <p className="text-sm leading-relaxed">{message.message}</p>
                              )}
                            </div>
                            <div className={`text-xs text-gray-500 mt-1 ${message.senderRole === 'user' ? 'text-right' : ''}`}>
                              {message.senderRole === 'user' ? 'You' : 'Seller'} • {new Date(message.createdAt).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Reply Section */}
                <div className="p-6 border-t border-green-50 bg-gray-50">
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">
                      {t('disputes.sendMessageToSeller')}
                    </label>
                    <div className="flex gap-3">
                      <input
                        value={reply}
                        onChange={(e) => setReply(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && send()}
                        className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                        placeholder={t('disputes.writeReply') || "Type your message to the seller..."}
                      />
                      <button
                        disabled={sending || !reply.trim()}
                        onClick={send}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white transition-all ${
                          sending || !reply.trim()
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-green-600 hover:bg-green-700 shadow-lg hover:shadow-xl'
                        }`}
                      >
                        {sending ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            {t('disputes.sending') || 'Sending...'}
                          </>
                        ) : (
                          <>
                            <FiSend className="text-sm" />
                            {t('disputes.send') || 'Send'}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}