'use client';
import {useTranslations} from 'next-intl';
import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchCategoriesAPI } from "@/lib/api/categories";
import { fetchProductsByCategory } from "@/lib/api/products";
import Loader from "@/components/Loader";
import { FaCartPlus, FaMapMarkerAlt } from "react-icons/fa";
import Image from 'next/image';
import { toast } from 'react-toastify';

export default function HomeCategoryProducts() {
  const t = useTranslations();
  const [catProducts, setCatProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function fetchData() {
      setLoading(true);
      const categories = await fetchCategoriesAPI();
      const result = [];
      for (const cat of categories) {
        const products = await fetchProductsByCategory(cat.id, 4);
        if (products && products.length > 0) {
          result.push({ category: cat, products: products.slice(0, 4) });
        }
      }
      if (mounted) {
        setCatProducts(result);
        setLoading(false);
      }
    }
    fetchData();
    return () => { mounted = false; };
  }, []);

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="flex flex-col items-center space-y-4">
        <Loader size={12} />
        <p className="text-gray-600">Loading fresh products...</p>
      </div>
    </div>
  );
  
  if (!catProducts.length) return null;

  return (
    <section className="px-4 mt-8">
      {catProducts.map(({ category: cat, products }) => (
        <div key={cat.id} id={cat.name.toLowerCase().replace(/ /g, '-')} className="mb-16">
          
          {/* Category Header */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">
                  {cat.name.charAt(0)}
                </span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{cat.name}</h2>
                <p className="text-gray-600">{t('home.categoryProducts.freshFromFarms')}</p>
              </div>
            </div>
            <Link 
              href={`/shop?category=${cat.id}`} 
              className="group flex items-center space-x-2 text-green-600 hover:text-green-700 font-semibold transition-colors duration-200"
            >
              <span>{t('nav.viewAll')}</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 auto-rows-fr">
            {products.map((prod, index) => (
              <div 
                key={prod.id} 
                className={`group relative bg-white rounded-3xl shadow-lg hover:shadow-xl transition-shadow duration-200 border border-gray-100 overflow-hidden ${index >= 2 ? 'hidden sm:block' : ''}`}
              >

                {/* Product Image */}
                <Link href={`/shop/${prod.id}`} className="block">
                  <div className="relative overflow-hidden h-40 sm:h-48 md:h-56">

                    {prod.images && prod.images[0] ? (
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

                    {/* Discount */}
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

                {/* Product Info */}
                <div className="p-3 sm:p-4">
                  <Link href={`/shop/${prod.id}`}>
                    <h3 className="font-semibold text-gray-800 mb-1.5 line-clamp-1 group-hover:text-green-600 transition-colors duration-200">
                      {prod.title}
                    </h3>
                  </Link>
                  
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div className="flex-1">
                      {prod.Producer?.businessName && (
                        <p className="text-gray-500 line-clamp-1">
                          {t('home.categoryProducts.byProducer')} {prod.Producer.businessName}
                        </p>
                      )}

                      {prod.distance !== undefined && prod.distance !== null && (
                        <p className={`font-medium flex items-center gap-1 mt-0.5 ${
                          prod.rangeKm && prod.distance > prod.rangeKm 
                            ? 'text-red-600' 
                            : 'text-green-600'
                        }`}>
                          <FaMapMarkerAlt className="text-xs" />
                          {prod.distance < 1 
                            ? `${(prod.distance * 1000).toFixed(0)}m away`
                            : `${prod.distance.toFixed(1)}km away`
                          }
                        </p>
                      )}
                    </div>

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

                  <div className="flex items-end justify-between mb-1 sm:mb-1.5">
                    <div className="flex flex-col">
                      <span className="text-green-600 font-bold text-lg">₹{Number(prod.price||0).toFixed(2)}</span>
                      <span className="text-[10px] text-gray-500">{t('shop.per')} {prod.unitSize || 1} {prod.unitLabel || 'unit'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Link href={`/shop/${prod.id}`} className="text-sm text-blue-600 hover:underline">
                      {t('shop.viewDetails')}
                    </Link>
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
                          try {
                            const { getCart } = await import('@/lib/api/cart');
                            const cart = await getCart();
                            const count = Array.isArray(cart?.CartItems) ? cart.CartItems.length : 0;
                            localStorage.setItem('cartCount', String(count));
                            window.dispatchEvent(new Event('cartCountUpdate'));
                            toast.success('Added to cart!');
                          } catch {}
                        } catch (e) {
                          if (e?.status === 401 || e?.code === 'UNAUTHORIZED') return;
                          toast.error(t('common.addToCartFailed'));
                        }
                      }}
                    >
                      <FaCartPlus />
                    </button>
                  </div>

                </div>

              </div>
            ))}
          </div>

        </div>
      ))}
    </section>
  );
}
