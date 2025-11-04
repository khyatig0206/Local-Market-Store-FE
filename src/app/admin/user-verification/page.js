'use client';

import { useEffect, useState, useMemo } from 'react';
import { fetchProducersForVerification, fetchAllProducers, approveProducerAdmin, rejectProducerAdmin } from '@/lib/api/admin';
import { toast } from 'react-toastify';
import Image from 'next/image';
import { FaMapMarkerAlt, FaCheckCircle, FaTimesCircle, FaEye, FaUserCheck, FaUsers, FaSearch, FaFilter } from 'react-icons/fa';
import CircleSpinner from '@/components/CircleSpinner';
import DocumentViewerModal from '@/components/DocumentViewerModal';

export default function UserVerification() {
    const [producers, setProducers] = useState([]);
    const [allProducers, setAllProducers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // for reject modal
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [rejectingId, setRejectingId] = useState(null);
    const [remarks, setRemarks] = useState("");

    // for details modal
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const [selectedProducer, setSelectedProducer] = useState(null);

    // document viewer
    const [viewerOpen, setViewerOpen] = useState(false);
    const [viewerImages, setViewerImages] = useState([]);

    useEffect(() => {
        let mounted = true;
        const fetchData = async () => {
            try {
                setIsLoading(true);
                const [pending, all] = await Promise.all([
                    fetchProducersForVerification(),
                    fetchAllProducers(),
                ]);
                if (!mounted) return;
                setProducers(pending || []);
                setAllProducers(all || []);
            } catch (err) {
                toast.error(err?.message || 'Failed to load producers');
            } finally {
                if (mounted) setIsLoading(false);
            }
        };
        fetchData();
        return () => { mounted = false; };
    }, []);

    // Filter producers based on search and status
    const filteredAllProducers = useMemo(() => {
        return allProducers.filter(producer => {
            const matchesSearch = producer.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                producer.email?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'all' || producer.kycStatus === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [allProducers, searchTerm, statusFilter]);

    const viewMap = (lat, lng) => {
        if (!lat || !lng) return;
        window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
    };

    const handleApprove = async (id) => {
        try {
            await approveProducerAdmin(id);
            toast.success('Producer approved successfully!');
            const [pending, all] = await Promise.all([
                fetchProducersForVerification(),
                fetchAllProducers(),
            ]);
            setProducers(pending || []);
            setAllProducers(all || []);
        } catch (err) {
            toast.error(err.message || 'Failed to approve producer');
        }
    };

    const handleReject = (id) => {
        setRejectingId(id);
        setRemarks("");
        setRejectModalOpen(true);
    };

    const handleRejectSubmit = async () => {
        try {
            await rejectProducerAdmin(rejectingId, remarks);
            toast.success('Producer rejected');
            setRejectModalOpen(false);
            setRejectingId(null);
            setRemarks("");

            const [pending, all] = await Promise.all([
                fetchProducersForVerification(),
                fetchAllProducers(),
            ]);
            setProducers(pending || []);
            setAllProducers(all || []);
        } catch (err) {
            toast.error(err.message || 'Failed to reject producer');
        }
    };

    const openDetailsModal = (producer) => {
        setSelectedProducer(producer);
        setDetailsModalOpen(true);
    };

    const closeDetailsModal = () => {
        setDetailsModalOpen(false);
        setSelectedProducer(null);
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            pending: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'Pending' },
            approved: { color: 'bg-green-100 text-green-800 border-green-200', label: 'Approved' },
            rejected: { color: 'bg-red-100 text-red-800 border-red-200', label: 'Rejected' }
        };
        const config = statusConfig[status] || statusConfig.pending;
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${config.color}`}>
                {config.label}
            </span>
        );
    };

    const AddressRow = ({ label, line1, line2, city, state, pin, country }) => (
        <div className="text-sm text-gray-600 mb-2">
            <span className="font-semibold text-gray-800 block mb-1">{label}</span>
            <span className="text-gray-600">
                {[line1, line2, city, state, pin, country].filter(Boolean).join(', ') || 'Not provided'}
            </span>
        </div>
    );

    return (
        <div className="">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
                <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <pattern id="verification-pattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                            <path d="M20,20 L80,20 L80,80 L20,80 Z" fill="currentColor" opacity="0.3"/>
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#verification-pattern)" className="text-blue-600"/>
                </svg>
            </div>

            <div className="max-w-7xl mx-auto relative">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
                    <div className="text-center lg:text-left">
                        <div className="flex items-center justify-center lg:justify-start gap-3 mb-2">
                            <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                                <FaUserCheck className="text-white text-xl" />
                            </div>
                            <div>
                                <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
                                    Producer Management
                                </h1>
                                <p className="text-gray-600 mt-1 flex items-center justify-center lg:justify-start gap-2">
                                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                    Verify and manage local producers
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    {/* Stats Overview */}
                    <div className="flex gap-4 justify-center">
                        <div className="bg-white rounded-xl p-4 shadow-lg border border-green-200 text-center min-w-[120px]">
                            <div className="text-2xl font-bold text-green-600">{producers.length}</div>
                            <div className="text-sm text-gray-600">Pending</div>
                        </div>
                        <div className="bg-white rounded-xl p-4 shadow-lg border border-blue-200 text-center min-w-[120px]">
                            <div className="text-2xl font-bold text-blue-600">{allProducers.length}</div>
                            <div className="text-sm text-gray-600">Total</div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
                    {/* Left Column: Verification Requests */}
                    <div className="flex flex-col h-full bg-white rounded-2xl shadow-lg border border-green-200 overflow-hidden">
                        <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                    <FaUserCheck className="text-white" />
                                    Verification Requests
                                </h2>
                                <span className="bg-white/20 text-white/90 px-3 py-1 rounded-full text-sm font-medium">
                                    {producers.length} pending
                                </span>
                            </div>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-4 max-h-[600px]">
                            {isLoading ? (
                                <div className="h-full flex items-center justify-center py-12">
                                    <CircleSpinner size={48} />
                                </div>
                            ) : producers.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <FaUserCheck className="text-green-600 text-2xl" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-800 mb-2">All caught up!</h3>
                                    <p className="text-gray-600 text-sm">No pending verification requests.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {producers.map((producer) => (
                                        <div
                                            key={producer.id}
                                            className="bg-white p-4 rounded-xl border border-gray-200 hover:shadow-md transition-all duration-200 cursor-pointer hover:border-green-300 group"
                                            onClick={() => openDetailsModal(producer)}
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-green-200 group-hover:border-green-400 transition-colors">
                                                    <Image
                                                        src={producer.businessLogo || '/placeholder.png'}
                                                        alt="Business Logo"
                                                        fill
                                                        sizes="64px"
                                                        className="object-cover"
                                                    />
                                                </div>
                                                
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div>
                                                            <h3 className="font-semibold text-gray-800 text-lg leading-tight truncate">
                                                                {producer.businessName}
                                                            </h3>
                                                            <p className="text-gray-500 text-sm truncate mt-1">
                                                                {producer.email}
                                                                {producer.phoneNumber && <> • {producer.phoneNumber}</>}
                                                            </p>
                                                        </div>
                                                        {producer.kycStatus === 'pending' && producer.kycRemarks && (
                                                            <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-1 rounded-full shrink-0 ml-2">
                                                                Reapplying
                                                            </span>
                                                        )}
                                                    </div>

                                                    {producer.updatedAt && (
                                                        <p className="text-xs text-gray-500 mt-2">
                                                            Applied: {new Date(producer.updatedAt).toLocaleString("en-US", {
                                                                day: "2-digit",
                                                                month: "short",
                                                                year: "numeric",
                                                                hour: "2-digit",
                                                                minute: "2-digit",
                                                            })}
                                                        </p>
                                                    )}
                                                    
                                                    {producer.kycStatus === 'pending' && producer.kycRemarks && (
                                                        <p className="text-xs text-amber-700 mt-2 bg-amber-50 p-2 rounded-lg">
                                                            <span className="font-medium">Previous remarks:</span> {producer.kycRemarks}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        openDetailsModal(producer);
                                                    }}
                                                    className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-2 transition-colors"
                                                >
                                                    <FaEye className="text-sm" />
                                                    View Details
                                                </button>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleApprove(producer.id);
                                                        }}
                                                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all duration-200 shadow-sm hover:shadow-md"
                                                    >
                                                        <FaCheckCircle />
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleReject(producer.id);
                                                        }}
                                                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all duration-200 shadow-sm hover:shadow-md"
                                                    >
                                                        <FaTimesCircle />
                                                        Reject
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: All Producers */}
                    <div className="flex flex-col h-full bg-white rounded-2xl shadow-lg border border-blue-200 overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                    <FaUsers className="text-white" />
                                    All Producers
                                </h2>
                                <span className="bg-white/20 text-white/90 px-3 py-1 rounded-full text-sm font-medium">
                                    {allProducers.length} total
                                </span>
                            </div>
                            
                            {/* Search and Filter */}
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="relative flex-1">
                                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                                    <input
                                        type="text"
                                        placeholder="Search producers..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-white/20 bg-white/10 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 text-sm"
                                    />
                                </div>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="px-4 py-2 rounded-lg border border-white/20 bg-white/10 text-white focus:outline-none focus:ring-2 focus:ring-white/50 text-sm"
                                >
                                    <option value="all" className="text-gray-800">All Status</option>
                                    <option value="approved" className="text-gray-800">Approved</option>
                                    <option value="pending" className="text-gray-800">Pending</option>
                                    <option value="rejected" className="text-gray-800">Rejected</option>
                                </select>
                            </div>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-4 max-h-[600px]">
                            {isLoading ? (
                                <div className="h-full flex items-center justify-center py-12">
                                    <CircleSpinner size={48} />
                                </div>
                            ) : filteredAllProducers.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <FaUsers className="text-blue-600 text-2xl" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-800 mb-2">No producers found</h3>
                                    <p className="text-gray-600 text-sm">
                                        {searchTerm || statusFilter !== 'all' 
                                            ? 'Try adjusting your search or filter criteria'
                                            : 'No producers registered yet'
                                        }
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {filteredAllProducers.map((producer) => (
                                        <div
                                            key={producer.id}
                                            className="bg-white p-4 rounded-xl border border-gray-200 hover:shadow-md transition-all duration-200 cursor-pointer hover:border-blue-300 group"
                                            onClick={() => openDetailsModal(producer)}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="relative w-14 h-14 rounded-xl overflow-hidden border-2 border-blue-200 group-hover:border-blue-400 transition-colors">
                                                    <Image 
                                                        src={producer.businessLogo || '/placeholder.png'} 
                                                        alt="Business Logo" 
                                                        fill 
                                                        sizes="56px" 
                                                        className="object-cover" 
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-2 mb-1">
                                                        <h3 className="font-semibold text-gray-800 truncate text-base">
                                                            {producer.businessName}
                                                        </h3>
                                                        {getStatusBadge(producer.kycStatus)}
                                                    </div>
                                                    <p className="text-gray-500 text-sm truncate">
                                                        {producer.email}
                                                        {producer.phoneNumber && <> • {producer.phoneNumber}</>}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Producer Details Modal */}
            {detailsModalOpen && selectedProducer && (
                <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative">
                        <button 
                            onClick={closeDetailsModal} 
                            className="absolute top-4 right-4 w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-500 hover:text-red-500 transition-colors z-10"
                        >
                            ✕
                        </button>
                        
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-t-2xl">
                            <div className="flex items-center gap-4">
                                <div className="relative w-20 h-20 rounded-xl overflow-hidden border-4 border-white/20">
                                    <Image 
                                        src={selectedProducer.businessLogo || '/placeholder.png'} 
                                        alt="Business Logo" 
                                        fill 
                                        sizes="80px" 
                                        className="object-cover" 
                                    />
                                </div>
                                <div className="flex-1 text-white">
                                    <h2 className="font-bold text-xl mb-1">{selectedProducer.businessName}</h2>
                                    <p className="text-white/90 text-sm">
                                        {selectedProducer.email}
                                        {selectedProducer.phoneNumber && <> • {selectedProducer.phoneNumber}</>}
                                    </p>
                                    <div className="flex items-center gap-2 mt-2">
                                        {getStatusBadge(selectedProducer.kycStatus)}
                                        {selectedProducer.kycStatus === 'pending' && selectedProducer.kycRemarks && (
                                            <span className="bg-amber-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                                                Reapplying
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 space-y-6">
                            {selectedProducer.description && (
                                <div>
                                    <h3 className="font-semibold text-gray-800 mb-2">Description</h3>
                                    <p className="text-gray-700 text-sm leading-relaxed bg-gray-50 p-3 rounded-lg">
                                        {selectedProducer.description}
                                    </p>
                                </div>
                            )}

                            {/* Address Information */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-blue-50 p-4 rounded-lg">
                                    <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                                        <FaMapMarkerAlt className="text-blue-600" />
                                        Permanent Address
                                    </h3>
                                    <AddressRow
                                        line1={selectedProducer.addressLine1}
                                        line2={selectedProducer.addressLine2}
                                        city={selectedProducer.city}
                                        state={selectedProducer.state}
                                        pin={selectedProducer.postalCode}
                                        country={selectedProducer.country}
                                    />
                                </div>
                                <div className="bg-green-50 p-4 rounded-lg">
                                    <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                                        <FaMapMarkerAlt className="text-green-600" />
                                        Business Address
                                    </h3>
                                    <AddressRow
                                        line1={selectedProducer.businessAddressLine1}
                                        line2={selectedProducer.businessAddressLine2}
                                        city={selectedProducer.businessCity}
                                        state={selectedProducer.businessState}
                                        pin={selectedProducer.businessPostalCode}
                                        country={selectedProducer.businessCountry}
                                    />
                                </div>
                            </div>

                            {/* Application Date */}
                            <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                                <span className="font-semibold">Applied: </span>
                                {selectedProducer.updatedAt ? new Date(selectedProducer.updatedAt).toLocaleString() : 'Not available'}
                            </div>

                            {/* Previous Remarks */}
                            {selectedProducer.kycStatus === 'pending' && selectedProducer.kycRemarks && (
                                <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                                    <h3 className="font-semibold text-amber-800 mb-2">Previous Rejection Remarks</h3>
                                    <p className="text-amber-700 text-sm">{selectedProducer.kycRemarks}</p>
                                </div>
                            )}

                            {/* Categories */}
                            {selectedProducer.Categories?.length > 0 && (
                                <div>
                                    <h3 className="font-semibold text-gray-800 mb-3">Business Categories</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedProducer.Categories.map((cat, idx) => (
                                            <span key={idx} className="flex items-center gap-2 border border-gray-300 rounded-full px-3 py-1.5 text-sm bg-white text-gray-700 hover:bg-gray-50 transition-colors">
                                                <Image src={cat.photo} alt={cat.name} width={16} height={16} className="w-4 h-4 object-contain" />
                                                {cat.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Documents Section */}
                            <div>
                                <h3 className="font-semibold text-gray-800 mb-3">Verification Documents</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    {selectedProducer.aadharImages?.length > 0 && (
                                        <button 
                                            onClick={() => { setViewerImages(selectedProducer.aadharImages); setViewerOpen(true); }} 
                                            className="flex items-center justify-center gap-2 p-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md"
                                        >
                                            <FaEye />
                                            Aadhaar Card
                                        </button>
                                    )}
                                    {selectedProducer.idDocuments?.length > 0 && (
                                        <button 
                                            onClick={() => { setViewerImages(selectedProducer.idDocuments); setViewerOpen(true); }} 
                                            className="flex items-center justify-center gap-2 p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md"
                                        >
                                            <FaEye />
                                            ID Proof
                                        </button>
                                    )}
                                    {selectedProducer.addressProofs?.length > 0 && (
                                        <button 
                                            onClick={() => { setViewerImages(selectedProducer.addressProofs); setViewerOpen(true); }} 
                                            className="flex items-center justify-center gap-2 p-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md"
                                        >
                                            <FaEye />
                                            Address Proof
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Action Buttons for Pending Requests */}
                            {producers.some(p => p.id === selectedProducer.id) && (
                                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                                    <button
                                        onClick={() => handleApprove(selectedProducer.id)}
                                        className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-sm hover:shadow-md"
                                    >
                                        <FaCheckCircle />
                                        Approve Producer
                                    </button>
                                    <button
                                        onClick={() => handleReject(selectedProducer.id)}
                                        className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-sm hover:shadow-md"
                                    >
                                        <FaTimesCircle />
                                        Reject Producer
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Reject Modal */}
            {rejectModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                                <FaTimesCircle className="text-red-600 text-lg" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-red-700">Reject Producer</h2>
                                <p className="text-sm text-gray-600">Provide rejection remarks</p>
                            </div>
                        </div>
                        
                        <textarea
                            className="w-full border border-gray-300 rounded-xl p-4 text-sm mb-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                            rows={4}
                            placeholder="Enter rejection remarks (optional)..."
                            value={remarks}
                            onChange={e => setRemarks(e.target.value)}
                        />
                        
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                className="flex-1 px-4 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-all duration-200"
                                onClick={() => { setRejectModalOpen(false); setRejectingId(null); setRemarks(""); }}
                            >
                                Cancel
                            </button>
                            <button
                                className="flex-1 px-4 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium transition-all duration-200 shadow-sm hover:shadow-md"
                                onClick={handleRejectSubmit}
                            >
                                Confirm Rejection
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Shared Document Viewer */}
            <DocumentViewerModal open={viewerOpen} images={viewerImages} onClose={() => setViewerOpen(false)} />
        </div>
    );
}