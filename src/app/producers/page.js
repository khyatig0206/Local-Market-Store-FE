"use client";
import { useEffect, useState } from 'react';
import { fetchFeaturedProducers } from '@/lib/api/producers';
import { fetchCategoriesAPI } from '@/lib/api/categories';
import CircleSpinner from '@/components/CircleSpinner';
import Image from 'next/image';
import Link from 'next/link';
import { FaSearch, FaMapMarkerAlt, FaPhone, FaEnvelope, FaStar, FaStore } from 'react-icons/fa';

export default function ProducersPage() {
  const [producers, setProducers] = useState([]);
  const [filteredProducers, setFilteredProducers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      setLoading(true);
      try {
        const [producersData, categoriesData] = await Promise.all([
          fetchFeaturedProducers(100),
          fetchCategoriesAPI()
        ]);
        
        if (mounted) {
          setProducers(producersData);
          setFilteredProducers(producersData);
          setCategories(categoriesData);
        }
      } catch (error) {
        console.error('Error loading producers:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadData();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let filtered = producers;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(producer =>
        producer.businessName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        producer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        producer.displayCity?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        producer.displayState?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(producer =>
        producer.categories?.some(cat => cat.id === parseInt(selectedCategory))
      );
    }

    setFilteredProducers(filtered);
  }, [searchQuery, selectedCategory, producers]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center">
        <div className="text-center">
            <CircleSpinner size={36} />
          <p className="mt-4 text-green-600 text-lg">Loading producers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-green-50 via-white to-emerald-50">
      {/* Header Section */}
      <div className="bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="bg-white/10 p-3 rounded-full backdrop-blur-sm border border-white/20">
                <FaStore className="w-7 h-7" />
              </div>
              <h1 className="text-3xl md:text-4xl font-semibold">Our Producers</h1>
            </div>
            <p className="text-green-50 text-base md:text-lg max-w-3xl mx-auto mt-3">
              Connect directly with verified producers and farmers. Browse through our community of trusted sellers.
            </p>
            <div className="mt-4 flex items-center justify-center gap-6 text-green-50">
              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm">
                <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
                <span className="text-sm">{producers.length} Active Producers</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md shadow-md border-b border-green-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            {/* Search Bar */}
            <div className="flex-1 w-full md:w-auto">
              <div className="relative">
                <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, location, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border-2 border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="w-full md:w-auto">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full md:w-64 px-4 py-3 border-2 border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all appearance-none cursor-pointer bg-white text-gray-600 font-medium"
              >
                <option value="all" className="text-gray-800">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id} className="text-gray-800">{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Results Count */}
            <div className="text-gray-600 font-medium whitespace-nowrap">
              {filteredProducers.length} {filteredProducers.length === 1 ? 'Producer' : 'Producers'}
            </div>
          </div>
        </div>
      </div>

      {/* Producers Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {filteredProducers.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaStore className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">No Producers Found</h3>
            <p className="text-gray-600 mb-6">Try adjusting your search or filters</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProducers.map((producer) => (
              <div 
                key={producer.id} 
                className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 group"
              >
                {/* Producer Header Image */}
                <Link href={`/producer-profile/${producer.id}`}>
                  <div className="relative h-48 bg-gradient-to-br from-green-400 to-emerald-600 overflow-hidden cursor-pointer">
                    {producer.businessLogo ? (
                      <Image
                        src={producer.businessLogo}
                        alt={producer.businessName}
                        fill
                        className="object-cover group-hover:opacity-70 transition-opacity duration-500"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
                            <FaStore className="w-12 h-12 text-white" />
                          </div>
                      
                        </div>
                      </div>
                    )}
                    
                    {/* Rating Badge */}
                    {producer.rating && (
                      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1 shadow-lg">
                        <FaStar className="w-4 h-4 text-yellow-400" />
                        <span className="font-bold text-gray-800">{Number(producer.rating).toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                </Link>

                {/* Producer Info */}
                <div className="p-6">
                  {/* Name and Email */}
                  <div className="mb-4">
                    <Link href={`/producer-profile/${producer.id}`}>
                      <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1 cursor-pointer hover:text-green-700">
                        {producer.businessName}
                      </h3>
                    </Link>
                   
                  </div>

                  {/* Details */}
                  <div className="space-y-3 text-sm text-gray-600 mb-4">
                    {(producer.displayCity || producer.displayState || producer.location) && (
                      <div className="flex items-center gap-2">
                        <FaMapMarkerAlt className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span className="line-clamp-1">
                          {producer.location || `${producer.displayCity || ''}${producer.displayCity && producer.displayState ? ', ' : ''}${producer.displayState || ''}`}
                        </span>
                      </div>
                    )}
                    
                 
                  </div>

                  {/* Categories */}
                  {producer.categories && producer.categories.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {producer.categories.slice(0, 3).map((cat, idx) => (
                        <span 
                          key={idx}
                          className="px-3 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full border border-green-200"
                        >
                          {cat.name || cat}
                        </span>
                      ))}
                      {producer.categories.length > 3 && (
                        <span className="px-3 py-1 bg-gray-50 text-gray-600 text-xs font-medium rounded-full">
                          +{producer.categories.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Description */}
                  {producer.description && (
                    <p className="text-sm text-gray-500 line-clamp-2 mb-4 leading-relaxed">
                      {producer.description}
                    </p>
                  )}

                  {/* View Products Button */}
                  <Link href={`/producer-profile/${producer.id}`}>
                    <button className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-md">
                      View Products
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      {filteredProducers.length > 0 && (
        <div className="bg-gradient-to-br from-green-600 via-emerald-600 to-teal-700 text-white py-12 mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl md:text-3xl font-semibold mb-3">Want to Become a Producer?</h2>
            <p className="text-green-50 text-base md:text-lg mb-6 max-w-2xl mx-auto">
              Join our community of verified producers and start selling your products today
            </p>
            <Link href="/producer/signup">
              <button className="bg-white text-green-600 px-8 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-300 transform hover:scale-105 shadow-lg">
                Register as Producer
              </button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
