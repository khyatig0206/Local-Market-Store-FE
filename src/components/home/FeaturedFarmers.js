'use client';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { fetchFeaturedProducers } from '@/lib/api/producers';
import CircleSpinner from '@/components/CircleSpinner';

export default function FeaturedFarmers() {
  const t = useTranslations();
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function loadFarmers() {
      setLoading(true);
      const producers = await fetchFeaturedProducers(3);
      if (mounted) {
        setFarmers(producers);
        setLoading(false);
      }
    }
    loadFarmers();
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <section className="py-12 mb-12 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 rounded-3xl px-6">
        <div className="flex justify-center py-20">
          <div className="flex flex-col items-center space-y-4">
            <CircleSpinner size={36} />
            <p className="text-green-600 text-lg">{t('home.featuredProducers.loading')}</p>
          </div>
        </div>
      </section>
    );
  }

  if (farmers.length === 0) return null;

  return (
    <section className=" bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 rounded-3xl px-6">
      {/* Enhanced Header with Icon */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full mb-4">
<svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
</svg>
        </div>
        <h2 className="text-4xl font-bold text-gray-900 mb-4">
          {t('home.featuredProducers.title')}
        </h2>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
          {t('home.featuredProducers.description')}
        </p>
      </div>
      
      {/* Farmers Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
        {farmers.map((farmer) => (
          <div key={farmer.id} className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-200 group">
            {/* Header with Gradient Background */}
            <Link href={`/producer-profile/${farmer.id}`}>
              <div className="relative h-48 bg-gradient-to-br from-green-400 to-emerald-600 overflow-hidden cursor-pointer">
                {farmer.businessLogo ? (
                  <Image
                    src={farmer.businessLogo}
                    alt={farmer.businessName}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                     
                    </div>
                  </div>
                )}
                
               

                {/* Rating Badge */}
                {farmer.rating && (
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center space-x-1 shadow-lg">
                    <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-sm font-semibold text-gray-900">{Number(farmer.rating).toFixed(1)}</span>
                  </div>
                )}
              </div>
            </Link>
            
            {/* Content */}
            <div className="p-6 pt-8">
              <div className="mb-4">
                <Link href={`/producer-profile/${farmer.id}`}>
                  <h3 className="font-bold text-gray-900 text-xl mb-2 line-clamp-1 group-hover:text-green-700 transition-colors duration-200 cursor-pointer">
                    {farmer.businessName}
                  </h3>
                </Link>
               
              </div>
              
              {/* Details */}
              <div className="space-y-3 text-sm text-gray-600 mb-4">
                {(farmer.displayCity || farmer.displayState || farmer.location) && (
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-3 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="line-clamp-1">
                      {farmer.location || `${farmer.displayCity || ''}${farmer.displayCity && farmer.displayState ? ', ' : ''}${farmer.displayState || ''}`}
                    </span>
                  </div>
                )}
                
                
                
                {farmer.categories && farmer.categories.length > 0 && (
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-3 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <span className="line-clamp-1">
                      {Array.isArray(farmer.categories) 
                        ? farmer.categories.map(c => c.name || c).join(', ') 
                        : farmer.categories}
                    </span>
                  </div>
                )}
              </div>

              {/* Description */}
              {farmer.description && (
                <p className="text-sm text-gray-500 line-clamp-2 mb-4 leading-relaxed">
                  {farmer.description}
                </p>
              )}
              
              {/* View Products Button */}
              <Link href={`/producer-profile/${farmer.id}`}>
                <button className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-colors duration-200 flex items-center justify-center space-x-2">
                  <span>{t('home.featuredProducers.viewProducts')}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* View All Button */}
      <div className="text-center">
        <Link 
          href="/producers" 
          className="inline-flex items-center justify-center bg-white text-green-600 border-2 border-green-500 hover:bg-green-500 hover:text-white px-8 py-4 rounded-2xl font-semibold transition-colors duration-200 group"
        >
          <span>{t('home.featuredProducers.viewAllProducers')}</span>
          <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>
      </div>
    </section>
  );
}