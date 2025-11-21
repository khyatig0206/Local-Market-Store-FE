'use client';
import {useTranslations} from 'next-intl';
import { useEffect, useState } from 'react';
import { fetchBestSellers } from '@/lib/api/products';
import Loader from '@/components/Loader';
import Link from 'next/link';
import Image from 'next/image';
import { FaCartPlus } from 'react-icons/fa';
import { toast } from 'react-toastify';

export default function HomeBestSellers() {
  const t = useTranslations();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const list = await fetchBestSellers(8);
        const arr = Array.isArray(list)
          ? list
          : (Array.isArray(list?.rows)
              ? list.rows
              : (list && typeof list === 'object' ? [list] : []));
        
        // Show 8 products only if we have 8+, otherwise show max 4
        const displayItems = arr.length >= 8 ? arr.slice(0, 8) : arr.slice(0, 4);
        
        if (mounted) setItems(displayItems);
      } catch (e) {
        console.warn('BestSellers fetch failed', e);
        if (mounted) setItems([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <section className="py-12 mb-12 bg-gradient-to-br from-red-50 via-rose-50 to-pink-50 rounded-3xl px-6 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-red-200 rounded-full -translate-x-1/2 -translate-y-1/2 opacity-20"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-pink-200 rounded-full translate-x-1/2 translate-y-1/2 opacity-20"></div>
      
      <div className="relative">
        {/* Enhanced Header with Consistent Icon */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-100 to-pink-100 rounded-full mb-4">
<svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
</svg>
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            {t('bestSellers.title')}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            {t('home.bestSellers.description')}
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="flex flex-col items-center space-y-4">
              <Loader size={12} />
              <p className="text-gray-600 text-lg">{t('home.bestSellers.loading')}</p>
            </div>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-white/80 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <p className="text-gray-500 text-lg">{t('bestSellers.empty')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-fr">
            {items.map((prod, index) => (
              <div 
                key={prod.id} 
                className={`group relative bg-white rounded-3xl shadow-lg hover:shadow-xl transition-shadow duration-200 border border-gray-100 overflow-hidden ${index >= 4 ? 'hidden sm:block' : ''}`}
              >
                {/* Best Seller Badge */}
                {index < 3 && (
                  <div className="absolute top-4 left-4 z-10">
                    <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs px-3 py-1 rounded-full font-bold shadow-lg flex items-center space-x-1">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span>#{index + 1} {t('home.bestSellers.badge')}</span>
                    </div>
                  </div>
                )}

                <Link href={`/shop/${prod.id}`} className="block">
                  <div className="relative overflow-hidden h-56">
                    {Array.isArray(prod.images) && prod.images[0] ? (
                      <Image 
                        src={prod.images[0]} 
                        alt={prod.title} 
                        width={400} 
                        height={224}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        <div className="text-center">
                          <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center mx-auto mb-2">
                            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <span className="text-gray-500 text-sm">No Image</span>
                        </div>
                      </div>
                    )}

                    {/* Stock Badge */}
                    {Number(prod.inventory) <= 0 && (
                      <div className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm bg-red-500 text-white">
                        {t('common.outOfStock')}
                      </div>
                    )}

                    {/* Discount Badge */}
                    {String(prod.discountType) !== 'none' && (
                      <div className="absolute bottom-3 left-3 bg-red-500 text-white px-2 py-1 rounded-lg text-xs font-bold">
                        {prod.discountType === 'percentage' ? `${prod.discountValue}% OFF` : 'SALE'}
                        {(prod.discountMinQuantity || prod.discountMinSubtotal) && (() => {
                          const unitLbl = String(prod.unitLabel || 'unit');
                          return (
                            <span className="ml-2 bg-white/20 text-[10px] px-1.5 py-0.5 rounded">
                              {prod.discountMinQuantity ? `on ${prod.discountMinQuantity}${unitLbl}+` : ''}
                              {prod.discountMinQuantity && prod.discountMinSubtotal ? ' & ' : ''}
                              {prod.discountMinSubtotal ? `₹${prod.discountMinSubtotal}+` : ''}
                            </span>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </Link>

                <div className="p-3">
                  <Link href={`/shop/${prod.id}`}>
                    <h3 className="font-semibold text-gray-800 mb-1.5 line-clamp-1 group-hover:text-green-600 transition-colors duration-200">
                      {prod.title}
                    </h3>
                  </Link>
                  
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    {prod.Producer?.businessName && (
                      <p className="text-gray-500 line-clamp-1">
                        {t('home.categoryProducts.byProducer')} {prod.Producer.businessName}
                      </p>
                    )}
                    {Number(prod.averageRating || 0) > 0 && (
                      <div className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-gray-700 font-medium">{Number(prod.averageRating).toFixed(1)}</span>
                        <span className="text-gray-500">({prod.totalReviews || 0})</span>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-gray-500 mb-2">
                    {prod.Category?.name || '—'}
                  </p>

                  <div className="flex items-end justify-between mb-2">
                    <div className="flex flex-col">
                      <span className="text-green-600 font-bold text-lg">₹{Number(prod.price||0).toFixed(2)}</span>
                      <span className="text-[10px] text-gray-500">{t('shop.per')} {prod.unitSize || 1} {prod.unitLabel || 'unit'}</span>
                    </div>
                    
                    <button
                      className={`${Number(prod.inventory) <= 0 ? 'px-3 py-2 rounded-lg bg-gray-200 text-gray-400 cursor-not-allowed' : 'px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors duration-200'}`}
                      title={Number(prod.inventory) <= 0 ? t('common.outOfStock') : t('common.addToCart')}
                      disabled={Number(prod.inventory) <= 0}
                      onClick={async (e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        if (Number(prod.inventory) <= 0) return;
                        const { addToCart } = await import('@/lib/api/cart');
                        try {
                          await addToCart(prod.id, 1);
                          toast.success('Added to cart! 🛒');
                        } catch (er) {
                          if (er?.status === 401 || er?.code === 'UNAUTHORIZED') return;
                          toast.error(t('common.addToCartFailed'));
                        }
                      }}
                    >
                      <FaCartPlus className="text-base lg:text-xl" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* View All Button - Matching Style */}
        {items.length > 0 && (
          <div className="text-center mt-12">
            <Link 
              href="/shop" 
              className="inline-flex items-center justify-center bg-white text-green-600 border-2 border-green-500 hover:bg-green-500 hover:text-white px-8 py-4 rounded-2xl font-semibold transition-colors duration-200 group"
            >
              <span>{t('bestSellers.viewAll')}</span>
              <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
