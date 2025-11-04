"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getWalletSummary, getWalletTransactions } from "@/lib/api/producers";
import { 
  FaWallet, 
  FaSync, 
  FaRupeeSign, 
  FaCalendarAlt,
  FaArrowUp, 
  FaArrowDown, 
  FaReceipt,
  FaCreditCard,
  FaHistory,
  FaInfoCircle
} from "react-icons/fa";

// SVG Pattern Component
const DotPattern = () => (
  <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern id="dot-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
        <circle cx="2" cy="2" r="1" fill="currentColor" opacity="0.05" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#dot-pattern)" />
  </svg>
);

export default function ProducerPayoutsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ balance: 0, currency: "INR", updatedAt: null });
  const [txLoading, setTxLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      router.replace("/producer/signin");
      return;
    }
    loadSummary();
    loadTransactions(1, true);
  }, []);

  async function loadSummary() {
    setLoading(true);
    try {
      const data = await getWalletSummary();
      setSummary({
        balance: Number(data?.balance || 0),
        currency: data?.currency || "INR",
        updatedAt: data?.updatedAt || null,
      });
    } catch {
      // ignore error display
    } finally {
      setLoading(false);
    }
  }

  async function loadTransactions(nextPage = 1, replace = false) {
    setTxLoading(true);
    try {
      const data = await getWalletTransactions({ page: nextPage, limit: 10 });
      setTransactions((prev) => (replace ? (data?.items || []) : [...prev, ...(data?.items || [])]));
      setPage(nextPage);
      setHasMore(Boolean(data?.hasMore));
    } catch {
      // ignore error display
    } finally {
      setTxLoading(false);
    }
  }

  const updatedAtStr = summary.updatedAt ? new Date(summary.updatedAt).toLocaleString() : "";

  // Calculate transaction statistics
  const transactionStats = {
    totalCredits: transactions.filter(t => t.type?.toLowerCase() === 'credit').length,
    totalDebits: transactions.filter(t => t.type?.toLowerCase() === 'debit').length,
    totalAmount: transactions.reduce((sum, t) => sum + Math.abs(Number(t.amount || 0)), 0)
  };

  return (
    <div className="">
      
      

      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
                  <FaWallet className="text-white text-xl" />
                </div>
                Payouts & Wallet
              </h1>
              <p className="text-gray-600 mt-2">Manage your earnings and track transactions</p>
            </div>
            
            <button
              onClick={() => {
                loadSummary();
                loadTransactions(1, true);
              }}
              className="flex items-center gap-2 px-6 py-3 bg-white border border-green-200 text-green-700 rounded-xl hover:bg-green-50 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <FaSync className={`text-sm ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Wallet Summary Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
            {/* Main Balance Card */}
            <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-emerald-100 text-sm">Available Balance</p>
                    <p className="text-3xl font-bold mt-1">
                      ₹{summary.balance.toFixed(2)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <FaWallet className="text-white text-xl" />
                  </div>
                </div>
                <div className="flex items-center gap-2 text-emerald-100 text-sm">
                  <FaCalendarAlt />
                  <span>Updated {updatedAtStr ? new Date(summary.updatedAt).toLocaleDateString() : 'Recently'}</span>
                </div>
              </div>
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mb-16"></div>
            </div>

            {/* Stats Cards */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">Credits</h3>
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <FaArrowDown className="text-green-600 text-lg" />
                </div>
              </div>
              <div className="text-2xl font-bold text-green-600">{transactionStats.totalCredits}</div>
              <p className="text-sm text-gray-500 mt-1">Total Incoming</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">Debits</h3>
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <FaArrowUp className="text-red-600 text-lg" />
                </div>
              </div>
              <div className="text-2xl font-bold text-red-600">{transactionStats.totalDebits}</div>
              <p className="text-sm text-gray-500 mt-1">Total Outgoing</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">Total Volume</h3>
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FaRupeeSign className="text-blue-600 text-lg" />
                </div>
              </div>
              <div className="text-2xl font-bold text-blue-600">₹{transactionStats.totalAmount.toFixed(2)}</div>
              <p className="text-sm text-gray-500 mt-1">All Transactions</p>
            </div>
          </div>
        </div>

        {/* Transactions Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100/50 overflow-hidden">
          {/* Section Header */}
          <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FaHistory className="text-blue-600 text-lg" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">Transaction History</h2>
                  <p className="text-sm text-gray-600">All your earnings and payouts</p>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                {transactions.length} transactions
              </div>
            </div>
          </div>

          {/* Transactions Content */}
          <div className="p-6">
            {txLoading && transactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <div className="text-gray-600 font-medium">Loading transactions...</div>
                <div className="text-gray-400 text-sm mt-2">Fetching your transaction history</div>
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaReceipt className="text-gray-400 text-3xl" />
                </div>
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No transactions yet</h3>
                <p className="text-gray-500 mb-6">Your transaction history will appear here</p>
              </div>
            ) : (
              <>
                {/* Transactions List */}
                <div className="space-y-4">
                  {transactions.map((t) => {
                    const dt = t.createdAt ? new Date(t.createdAt).toLocaleString() : "";
                    const amt = Number(t.amount || 0).toFixed(2);
                    const isCredit = String(t.type).toLowerCase() === "credit";
                    
                    return (
                      <div
                        key={t.id}
                        className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:border-green-300 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                      >
                        {/* Transaction Icon */}
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          isCredit ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                        }`}>
                          {isCredit ? (
                            <FaArrowDown className="text-lg" />
                          ) : (
                            <FaArrowUp className="text-lg" />
                          )}
                        </div>

                        {/* Transaction Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                isCredit 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {String(t.type || "").toUpperCase()}
                              </span>
                              {t.orderId && (
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                                  Order #{t.orderId}
                                </span>
                              )}
                            </div>
                            <div className={`text-lg font-bold ${
                              isCredit ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {isCredit ? '+' : '-'}₹{Math.abs(amt)}
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between text-sm text-gray-600">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1">
                                <FaCalendarAlt className="text-gray-400 text-xs" />
                                <span>{dt}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <FaReceipt className="text-gray-400 text-xs" />
                                <span className="max-w-xs truncate">
                                  {t.description || "Transaction"}
                                </span>
                              </div>
                            </div>
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                              {t.currency || "INR"}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Load More */}
                {hasMore && (
                  <div className="flex justify-center mt-8">
                    <button
                      onClick={() => loadTransactions(page + 1)}
                      disabled={txLoading}
                      className="bg-white/80 backdrop-blur-sm border border-green-500 text-green-700 px-8 py-3 rounded-xl font-semibold hover:bg-green-50 transition-all duration-200 disabled:opacity-50 flex items-center gap-3 shadow-lg hover:shadow-xl"
                    >
                      {txLoading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                          Loading More Transactions...
                        </>
                      ) : (
                        <>
                          <FaSync />
                          Load More Transactions
                        </>
                      )}
                    </button>
                  </div>
                )}

                {!hasMore && transactions.length > 0 && (
                  <div className="text-center mt-6 py-4 border-t border-gray-200">
                    <div className="text-sm text-gray-500 flex items-center justify-center gap-2">
                      <FaInfoCircle className="text-gray-400" />
                      All transactions loaded
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Payout Information Card */}
        <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-2xl p-6 shadow-lg border border-yellow-200/50 mt-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <FaCreditCard className="text-yellow-600 text-xl" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">Payout Requests</h3>
              <p className="text-yellow-700 mb-4">
                Payout requests will be enabled after KYC and bank verification. This section will allow you
                to request withdrawal of your available balance to your bank account.
              </p>
              <div className="flex items-center gap-2 text-sm text-yellow-600">
                <FaInfoCircle className="text-yellow-500" />
                <span>Complete your KYC verification to enable payout requests</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Footer */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 text-center border border-gray-200/50">
            <div className="text-2xl font-bold text-gray-800">{transactions.length}</div>
            <div className="text-sm text-gray-600">Total Transactions</div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 text-center border border-gray-200/50">
            <div className="text-2xl font-bold text-green-600">
              ₹{transactionStats.totalAmount.toFixed(2)}
            </div>
            <div className="text-sm text-gray-600">Total Volume</div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 text-center border border-gray-200/50">
            <div className="text-2xl font-bold text-blue-600">
              {new Date().getFullYear()}
            </div>
            <div className="text-sm text-gray-600">Current Year</div>
          </div>
        </div>
      </div>
    </div>
  );
}