"use client";
import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import Image from 'next/image';
import { uploadKycDocuments, getProducerProfile, getKycStatusForProducer } from '@/lib/api/producers';

import CircleSpinner from '@/components/CircleSpinner';
import DocumentViewerModal from '@/components/DocumentViewerModal';
import { FaPlus, FaCheckCircle, FaTimesCircle, FaClock, FaEye, FaIdCard, FaHome, FaMapMarkerAlt, FaShieldAlt, FaInfoCircle } from 'react-icons/fa';

export default function ProducerKYC() {
  const [idFiles, setIdFiles] = useState([]);
  const [addressFiles, setAddressFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [producer, setProducer] = useState(null);
  const [token, setToken] = useState("");
  const [kycStatus, setKycStatus] = useState(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('documents');

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      setToken(storedToken);
      fetchProfile(storedToken);
      fetchKycStatus(storedToken);
    }
  }, []);

  const fetchProfile = async (token) => {
    try {
      const res = await getProducerProfile();
      setProducer(res);
    } catch (err) {
      toast.error("Failed to load profile");
    }
  };

  const fetchKycStatus = async (token) => {
    try {
      const res = await getKycStatusForProducer();
      setKycStatus(res);
      try {
        localStorage.setItem("kycStatus", res?.status || "pending");
        window.dispatchEvent(new Event("kycStatusUpdate"));
      } catch {}
    } catch (err) {
      toast.error("Failed to load KYC status");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const onFocus = () => fetchKycStatus(token);
    const onOnline = () => fetchKycStatus(token);
    window.addEventListener("focus", onFocus);
    window.addEventListener("online", onOnline);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("online", onOnline);
    };
  }, [token]);

  const handleFileChange = (e, setFiles) => {
    const incoming = Array.from(e.target.files || []);
    const images = incoming.filter((f) => f.type && f.type.startsWith("image/"));
    const rejected = incoming.length - images.length;
    if (rejected > 0) {
      try {
        toast.error("Only image files (JPG, PNG) are allowed.");
      } catch {}
    }
    setFiles((prev) => [...prev, ...images]);
  };

  const handleSubmit = async () => {
    if (idFiles.length === 0 || addressFiles.length === 0) {
      toast.error("Please upload both documents.");
      return;
    }

    const formData = new FormData();
    idFiles.forEach((file) => formData.append("idDocuments", file));
    addressFiles.forEach((file) => formData.append("addressProofs", file));

    try {
      setLoading(true);
      await uploadKycDocuments(formData);
      toast.success("Documents uploaded successfully");
      fetchKycStatus(token);
      setIdFiles([]);
      setAddressFiles([]);
      setActiveTab('documents');
    } catch (err) {
      toast.error(err.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const removeFile = (index, setFiles, files) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const getStatusIcon = () => {
    switch (kycStatus?.status) {
      case 'approved': return <FaCheckCircle className="text-green-500 text-xl" />;
      case 'rejected': return <FaTimesCircle className="text-red-500 text-xl" />;
      default: return <FaClock className="text-yellow-500 text-xl" />;
    }
  };

  const getStatusColor = () => {
    switch (kycStatus?.status) {
      case 'approved': return 'bg-green-50 border-green-200 text-green-700';
      case 'rejected': return 'bg-red-50 border-red-200 text-red-700';
      default: return 'bg-yellow-50 border-yellow-200 text-yellow-700';
    }
  };

  const getStatusText = () => {
    if (!kycStatus) return 'Loading...';
    return kycStatus.status.replace(/_/g, " ").toUpperCase();
  };

  const openViewer = (images) => {
    setSelectedImages(images);
    setViewerOpen(true);
  };

  const closeViewer = () => {
    setViewerOpen(false);
    setSelectedImages([]);
    setCurrentImageIndex(0);
  };

  if (isLoading) return (
    <div className="min-h-[400px] flex items-center justify-center">
      <CircleSpinner />
    </div>
  );

  const idDocs = kycStatus?.idDocs || [];
  const addressDocs = kycStatus?.addressDocs || [];
  const hasUploadedDocs = idDocs.length > 0 || addressDocs.length > 0;
  const showUploadForm = kycStatus?.status === "rejected";

  return (
    <div className="">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <FaShieldAlt className="text-green-600" />
            KYC & Documents
            </h1>
            <p className="text-gray-600 mt-2">Verify your identity to access all platform features</p>
          </div>
          
          <div className={`px-4 py-3 rounded-xl border-2 ${getStatusColor()} flex items-center gap-3`}>
            {getStatusIcon()}
            <div>
              <p className="text-sm font-medium">Verification Status</p>
              <p className="font-bold">{getStatusText()}</p>
            </div>
          </div>
        </div>

      

        {kycStatus?.status === "rejected" && kycStatus?.remarks && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-8">
            <p className="text-red-800 font-medium flex items-center gap-2 mb-2">
              <FaTimesCircle className="text-red-500" />
              Verification Remarks
            </p>
            <p className="text-red-700 text-sm">{kycStatus.remarks}</p>
          </div>
        )}

        {/* Tab Navigation */}
        {hasUploadedDocs && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-8">
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab('documents')}
                className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === 'documents' 
                    ? 'border-green-500 text-green-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                My Documents
              </button>
              {showUploadForm && (
                <button
                  onClick={() => setActiveTab('upload')}
                  className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === 'upload' 
                      ? 'border-green-500 text-green-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Re-upload Documents
                </button>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Upload Section */}
            {showUploadForm && activeTab === 'upload' && (
              <div className="space-y-6">
                <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6">
                  <h3 className="font-semibold text-orange-800 mb-2 flex items-center gap-2">
                    <FaTimesCircle className="text-orange-600" />
                    Re-upload Required
                  </h3>
                  <p className="text-orange-700 text-sm">
                    Your previous documents were rejected. Please upload new, clear documents to complete your KYC verification.
                  </p>
                </div>

                {/* ID Proof Upload */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <FaIdCard className="text-blue-600 text-lg" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Government ID Proof</h3>
                      <p className="text-sm text-gray-600">Upload Aadhaar, PAN, or Driving License</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-4">
                    {idFiles.map((file, index) => (
                      <div key={index} className="relative group">
                        <Image 
                          src={URL.createObjectURL(file)} 
                          width={120} 
                          height={120} 
                          className="h-28 w-full object-cover rounded-xl border-2 border-gray-200"
                          alt="ID preview"
                        />
                        <button
                          onClick={() => removeFile(index, setIdFiles, idFiles)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                        >
                          <FaTimesCircle className="text-xs" />
                        </button>
                      </div>
                    ))}
                    <label className="h-28 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors group">
                      <FaPlus className="text-gray-400 group-hover:text-blue-500 text-xl mb-2" />
                      <span className="text-sm text-gray-500 group-hover:text-blue-600 text-center px-2">Add ID Document</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileChange(e, setIdFiles)}
                        multiple
                      />
                    </label>
                  </div>
                </div>

                {/* Address Proof Upload */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-green-50 rounded-lg">
                      <FaHome className="text-green-600 text-lg" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Address Proof</h3>
                      <p className="text-sm text-gray-600">Upload utility bill, bank statement, or rental agreement</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-4">
                    {addressFiles.map((file, index) => (
                      <div key={index} className="relative group">
                        <Image 
                          src={URL.createObjectURL(file)} 
                          width={120} 
                          height={120} 
                          className="h-28 w-full object-cover rounded-xl border-2 border-gray-200"
                          alt="Address proof preview"
                        />
                        <button
                          onClick={() => removeFile(index, setAddressFiles, addressFiles)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                        >
                          <FaTimesCircle className="text-xs" />
                        </button>
                      </div>
                    ))}
                    <label className="h-28 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-green-400 hover:bg-green-50 transition-colors group">
                      <FaPlus className="text-gray-400 group-hover:text-green-500 text-xl mb-2" />
                      <span className="text-sm text-gray-500 group-hover:text-green-600 text-center px-2">Add Address Proof</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileChange(e, setAddressFiles)}
                        multiple
                      />
                    </label>
                  </div>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={loading || (idFiles.length === 0 || addressFiles.length === 0)}
                  className={`w-full py-4 px-6 text-white font-semibold rounded-xl transition-all ${
                    loading || (idFiles.length === 0 || addressFiles.length === 0)
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg hover:shadow-xl"
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <CircleSpinner size={20} />
                      Uploading Documents...
                    </div>
                  ) : (
                    "Submit for Verification"
                  )}
                </button>
              </div>
            )}

            {/* Documents View Section */}
            {(activeTab === 'documents' || !showUploadForm) && (
              <div className="space-y-6">
                {/* Status Message */}
                {kycStatus?.status === "pending_with_docs" && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
                    <h3 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                      <FaClock className="text-yellow-600" />
                      Under Review
                    </h3>
                    <p className="text-yellow-700 text-sm">
                      Your documents are currently under review. We'll notify you once the verification is complete.
                    </p>
                  </div>
                )}

                {kycStatus?.status === "approved" && (
                  <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
                    <h3 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                      <FaCheckCircle className="text-green-600" />
                      Verification Complete
                    </h3>
                    <p className="text-green-700 text-sm">
                      Your KYC verification has been approved. You now have full access to all platform features.
                    </p>
                  </div>
                )}

                {/* ID Documents */}
                {idDocs.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg">
                          <FaIdCard className="text-blue-600 text-lg" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">ID Documents</h3>
                          <p className="text-sm text-gray-600">{idDocs.length} document(s) uploaded</p>
                        </div>
                      </div>
                      <button
                        onClick={() => openViewer(idDocs)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        <FaEye />
                        View All
                      </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {idDocs.slice(0, 3).map((url, index) => (
                        <button
                          key={index}
                          onClick={() => openViewer(idDocs)}
                          className="relative h-32 rounded-xl overflow-hidden border-2 border-gray-200 hover:border-blue-400 transition-colors group"
                        >
                          <Image 
                            src={url} 
                            alt={`id-doc-${index}`} 
                            fill
                            className="object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Address Documents */}
                {addressDocs.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-50 rounded-lg">
                          <FaHome className="text-green-600 text-lg" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">Address Proofs</h3>
                          <p className="text-sm text-gray-600">{addressDocs.length} document(s) uploaded</p>
                        </div>
                      </div>
                      <button
                        onClick={() => openViewer(addressDocs)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                      >
                        <FaEye />
                        View All
                      </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {addressDocs.slice(0, 3).map((url, index) => (
                        <button
                          key={index}
                          onClick={() => openViewer(addressDocs)}
                          className="relative h-32 rounded-xl overflow-hidden border-2 border-gray-200 hover:border-green-400 transition-colors group"
                        >
                          <Image 
                            src={url} 
                            alt={`address-doc-${index}`} 
                            fill
                            className="object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* No Documents Message */}
                {!hasUploadedDocs && !showUploadForm && (
                  <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 text-center">
                    <FaIdCard className="text-gray-400 text-4xl mx-auto mb-4" />
                    <h3 className="font-semibold text-gray-700 mb-2">No Documents Uploaded</h3>
                    <p className="text-gray-600 text-sm mb-4">
                      Your KYC verification is pending. You'll be notified if documents are required.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Aadhaar Card */}
            {Array.isArray(producer?.aadharImages) && producer.aadharImages.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <FaIdCard className="text-purple-600 text-lg" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Aadhaar Card</h3>
                    <p className="text-sm text-gray-600">From registration</p>
                  </div>
                </div>
                <button
                  onClick={() => openViewer(producer.aadharImages)}
                  className="w-full py-3 px-4 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <FaEye />
                  View Aadhaar
                </button>
              </div>
            )}

            {/* Document Guidelines */}
            <div className="bg-blue-50 rounded-2xl border border-blue-200 p-6">
              <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <FaInfoCircle className="text-blue-600" />
                Document Guidelines
              </h3>
              <p className="text-sm text-blue-700 mb-4">
                Ensure documents are clear, readable, and valid. Blurry or expired documents will be rejected.
              </p>
              <ul className="text-xs text-blue-600 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="bg-blue-100 text-blue-600 rounded-full p-1 text-[10px] mt-0.5">✓</span>
                  <span>Accepted IDs: Aadhaar, PAN, Driving License</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-blue-100 text-blue-600 rounded-full p-1 text-[10px] mt-0.5">✓</span>
                  <span>Accepted address proofs: Utility bills, Bank statements</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-blue-100 text-blue-600 rounded-full p-1 text-[10px] mt-0.5">✓</span>
                  <span>File types: JPG, PNG (images only)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-blue-100 text-blue-600 rounded-full p-1 text-[10px] mt-0.5">✓</span>
                  <span>Maximum file size: 5MB per file</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-blue-100 text-blue-600 rounded-full p-1 text-[10px] mt-0.5">✓</span>
                  <span>Ensure all text is clearly visible</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-blue-100 text-blue-600 rounded-full p-1 text-[10px] mt-0.5">✓</span>
                  <span>Documents should not be expired</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <DocumentViewerModal
        open={viewerOpen}
        images={selectedImages}
        initialIndex={0}
        onClose={closeViewer}
      />
    </div>
  );
}
