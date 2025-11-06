"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchProductDetails } from "@/lib/api/productDetails";
import Loader from "@/components/Loader";
import Image from 'next/image';
import { FaStar, FaRegStar, FaUserCircle, FaPlus, FaShoppingCart, FaLeaf, FaTruck, FaShieldAlt, FaUndo, FaHeadset, FaFileInvoice, FaTag, FaStore, FaBox, FaCheckCircle } from "react-icons/fa";
import { toast } from 'react-toastify';
import {useTranslations} from 'next-intl';
import CheckoutModal from "@/components/CheckoutModal";
import { placeDirectOrder, initiateDirectPayment, verifyDirectPayment } from "@/lib/api/orders";
import { addReview, getProductReviews } from "@/lib/api/reviews";

function loadRazorpay() {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false);
    if (window.Razorpay) return resolve(true);

    const existing = document.getElementById('razorpay-checkout-js');
    if (existing) {
      const check = () => {
        if (window.Razorpay) return resolve(true);
        setTimeout(check, 50);
      };
      check();
      return;
    }

    const script = document.createElement('script');
    script.id = 'razorpay-checkout-js';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function ProductDetailsPage() {
  const t = useTranslations();
  const { id } = useParams();
  const router = useRouter();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImg, setSelectedImg] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [buyNowOpen, setBuyNowOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('description'); // 'description', 'reviews', 'seller'

  // Review states
  const [reviews, setReviews] = useState([]);
  const [productRating, setProductRating] = useState({ averageRating: 0, totalReviews: 0 });
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewData, setReviewData] = useState({
    rating: 5,
    comment: "",
    images: [],
  });
  const [reviewImagePreviews, setReviewImagePreviews] = useState([]);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);

  // Review form helpers
  const resetReviewForm = () => {
    setReviewData({ rating: 5, comment: "", images: [] });
    setReviewImagePreviews([]);
  };

  const handleReviewImageChange = (e) => {
    try {
      const files = Array.from(e.target.files || []);
      if (!files.length) return;
      const remaining = Math.max(0, 5 - (reviewData.images?.length || 0));
      const toAdd = files.slice(0, remaining);
      setReviewData((prev) => ({ ...prev, images: [...(prev.images || []), ...toAdd] }));
      const urls = toAdd.map((f) => URL.createObjectURL(f));
      setReviewImagePreviews((prev) => [...prev, ...urls]);
    } catch {}
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!product) return;
    if (!reviewData.rating || reviewData.rating < 1 || reviewData.rating > 5) {
      toast.error("Please select a rating");
      return;
    }
    try {
      setSubmittingReview(true);
      await addReview(product.id, reviewData.rating, reviewData.comment, reviewData.images || []);
      toast.success("Review submitted");
      resetReviewForm();
      setShowReviewForm(false);
      // Refresh reviews
      try {
        const updated = await getProductReviews(product.id);
        setReviews(updated);
        if (Array.isArray(updated) && updated.length) {
          const avg = updated.reduce((s, r) => s + Number(r.rating || 0), 0) / updated.length;
          setProductRating({ averageRating: Number(avg.toFixed(1)), totalReviews: updated.length });
        } else {
          setProductRating({ averageRating: 0, totalReviews: 0 });
        }
      } catch {}
    } catch (err) {
      if (err?.status === 401 || err?.code === "UNAUTHORIZED") {
        router.replace('/signin');
        return;
      }
      toast.error(err?.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const discountApplies = () => {
    if (!product || product.discountType === 'none') return false;
    const minQ = Number(product.discountMinQuantity || 0);
    const minS = Number(product.discountMinSubtotal || 0);
    const price = Number(product.price) || 0;
    const qOK = !minQ || quantity >= minQ;
    const sOK = !minS || (quantity * price) >= minS;
    return qOK && sOK;
  };

  const computeTotals = () => {
    if (!product) return { baseTotal: 0, discountAmount: 0, finalTotal: 0 };
    const price = Number(product.price) || 0;
    const baseTotal = price * quantity;
    const minQ = Number(product.discountMinQuantity || 0);
    const minS = Number(product.discountMinSubtotal || 0);
    const qualifies = product.discountType !== 'none' && (!minQ || quantity >= minQ) && (!minS || baseTotal >= minS);
    let discountAmount = 0;
    if (qualifies) {
      if (product.discountType === 'percentage') {
        const d = Number(product.discountValue) || 0;
        discountAmount = +(baseTotal * (d / 100)).toFixed(2);
      } else if (product.discountType === 'flat') {
        const d = Number(product.discountValue) || 0;
        discountAmount = Math.min(baseTotal, d);
      }
    }
    const finalTotal = Math.max(0, +(baseTotal - discountAmount).toFixed(2));
    return { baseTotal: +baseTotal.toFixed(2), discountAmount, finalTotal, qualifies };
  };

  const totalPrice = () => {
    const { finalTotal } = computeTotals();
    return finalTotal;
  };

  const getDiscountConditions = () => {
    if (!product || product.discountType === 'none') return null;
    
    const conditions = [];
    if (product.discountMinQuantity) {
      conditions.push(`Buy ${product.discountMinQuantity}+ units`);
    }
    if (product.discountMinSubtotal) {
      conditions.push(`Order above ₹${product.discountMinSubtotal}`);
    }
    
    return conditions.length > 0 ? conditions.join(' and ') : null;
  };

  useEffect(() => {
    async function getProduct() {
      try {
        setLoading(true);
        const data = await fetchProductDetails(id);
        setProduct(data);
        setProductRating({
          averageRating: Number(data?.averageRating || 0),
          totalReviews: Number(data?.totalReviews || 0),
        });
        
        const reviewsData = await getProductReviews(id);
        setReviews(reviewsData);
      } catch (err) {
        setProduct(null);
      } finally {
        setLoading(false);
      }
    }
    getProduct();
    window.scrollTo(0, 0);
  }, [id]);

  // ... rest of your useEffect and handler functions remain the same

  const outOfStock = product && Number(product.inventory) <= 0;

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 relative">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="leaves" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
                <path d="M20,40 C30,20 50,20 60,40 C50,60 30,60 20,40 Z" fill="currentColor" opacity="0.3"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#leaves)" className="text-green-600"/>
          </svg>
        </div>

        <div className="relative max-w-7xl mx-auto p-4">
          {loading ? (
            <div className="flex justify-center items-center min-h-96">
              <Loader size={12} />
            </div>
          ) : !product ? (
            <div className="text-center text-gray-500 py-20 text-lg">{t('product.notFound')}</div>
          ) : (
            <>
              {/* Breadcrumb */}
              <nav className="flex items-center gap-2 text-sm text-gray-600 mb-6">
                <span>Home</span>
                <span>›</span>
                <span>{product.Category?.name || 'Products'}</span>
                <span>›</span>
                <span className="text-gray-900 font-medium truncate">{product.title}</span>
              </nav>

              {/* Product Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Images */}
                <div className="space-y-4">
                  {/* Main Image */}
                  <div className="relative bg-white rounded-2xl shadow-lg border border-green-100 overflow-hidden">
                    {product.images && product.images.length > 0 ? (
                      <Image
                        src={product.images[selectedImg]}
                        alt={product.title}
                        width={600}
                        height={500}
                        className="w-full h-80 lg:h-96 object-cover transition-all duration-500"
                      />
                    ) : (
                      <div className="w-full h-80 lg:h-96 bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center rounded-2xl">
                        <FaLeaf className="text-green-300 text-6xl" />
                      </div>
                    )}
                    
                    {/* Discount Badge */}
                    {product.discountType !== 'none' && discountApplies() && (
                      <div className="absolute top-4 left-4 bg-gradient-to-r from-red-500 to-pink-600 text-white px-3 py-2 rounded-full text-sm font-bold shadow-lg flex items-center gap-1">
                        <FaTag className="text-white" />
                        {product.discountType === 'percentage' ? `${product.discountValue}% OFF` : 'SALE'}
                      </div>
                    )}
                    
                    {/* Stock Badge */}
                    <div className={`absolute top-4 right-4 px-3 py-2 rounded-full text-xs font-bold shadow-lg flex items-center gap-1 ${
                      outOfStock 
                        ? 'bg-red-500 text-white' 
                        : 'bg-green-500 text-white'
                    }`}>
                      <FaCheckCircle className="text-white" />
                      {outOfStock ? 'Out of Stock' : 'In Stock'}
                    </div>
                  </div>

                  {/* Thumbnails */}
                  {product.images && product.images.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {product.images.map((img, idx) => (
                        <button
                          key={idx}
                          className={`flex-shrink-0 w-16 h-16 lg:w-20 lg:h-20 rounded-lg border-2 transition-all duration-200 ${
                            selectedImg === idx 
                              ? "border-green-600 shadow-md scale-105" 
                              : "border-gray-200 hover:border-green-400"
                          }`}
                          onClick={() => setSelectedImg(idx)}
                        >
                          <Image
                            src={img}
                            alt="thumb"
                            width={80}
                            height={80}
                            className="w-full h-full object-cover rounded"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Product Details */}
                <div className="space-y-6">
                  {/* Header */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-green-100">
                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-3 leading-tight">
                      {product.title}
                    </h1>
                    
                    {/* Rating & Seller */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-amber-50 px-3 py-1 rounded-full">
                          <span className="text-amber-500 flex text-sm">
                            {[...Array(5)].map((_, i) =>
                              i < Math.floor(productRating.averageRating) ? 
                              <FaStar key={i} className="fill-current" /> : 
                              <FaRegStar key={i} className="fill-current" />
                            )}
                          </span>
                          <span className="text-sm text-amber-700 font-medium">
                            {productRating.averageRating.toFixed(1)}
                          </span>
                          <span className="text-xs text-amber-600">
                            ({productRating.totalReviews} reviews)
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <FaStore className="text-green-600" />
                        <button
                          onClick={() => router.push(`/producer-profile/${product.producerId}`)}
                          className="text-green-600 hover:text-green-700 hover:underline font-medium transition-colors"
                        >
                          {product.Producer?.businessName}
                        </button>
                      </div>
                    </div>

                    {/* Pricing */}
                    <div className="mb-4">
                      <div className="flex items-end gap-3 mb-2">
                        <div className="text-3xl font-bold text-green-700">₹{Number(product.price).toFixed(2)}</div>
                        <div className="text-sm text-gray-600">
                          per {product.unitSize || 1} {product.unitLabel || 'unit'}
                        </div>
                      </div>

                      {/* Discount Info */}
                      {product.discountType !== 'none' && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-amber-800">
                            <FaTag className="text-amber-600" />
                            <span className="font-medium">
                              {product.discountType === 'percentage' ? `${product.discountValue}% OFF` : `₹${product.discountValue} OFF`}
                            </span>
                            {getDiscountConditions() && (
                              <span className="text-sm">- {getDiscountConditions()}</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Quick Info */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <FaBox className="text-green-600" />
                        <span className="text-gray-600">Category:</span>
                        <span className="font-medium text-gray-800">{product.Category?.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FaCheckCircle className="text-green-600" />
                        <span className="text-gray-600">Stock:</span>
                        <span className={`font-medium ${outOfStock ? 'text-red-600' : 'text-green-600'}`}>
                          {product.inventory} units
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quantity & Pricing Breakdown */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-green-100">
                    <div className="flex items-center justify-between mb-4">
                      <label className="text-lg font-semibold text-gray-800">Select Quantity</label>
                      <div className="flex items-center gap-2 border-2 border-green-200 rounded-xl bg-green-50">
                        <button
                          className="w-12 h-12 flex items-center justify-center text-green-700 hover:bg-green-200 rounded-l-lg transition-colors text-lg font-bold"
                          onClick={() => setQuantity(q => Math.max(1, q - 1))}
                        >
                          -
                        </button>
                        <span className="w-16 text-center font-bold text-green-900 text-lg">{quantity}</span>
                        <button
                        className="w-12 h-12 flex items-center justify-center text-green-700 hover:bg-green-200 rounded-r-lg transition-colors text-lg font-bold disabled:opacity-50"
                        disabled={outOfStock || quantity >= Number(product?.inventory || 0)}
                          onClick={() => setQuantity(q => Math.min(Number(product?.inventory || 0), q + 1))}
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Price Breakdown */}
                    {(() => {
                      const { baseTotal, discountAmount, finalTotal, qualifies } = computeTotals();
                      return (
                        <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Base Price ({quantity} × ₹{Number(product.price).toFixed(2)})</span>
                            <span className="font-medium text-gray-500">₹{baseTotal.toFixed(2)}</span>
                          </div>
                          {qualifies && (
                            <div className="flex justify-between text-green-700">
                              <span>Discount Applied</span>
                              <span className="font-semibold">-₹{discountAmount.toFixed(2)}</span>
                            </div>
                          )}
                          <div className="border-t pt-2">
                            <div className="flex justify-between text-lg font-bold text-green-700">
                              <span>Total Amount</span>
                              <span>₹{finalTotal.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Action Buttons */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        className={`flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-bold transition-all text-lg ${
                          outOfStock 
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                            : 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                        }`}
                        disabled={outOfStock || addingToCart}
                        onClick={async () => {
                          if (outOfStock || addingToCart) return;
                          setAddingToCart(true);
                          const max = Number(product?.inventory || 0);
                          if (quantity > max) {
                            toast.error(`Only ${max} in stock`);
                            setAddingToCart(false);
                            return;
                          }
                        const { addToCart, getCart } = await import('@/lib/api/cart');
                        try {
                         // Guard combined quantity (existing in cart + desired) <= stock
                        try {
                         const cart = await getCart();
                           const existing = (cart?.CartItems || []).find(ci => ci.productId === product.id);
                             const existingQty = Number(existing?.quantity || 0);
                               if (existingQty + quantity > max) {
                                 toast.error(`Only ${max} in stock. You already have ${existingQty} in cart`);
                                 setAddingToCart(false);
                                 return;
                               }
                             } catch {}
                             await addToCart(product.id, quantity);
                             toast.success("Added to cart! 🛒");
                           } catch (e) {
                             if (e?.status === 401 || e?.code === 'UNAUTHORIZED') return;
                             toast.error(t('common.addToCartFailed'));
                           } finally {
                             setAddingToCart(false);
                           }
                         }}
                      >
                        <FaShoppingCart />
                        Add to Cart
                      </button>
                      <button
                        className={`flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-bold transition-all text-lg ${
                          outOfStock 
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                            : 'bg-orange-500 hover:bg-orange-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                        }`}
                        disabled={outOfStock}
                        onClick={() => {
                          if (outOfStock) return;
                          const max = Number(product?.inventory || 0);
                          if (quantity > max) {
                            toast.error(`Only ${max} in stock`);
                            return;
                          }
                          setBuyNowOpen(true);
                        }}
                      >
                        Buy Now
                      </button>
                    </div>
                  </div>

                  
                </div>
              </div>

              {/* Tabs Section */}
              <div className="bg-white rounded-2xl shadow-sm border border-green-100 overflow-hidden">
                {/* Tab Headers */}
                <div className="border-b border-gray-200">
                  <div className="flex overflow-x-auto">
                    <button
                      onClick={() => setActiveTab('description')}
                      className={`flex items-center gap-2 px-6 py-4 font-semibold border-b-2 transition-all whitespace-nowrap ${
                        activeTab === 'description'
                          ? 'border-green-600 text-green-700 bg-green-50'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <FaLeaf className="text-sm" />
                      Description
                    </button>
                    <button
                      onClick={() => setActiveTab('reviews')}
                      className={`flex items-center gap-2 px-6 py-4 font-semibold border-b-2 transition-all whitespace-nowrap ${
                        activeTab === 'reviews'
                          ? 'border-green-600 text-green-700 bg-green-50'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <FaStar className="text-sm" />
                      Reviews ({productRating.totalReviews})
                    </button>
                    <button
                      onClick={() => setActiveTab('seller')}
                      className={`flex items-center gap-2 px-6 py-4 font-semibold border-b-2 transition-all whitespace-nowrap ${
                        activeTab === 'seller'
                          ? 'border-green-600 text-green-700 bg-green-50'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <FaStore className="text-sm" />
                      Seller Info
                    </button>
                  </div>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                  {activeTab === 'description' && (
                    <div className="prose max-w-none">
                      <h3 className="text-xl font-bold text-gray-800 mb-4">Product Description</h3>
                      <p className="text-gray-700 leading-relaxed text-lg">{product.description}</p>
                      
                      {/* Product Specifications */}
                      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-semibold text-gray-800 mb-2">Product Details</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Unit Size:</span>
                              <span className="font-medium text-gray-500">{product.unitSize || 1} {product.unitLabel || 'unit'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Category:</span>
                              <span className="font-medium text-gray-500">{product.Category?.name}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Stock Status:</span>
                              <span className={`font-medium ${outOfStock ? 'text-red-600' : 'text-green-600'}`}>
                                {outOfStock ? 'Out of Stock' : 'In Stock'}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                          <h4 className="font-semibold text-gray-800 mb-2">Quality Assurance</h4>
                          <div className="space-y-2 text-sm text-green-700">
                            <div className="flex items-center gap-2">
                              <FaCheckCircle className="text-green-600" />
                              <span>Farm Fresh Quality</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <FaCheckCircle className="text-green-600" />
                              <span>Direct from Producer</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <FaCheckCircle className="text-green-600" />
                              <span>Quality Checked</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'reviews' && (
                    <div>
                      <div className="flex justify-between items-center mb-6">
                        <div>
                          <h3 className="text-xl font-bold text-gray-800">Customer Reviews</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex items-center gap-1">
                              <span className="text-amber-500 flex">
                                {[...Array(5)].map((_, i) =>
                                  i < Math.floor(productRating.averageRating) ? 
                                  <FaStar key={i} className="fill-current" /> : 
                                  <FaRegStar key={i} className="fill-current" />
                                )}
                              </span>
                              <span className="text-lg font-bold text-gray-800 ml-2">
                                {productRating.averageRating.toFixed(1)}
                              </span>
                            </div>
                            <span className="text-gray-500">•</span>
                            <span className="text-gray-600">{productRating.totalReviews} reviews</span>
                          </div>
                        </div>
                        <button
                          onClick={() => setShowReviewForm(true)}
                          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors flex items-center gap-2"
                        >
                          <FaPlus />
                          Add Review
                        </button>
                      </div>
                      
                      <div className="space-y-6">
                        {reviews.length === 0 ? (
                          <div className="text-center text-gray-500 py-12">
                            <FaStar className="text-4xl text-gray-300 mx-auto mb-3" />
                            <p className="text-lg mb-2">No reviews yet</p>
                            <p className="text-gray-600">Be the first to share your experience!</p>
                          </div>
                        ) : (
                          reviews.map((review, idx) => (
                            <div key={idx} className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                              <div className="flex items-start gap-4">
                                <FaUserCircle className="text-4xl text-green-600 mt-1 flex-shrink-0" />
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-3 flex-wrap">
                                    <span className="font-semibold text-gray-800 text-lg">{review.User?.username || "Anonymous"}</span>
                                    <span className="text-amber-500 flex">
                                      {[...Array(5)].map((_, i) =>
                                        i < review.rating ? <FaStar key={i} /> : <FaRegStar key={i} />
                                      )}
                                    </span>
                                    <span className="text-sm text-gray-500">
                                      {new Date(review.createdAt).toLocaleDateString('en-US', { 
                                        year: 'numeric', 
                                        month: 'long', 
                                        day: 'numeric' 
                                      })}
                                    </span>
                                  </div>
                                  {review.comment && (
                                    <div className="text-gray-700 text-base leading-relaxed mb-4">{review.comment}</div>
                                  )}
                                  {review.images && review.images.length > 0 && (
                                    <div className="flex flex-wrap gap-3">
                                      {review.images.map((img, imgIdx) => (
                                        <Image
                                          key={imgIdx}
                                          src={img}
                                          alt="review"
                                          width={100}
                                          height={100}
                                          className="w-24 h-24 object-cover rounded-lg border shadow-sm cursor-pointer hover:scale-105 transition-transform"
                                        />
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === 'seller' && (
                    <div className="flex flex-col lg:flex-row gap-8">
                      <div className="lg:w-2/3">
                        <h3 className="text-xl font-bold text-gray-800 mb-6">About the Seller</h3>
                        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                          <div className="flex items-center gap-4 mb-4">
                            <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-green-200 bg-white flex items-center justify-center">
                              {product.Producer?.businessLogo ? (
                                <Image 
                                  src={product.Producer.businessLogo} 
                                  alt={product.Producer?.businessName || 'Producer'} 
                                  width={64} 
                                  height={64} 
                                  className="w-16 h-16 object-cover" 
                                />
                              ) : (
                                <FaStore className="text-green-600 text-2xl" />
                              )}
                            </div>
                            <div>
                              <button
                                onClick={() => router.push(`/producer-profile/${product.producerId}`)}
                                className="text-2xl font-bold text-gray-800 hover:text-green-600 transition-colors text-left"
                              >
                                {product.Producer?.businessName}
                              </button>
                              <div className="flex items-center gap-2 mt-1">
                                <FaCheckCircle className="text-green-600" />
                                <span className="text-green-700 font-semibold">Verified Producer</span>
                              </div>
                            </div>
                          </div>
                          
                          {product.Producer?.description && (
                            <div className="mt-4">
                              <h4 className="font-semibold text-gray-800 mb-2">About the Business</h4>
                              <p className="text-gray-700 leading-relaxed">{product.Producer.description}</p>
                            </div>
                          )}
                          
                          <div className="grid grid-cols-2 gap-4 mt-6">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-green-700">{Number(product.Producer?.averageRating || 0).toFixed(1)}</div>
                              <div className="text-sm text-gray-600">Seller Rating ({product.Producer?.totalReviews || 0})</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-green-700">{product.Producer?.totalProducts || 0}</div>
                              <div className="text-sm text-gray-600">Products</div>
                            </div>
                          </div>
                          
                          
                        </div>
                      </div>
                      
                      <div className="lg:w-1/3">
                        <h4 className="text-lg font-bold text-gray-800 mb-4">Seller Rating</h4>
                        <div className="bg-white rounded-xl p-6 border border-green-200 text-center">
                          <div className="text-4xl font-bold text-amber-500 mb-2">
                            {product.Producer?.averageRating?.toFixed(1) || '4.5'}
                          </div>
                          <div className="text-amber-500 flex justify-center mb-2">
                            {[...Array(5)].map((_, i) => (
                              <FaStar key={i} className="fill-current" />
                            ))}
                          </div>
                          <div className="text-gray-600">Seller Rating</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          <CheckoutModal
            open={buyNowOpen}
            onClose={() => setBuyNowOpen(false)}
            title="Confirm Order"
            itemsPreview={[{
              title: product?.title,
              quantity,
              price: (() => {
                const { finalTotal } = computeTotals();
                return quantity > 0 ? Number((finalTotal / quantity).toFixed(2)) : Number(product?.price || 0);
              })()
            }]}
            total={Number(totalPrice() || 0)}
            onConfirm={async ({ addressId, paymentMethod }) => {
              try {
                if (paymentMethod === 'PREPAID') {
                  // Step 1: Initiate payment to get Razorpay order
                  const paymentRes = await initiateDirectPayment(product.id, quantity);

                  const loaded = await loadRazorpay();
                  if (!loaded || !window.Razorpay) {
                    toast.error('Payment gateway failed to load');
                    setBuyNowOpen(false);
                    return;
                  }

                  // Fetch address for prefill
                  const { getAddressById } = await import('@/lib/api/addresses');
                  let selectedAddress = null;
                  try {
                    selectedAddress = await getAddressById(addressId);
                  } catch (e) {
                    console.warn('Could not fetch address details:', e.message);
                  }

                  const options = {
                    key: paymentRes.keyId,
                    amount: paymentRes.amount,
                    currency: paymentRes.currency || 'INR',
                    name: 'Marketplace',
                    description: product.title,
                    order_id: paymentRes.razorpayOrderId,
                    prefill: selectedAddress ? {
                      name: selectedAddress.contactName,
                      contact: selectedAddress.contactPhone
                    } : {},
                    handler: async function (response) {
                      try {
                        // Step 2: Verify payment and create order
                        await verifyDirectPayment({
                          productId: product.id,
                          quantity,
                          addressId,
                          razorpay_order_id: response.razorpay_order_id,
                          razorpay_payment_id: response.razorpay_payment_id,
                          razorpay_signature: response.razorpay_signature
                        });
                        toast.success('Payment successful');
                        router.replace('/orders');
                      } catch (err) {
                        toast.error('Payment verification failed');
                      } finally {
                        setBuyNowOpen(false);
                      }
                    },
                    modal: {
                      ondismiss: function () {
                        setBuyNowOpen(false);
                        toast.info('Payment cancelled');
                      }
                    },
                    theme: { color: '#16a34a' }
                  };
                  const rzp = new window.Razorpay(options);
                  rzp.open();
                  return;
                }

                // COD flow - place order directly
                await placeDirectOrder(product.id, quantity, {
                  addressId,
                  paymentMethod: 'COD'
                });

                toast.success('Order placed successfully!');
                router.replace('/orders');
              } catch (e) {
                if (e?.status === 401 || e?.code === 'UNAUTHORIZED') {
                  router.replace('/signin');
                  return;
                }
                toast.error('Failed to place order');
              } finally {
                if (paymentMethod !== 'PREPAID') {
                  setBuyNowOpen(false);
                }
              }
            }}
          />
          {/* Review Form Modal */}
          {showReviewForm && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-gray-800">Add Review</h3>
                    <button
                      onClick={() => {
                        setShowReviewForm(false);
                        resetReviewForm();
                      }}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <FaPlus className="rotate-45" />
                    </button>
                  </div>
                </div>

                <form onSubmit={handleSubmitReview} className="p-6 space-y-6">
                  {/* Rating */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Your Rating</label>
                    <div className="flex gap-1 justify-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewData(prev => ({ ...prev, rating: star }))}
                          className="text-3xl focus:outline-none transition-transform hover:scale-110"
                        >
                          {star <= reviewData.rating ? (
                            <FaStar className="text-amber-500" />
                          ) : (
                            <FaRegStar className="text-gray-300" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Comment */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Your Review (optional)</label>
                    <textarea
                      value={reviewData.comment}
                      onChange={(e) => setReviewData(prev => ({ ...prev, comment: e.target.value }))}
                      rows={4}
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-700 focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                      placeholder="Share your experience with this product..."
                    />
                  </div>

                  {/* Images */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Add Photos (up to 5)</label>
                    <div className="flex flex-wrap gap-3 mb-2">
                      {reviewImagePreviews.map((url, idx) => (
                        <div key={idx} className="relative group">
                          <div className="w-20 h-20 rounded-xl border-2 border-green-200 overflow-hidden">
                            <Image src={url} width={80} height={80} className="w-full h-full object-cover" alt="preview" />
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setReviewData(prev => ({
                                ...prev,
                                images: prev.images.filter((_, i) => i !== idx)
                              }));
                              setReviewImagePreviews(prev => prev.filter((_, i) => i !== idx));
                            }}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                      {reviewImagePreviews.length < 5 && (
                        <label className="w-20 h-20 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors">
                          <FaPlus className="text-gray-400 text-xl mb-1" />
                          <span className="text-xs text-gray-500 text-center">Add Photo</span>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleReviewImageChange}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => {
                        setShowReviewForm(false);
                        resetReviewForm();
                      }}
                      className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {submittingReview ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Submitting...
                        </>
                      ) : (
                        "Submit Review"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}