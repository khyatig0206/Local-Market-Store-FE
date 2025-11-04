"use client";
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import CircleSpinner from '@/components/CircleSpinner';
import { FaStar, FaMapMarkerAlt, FaPhone, FaEnvelope, FaBox, FaStore, FaCartPlus } from 'react-icons/fa';
import { toast } from 'react-toastify';

export default function ProducerProfilePage() {
  const params = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    let mounted = true;
    async function loadProducerProfile() {
      setLoading(true);
      try {
        const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";
        const res = await fetch(`${BASE_URL}/api/producer/public/${params.id}`);
        const result = await res.json();
        
        if (!res.ok) {
          if (mounted) toast.error(result.message || 'Producer not found');
          return;
        }
        if (mounted) {
          setData(result);
        }
      } catch (error) {
        console.error('Error loading producer:', error);
        if (mounted) toast.error('Failed to load producer profile');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    
    if (params.id) {
      loadProducerProfile();
    }
    return () => { mounted = false; };
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <CircleSpinner size={36} />
          <p className="mt-4 text-green-600 text-lg">Loading producer profile...</p>
        </div>
      </div>
    );
  }

  if (!data || !data.producer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <FaStore className="w-24 h-24 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Producer Not Found</h2>
          <Link href="/producers" className="text-green-600 hover:text-green-700 underline">
            Back to All Producers
          </Link>
        </div>
      </div>
    );
  }

  const { producer, stats, productsByCategory } = data;
  
  const filteredProducts = activeCategory === 'all' 
    ? productsByCategory 
    : productsByCategory.filter(cat => cat.categoryId === activeCategory);

  const handleAddToCart = async (productId) => {
    try {
      const { addToCart } = await import('@/lib/api/cart');
      await addToCart(productId, 1);
      try {
        const { getCart } = await import('@/lib/api/cart');
        const cart = await getCart();
        const count = Array.isArray(cart?.CartItems) ? cart.CartItems.length : 0;
        localStorage.setItem('cartCount', String(count));
        window.dispatchEvent(new Event('cartCountUpdate'));
      } catch {}
      toast.success('Added to cart! 🛒');
    } catch (err) {
      if (err?.status === 401 || err?.code === 'UNAUTHORIZED') {
        toast.info('Please sign in to add items to cart');
        return;
      }
      toast.error('Failed to add to cart');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      {/* Hero Section with Producer Info */}
      <div className="relative bg-gradient-to-br from-green-600 via-emerald-600 to-teal-700 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-white rounded-full translate-y-1/2 -translate-x-1/2"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-3 gap-8 items-center">
            {/* Logo */}
            <div className="flex justify-center md:justify-start">
              <div className="relative w-48 h-48 rounded-3xl overflow-hidden shadow-2xl border-4 border-white/20 bg-white/10 backdrop-blur-sm">
                {producer.businessLogo ? (
                  <Image
                    src={producer.businessLogo}
                    alt={producer.businessName}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FaStore className="w-20 h-20 text-white/50" />
                  </div>
                )}
              </div>
            </div>

            {/* Producer Info */}
            <div className="md:col-span-2 text-center md:text-left">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">{producer.businessName}</h1>
              
              <div className="flex flex-wrap gap-4 justify-center md:justify-start mb-6">
                
                
                {(producer.displayCity || producer.displayState || producer.location) && (
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
                    <FaMapMarkerAlt className="w-4 h-4" />
                    <span className="text-sm">
                      {producer.location || `${producer.displayCity || ''}${producer.displayCity && producer.displayState ? ', ' : ''}${producer.displayState || ''}`}
                    </span>
                  </div>
                )}
              </div>

              {producer.description && (
                <p className="text-green-50 text-lg leading-relaxed mb-6 max-w-3xl">
                  {producer.description}
                </p>
              )}

              {/* Categories Tags */}
              {producer.categories && producer.categories.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                  {producer.categories.map((cat) => (
                    <span 
                      key={cat.id}
                      className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white text-sm font-medium rounded-full border border-white/30"
                    >
                      {cat.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 text-center">
              <FaBox className="w-8 h-8 mx-auto mb-3 text-green-200" />
              <div className="text-3xl font-bold mb-1">{stats.totalProducts}</div>
              <div className="text-green-50 text-sm">Total Products</div>
            </div>
            
            {stats.averageRating && (
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 text-center">
                <FaStar className="w-8 h-8 mx-auto mb-3 text-yellow-300" />
                <div className="text-3xl font-bold mb-1">{stats.averageRating}</div>
                <div className="text-green-50 text-sm">Average Rating</div>
              </div>
            )}
            
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 text-center">
              <svg className="w-8 h-8 mx-auto mb-3 text-green-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              <div className="text-3xl font-bold mb-1">{stats.totalReviews}</div>
              <div className="text-green-50 text-sm">Customer Reviews</div>
            </div>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Category Filter Tabs */}
        {productsByCategory.length > 1 && (
          <div className="mb-8 flex flex-wrap gap-3 justify-center">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                activeCategory === 'all'
                  ? 'bg-green-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 border-2 border-green-200 hover:border-green-400'
              }`}
            >
              All Products ({productsByCategory.reduce((sum, cat) => sum + cat.products.length, 0)})
            </button>
            {productsByCategory.map((cat) => (
              <button
                key={cat.categoryId}
                onClick={() => setActiveCategory(cat.categoryId)}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  activeCategory === cat.categoryId
                    ? 'bg-green-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 border-2 border-green-200 hover:border-green-400'
                }`}
              >
                {cat.categoryName} ({cat.products.length})
              </button>
            ))}
          </div>
        )}

        {/* Products by Category */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <FaBox className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No products available</p>
          </div>
        ) : (
          <div className="space-y-12">
            {filteredProducts.map((categoryGroup) => (
              <div key={categoryGroup.categoryId} id={`category-${categoryGroup.categoryId}`}>
                {/* Category Header */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center">
                    <span className="text-white font-bold text-xl">
                      {categoryGroup.categoryName.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{categoryGroup.categoryName}</h2>
                    <p className="text-gray-600 text-sm">{categoryGroup.products.length} products available</p>
                  </div>
                </div>

                {/* Products Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {categoryGroup.products.map((product) => (
                    <div
                      key={product.id}
                      className="group bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-500 border border-gray-100 overflow-hidden hover:-translate-y-2"
                    >
                      {/* Product Image */}
                      <Link href={`/shop/${product.id}`}>
                        <div className="relative h-56 overflow-hidden bg-gray-100">
                          {product.images && product.images[0] ? (
                            <Image
                              src={product.images[0]}
                              alt={product.title}
                              fill
                              className="object-cover group-hover:scale-110 transition-transform duration-700"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <div className="text-center">
                                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-2">
                                  <span className="text-3xl">🌱</span>
                                </div>
                                <span className="text-gray-400 text-sm">No Image</span>
                              </div>
                            </div>
                          )}
                          
                          {/* Badges */}
                          {Number(product.inventory) <= 0 && (
                            <div className="absolute top-3 left-3 bg-red-500 text-white text-xs px-3 py-1 rounded-full font-semibold shadow-lg">
                              Out of Stock
                            </div>
                          )}
                          {product.discountType !== 'none' && Number(product.inventory) > 0 && (
                            <div className="absolute top-3 left-3 bg-gradient-to-r from-red-500 to-pink-600 text-white text-xs px-3 py-1 rounded-full font-semibold shadow-lg">
                              SALE
                            </div>
                          )}
                        </div>
                      </Link>

                      {/* Product Info */}
                      <div className="p-4">
                        <Link href={`/shop/${product.id}`}>
                          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1 group-hover:text-green-600 transition-colors">
                            {product.title}
                          </h3>
                        </Link>

                        {/* Rating and Stock Info */}
                        <div className="flex items-center justify-between text-xs mb-2">
                          <div className="flex items-center gap-1">
                            {product.averageRating > 0 ? (
                              <>
                                <FaStar className="w-3.5 h-3.5 text-yellow-400" />
                                <span className="font-semibold text-gray-700">{Number(product.averageRating).toFixed(1)}</span>
                                <span className="text-gray-500">({product.totalReviews || 0})</span>
                              </>
                            ) : (
                              <span className="text-gray-400">No ratings yet</span>
                            )}
                          </div>
                          {Number(product.inventory) > 0 && Number(product.inventory) <= 10 && (
                            <span className="text-orange-600 font-medium">
                              Only {product.inventory} left
                            </span>
                          )}
                        </div>

                        <div className="mb-3">
                          <div className="flex items-baseline gap-2">
                            <span className="text-xl font-bold text-green-700">
                              ₹{Number(product.price || 0).toFixed(2)}
                            </span>
                            {product.originalPrice && product.originalPrice > product.price && (
                              <span className="text-sm text-gray-500 line-through">
                                ₹{Number(product.originalPrice).toFixed(2)}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            per {product.unitSize || 1} {product.unitLabel || 'unit'}
                          </p>
                        </div>

                        {/* Add to Cart Button */}
                        <button
                          onClick={() => handleAddToCart(product.id)}
                          disabled={Number(product.inventory) <= 0}
                          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold transition-all duration-300 ${
                            Number(product.inventory) <= 0
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-green-600 text-white hover:bg-green-700 transform hover:scale-105 shadow-md'
                          }`}
                        >
                          <FaCartPlus className="w-4 h-4" />
                          {Number(product.inventory) <= 0 ? 'Out of Stock' : 'Add to Cart'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Back to All Producers */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
        <Link 
          href="/producers"
          className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-semibold transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to All Producers
        </Link>
      </div>
    </div>
  );
}
