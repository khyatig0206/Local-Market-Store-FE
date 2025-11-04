"use client";
import { useEffect, useRef, useState, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { fetchProductsPaginated, searchProductsPaginated, fetchProductsCount } from "@/lib/api/products";
import { fetchCategoriesAPI } from "@/lib/api/categories";
import Loader from "@/components/Loader";
import Image from 'next/image';
import { FaCartPlus, FaFilter, FaSort, FaStar, FaTag, FaMapMarkerAlt } from "react-icons/fa";
import { toast } from 'react-toastify';
import { useTranslations } from 'next-intl';

export default function ShopPage() {
  return (
    <>
      <Suspense fallback={<div>Loading...</div>}>
        <ShopPageContent />
      </Suspense>
    </>
  );
}

function ShopPageContent() {
  const t = useTranslations();
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const loadMoreRef = useRef(null);
  const productScrollRef = useRef(null);
  // Use a multiple of 4 to match a 4-column grid nicely
  const PAGE_SIZE = 24;
  const searchParams = useSearchParams();
  const router = useRouter();
  const searchQuery = searchParams.get("q") || "";
  const categoryParam = searchParams.get("category") || "";
  const [categoryFilter, setCategoryFilter] = useState("");

  // New filters & sort
  const [inStockOnly, setInStockOnly] = useState(false);
  const [discountOnly, setDiscountOnly] = useState(false);
  const [sortBy, setSortBy] = useState("newest"); // newest | price_asc | price_desc | rating_desc
  const [unitFilter, setUnitFilter] = useState("");

  // Exact total count from server (category/search aware)
  const [totalCount, setTotalCount] = useState(0);

  // Set category filter from URL param on first load
  useEffect(() => {
    setCategoryFilter(categoryParam);
  }, [categoryParam]);

  const [categories, setCategories] = useState([]);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(0);
  const [priceRange, setPriceRange] = useState([0, 0]);

  // Load initial data and when search/category changes
  useEffect(() => {
    const initialLoad = async () => {
      try {
        setLoading(true);
        setHasMore(true);
        setOffset(0);
        let data = [];
        // Fetch total count up front to avoid interim inaccuracies
        const cid = categoryFilter || "";
        const count = await fetchProductsCount({ categoryId: cid, q: searchQuery });
        setTotalCount(count);
        if (searchQuery) {
          data = await searchProductsPaginated(searchQuery, { limit: PAGE_SIZE, offset: 0 });
        } else {
          data = await fetchProductsPaginated({ limit: PAGE_SIZE, offset: 0, categoryId: cid });
        }
        setProducts(data || []);
        setOffset((data || []).length);
        setHasMore((data || []).length === PAGE_SIZE);
      } catch (err) {
        console.error("Failed to load products", err);
        setProducts([]);
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    };
    initialLoad();
    fetchCategoriesAPI().then(setCategories).catch(() => setCategories([]));
  }, [searchQuery, categoryFilter]);

  // Set price range based on products (from currently loaded batch)
  useEffect(() => {
    if (products.length) {
      const prices = products.map((p) => Number(p.price || 0));
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      setPriceRange([min, max]);
      setMinPrice(min);
      setMaxPrice(max);
    }
  }, [products]);

  // Keep the URL in sync with the selected category (remove or update ?category=)
  // Preserves existing ?q search param and avoids full reload/scroll jump
  useEffect(() => {
    const params = new URLSearchParams(Array.from(searchParams.entries()))
    if (categoryFilter) {
      params.set('category', categoryFilter);
    } else {
      params.delete('category');
    }
    const qs = params.toString();
    const path = typeof window !== 'undefined' ? window.location.pathname : '/shop';
    router.replace(`${path}${qs ? `?${qs}` : ''}`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryFilter]);

  // Infinite scroll loader
  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;
    const rootEl = productScrollRef.current;
    const obs = new IntersectionObserver(
      async (entries) => {
        const first = entries[0];
        if (first.isIntersecting && hasMore && !pageLoading) {
          try {
            setPageLoading(true);
            let data = [];
            if (searchQuery) {
              data = await searchProductsPaginated(searchQuery, { limit: PAGE_SIZE, offset });
            } else {
              const cid = categoryFilter || "";
              data = await fetchProductsPaginated({ limit: PAGE_SIZE, offset, categoryId: cid });
            }
            setProducts((prev) => [...prev, ...(data || [])]);
            setOffset((prev) => prev + (data?.length || 0));
            if (!data || data.length < PAGE_SIZE) setHasMore(false);
          } catch (err) {
            setHasMore(false);
          } finally {
            setPageLoading(false);
          }
        }
      },
      { root: rootEl, rootMargin: "200px", threshold: 0 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [loadMoreRef, hasMore, pageLoading, offset, searchQuery, categoryFilter, productScrollRef]);

  // Derive available unit labels from current products for filter dropdown
  const availableUnits = useMemo(() => {
    const s = new Set();
    products.forEach(p => { if (p.unitLabel) s.add(String(p.unitLabel)); });
    return Array.from(s);
  }, [products]);

  // Filtering & sorting (client-side for additional options)
  const finalList = useMemo(() => {
    let filtered = products.filter((product) => {
      const matchesCategory = categoryFilter ? String(product.categoryId) === String(categoryFilter) : true;
      const matchesMin = minPrice ? Number(product.price) >= parseFloat(minPrice) : true;
      const matchesMax = maxPrice ? Number(product.price) <= parseFloat(maxPrice) : true;
      const matchesStock = inStockOnly ? Number(product.inventory) > 0 : true;
      const matchesDiscount = discountOnly ? String(product.discountType) !== 'none' : true;
      const matchesUnit = unitFilter ? String(product.unitLabel) === String(unitFilter) : true;
      return matchesCategory && matchesMin && matchesMax && matchesStock && matchesDiscount && matchesUnit;
    });

    switch (sortBy) {
      case 'price_asc':
        filtered = filtered.sort((a, b) => Number(a.price) - Number(b.price));
        break;
      case 'price_desc':
        filtered = filtered.sort((a, b) => Number(b.price) - Number(a.price));
        break;
      case 'rating_desc':
        filtered = filtered.sort((a, b) => Number(b.averageRating || 0) - Number(a.averageRating || 0));
        break;
      case 'newest':
      default:
        // Already roughly newest from backend; keep as-is
        break;
    }
    return filtered;
  }, [products, categoryFilter, minPrice, maxPrice, inStockOnly, discountOnly, unitFilter, sortBy]);

  return (
    <div className="h-[100dvh] bg-gradient-to-br from-green-50 via-white to-emerald-50 text-gray-800 overflow-hidden">
      {/* Hero/Header */}
      <div className="bg-gradient-to-br from-green-600 via-emerald-600 to-teal-700 text-white py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-semibold">{t('shop.title', { default: 'Shop Products' })}</h1>
              <p className="text-green-50 mt-2">
                {searchQuery
                  ? t('shop.showingResultsFor', { query: searchQuery, default: `Showing results for "${searchQuery}"` })
                  : t('shop.headerSubtitle', { default: 'Discover fresh, local products directly from trusted producers' })}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm border border-white/20">
                <span className="text-sm">{t('shop.itemsCount', { count: totalCount, default: '{count} items' })}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="pt-4 pr-4 pl-4 sm:pt-6 sm:pr-6 sm:pl-6 h[calc(100dvh-12rem)] md:h-[calc(100dvh-12rem)]">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader size={12} />
          </div>
        ) : (
          <div className="flex h-full gap-6 max-w-7xl mx-auto">
            {/* Sidebar Filters */}
            <aside className="hidden lg:block sticky top-0 self-start space-y-6 bg-white/90 rounded-2xl shadow border border-gray-200 p-5 h-full w-72 overflow-y-auto custom-scroll-rounded">
              <div className="flex items-center gap-2">
                <FaFilter className="text-green-600" />
                <h2 className="text-lg font-bold text-green-700">{t('shop.filters', { default: 'Filters' })}</h2>
              </div>

              {/* Category Filter */}
              <div>
                <h4 className="font-semibold mb-2 text-sm">{t('shop.category')}</h4>
                <div className="space-y-2 max-h-52 overflow-y-auto custom-scroll-rounded">
                  {categories.map((cat) => (
                    <label key={cat.id} className="flex items-center text-sm capitalize">
                      <input
                        type="radio"
                        name="category"
                        value={cat.id}
                        checked={String(categoryFilter) === String(cat.id)}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="mr-2 accent-green-600"
                      />
                      {cat.name}
                    </label>
                  ))}
                </div>
                <button
                  onClick={() => setCategoryFilter("")}
                  className="text-xs mt-2 text-blue-600 hover:underline"
                >
                  {t('shop.clearCategory', { default: 'Clear Category' })}
                </button>
              </div>

              {/* Price Range */}
              <div>
                <h4 className="font-semibold mb-3 text-sm">{t('shop.priceRange')} ({t('common.currencySymbolInr')})</h4>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">{t('shop.min')}</label>
                    <input
                      type="number"
                      min={priceRange[0]}
                      max={priceRange[1]}
                      value={minPrice}
                      onChange={(e)=> setMinPrice(Math.min(Number(e.target.value || 0), maxPrice))}
                      className="w-full px-2 py-2 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">{t('shop.max')}</label>
                    <input
                      type="number"
                      min={priceRange[0]}
                      max={priceRange[1]}
                      value={maxPrice}
                      onChange={(e)=> setMaxPrice(Math.max(Number(e.target.value || 0), minPrice))}
                      className="w-full px-2 py-2 border border-gray-300 rounded text-sm"
                    />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="range"
                    min={priceRange[0]}
                    max={priceRange[1]}
                    value={minPrice}
                    onChange={(e) => setMinPrice(Math.min(Number(e.target.value), maxPrice))}
                    className="w-full accent-green-600"
                  />
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="range"
                    min={priceRange[0]}
                    max={priceRange[1]}
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Math.max(Number(e.target.value), minPrice))}
                    className="w-full accent-green-600"
                  />
                </div>
                <button
                  onClick={() => { setMinPrice(priceRange[0]); setMaxPrice(priceRange[1]); }}
                  className="text-xs mt-2 text-blue-600 hover:underline"
                >
                  {t('shop.resetPrice')}
                </button>
              </div>

              {/* Additional Filters */}
              <div className="grid grid-cols-1 gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="accent-green-600" checked={inStockOnly} onChange={(e)=> setInStockOnly(e.target.checked)} />
                  {t('shop.inStockOnly', { default: 'In stock only' })}
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="accent-green-600" checked={discountOnly} onChange={(e)=> setDiscountOnly(e.target.checked)} />
                  {t('shop.discountOnly', { default: 'Discounted products' })}
                </label>
                {availableUnits.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2 text-sm">{t('shop.unit', { default: 'Unit' })}</h4>
                    <select value={unitFilter} onChange={(e)=> setUnitFilter(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded text-sm">
                      <option value="">{t('shop.all', { default: 'All' })}</option>
                      {availableUnits.map((u) => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Sort */}
              <div>
                <h4 className="font-semibold mb-2 text-sm">{t('shop.sortBy', { default: 'Sort By' })}</h4>
                <div className="relative">
                  <FaSort className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <select
                    value={sortBy}
                    onChange={(e)=> setSortBy(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded text-sm"
                  >
                    <option value="newest">{t('shop.sort.newest', { default: 'Newest' })}</option>
                    <option value="price_asc">{t('shop.sort.priceLowToHigh', { default: 'Price: Low to High' })}</option>
                    <option value="price_desc">{t('shop.sort.priceHighToLow', { default: 'Price: High to Low' })}</option>
                    <option value="rating_desc">{t('shop.sort.rating', { default: 'Rating' })}</option>
                  </select>
                </div>
              </div>
            </aside>

            {/* Main content with top controls and product grid */}
            <section ref={productScrollRef} className="flex-1 flex flex-col overflow-y-auto pb-4 scroll-hide">
              {/* Top controls (mobile/desktop) */}
              <div className="mb-4 bg-white/90 rounded-2xl shadow border border-gray-200 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <FaFilter className="text-green-600" />
                  <span>{t('shop.refineSearch', { default: 'Refine your search' })}</span>
                  {searchQuery && (
                    <span className="ml-2 text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">{t('shop.queryLabel', { default: 'Query' })}: "{searchQuery}"</span>
                  )}
                  {categoryFilter && (
                    <span className="ml-2 text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full">{t('shop.categoryLabel', { default: 'Category' })}: {categories.find(c=> String(c.id)===String(categoryFilter))?.name || categoryFilter}</span>
                  )}
                  {inStockOnly && (<span className="ml-2 text-xs px-2 py-1 bg-teal-100 text-teal-700 rounded-full">{t('shop.inStock', { default: 'In Stock' })}</span>)}
                  {discountOnly && (<span className="ml-2 text-xs px-2 py-1 bg-pink-100 text-pink-700 rounded-full flex items-center gap-1"><FaTag /> {t('shop.discount', { default: 'Discount' })}</span>)}
                  {unitFilter && (<span className="ml-2 text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full">{unitFilter}</span>)}
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <FaSort className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <select
                      value={sortBy}
                      onChange={(e)=> setSortBy(e.target.value)}
                      className="pl-10 pr-3 py-2 border border-gray-300 rounded text-sm bg-white"
                    >
                      <option value="newest">{t('shop.sort.newest', { default: 'Newest' })}</option>
                      <option value="price_asc">{t('shop.sort.priceLowToHigh', { default: 'Price: Low to High' })}</option>
                      <option value="price_desc">{t('shop.sort.priceHighToLow', { default: 'Price: High to Low' })}</option>
                      <option value="rating_desc">{t('shop.sort.rating', { default: 'Rating' })}</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Product Grid: 4 columns on lg+ */}
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-5">
                {finalList.length ? (
                  finalList.map((product) => (
                    <div
                      key={product.id}
                      className="group bg-white rounded-2xl shadow-md hover:shadow-2xl transition-shadow duration-300 border border-gray-100 overflow-hidden"
                    >
                      <Link href={`/shop/${product.id}`}>
                        <div className="relative h-44 sm:h-48 overflow-hidden bg-gray-100">
                          {product.images && product.images[0] ? (
                            <Image
                              src={product.images[0]}
                              alt={product.title}
                              fill
                              className="object-cover "
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <div className="text-center">
                                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-2">
                                  <span className="text-3xl">🌱</span>
                                </div>
                                <span className="text-gray-400 text-sm">{t('common.noImage')}</span>
                              </div>
                            </div>
                          )}

                          {/* Badges */}
                          {Number(product.inventory) <= 0 && (
                            <div className="absolute top-3 left-3 bg-red-600 text-white text-xs px-3 py-1 rounded-full font-semibold shadow-lg">
                              {t('common.outOfStock')}
                            </div>
                          )}
                          {String(product.discountType) !== 'none' && Number(product.inventory) > 0 && (
                            <div className="absolute top-3 right-3 bg-gradient-to-r from-red-500 to-pink-600 text-white text-xs px-3 py-1 rounded-full font-semibold shadow-lg flex items-center gap-1">
                              <FaTag /> {t('shop.sale', { default: 'SALE' })}
                            </div>
                          )}
                        </div>
                      </Link>

                      {/* Product Info */}
                      <div className="p-3">
                        <Link href={`/shop/${product.id}`}>
                          <h3 className="font-semibold text-gray-800 mb-1.5 line-clamp-1 group-hover:text-green-600 transition-colors">
                            {product.title}
                          </h3>
                        </Link>

                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <div className="flex-1">
                            {product.Producer?.businessName && (
                              <p className="text-gray-500 line-clamp-1">
                                {t('home.categoryProducts.byProducer')} {product.Producer.businessName}
                              </p>
                            )}
                            {product.distance !== undefined && product.distance !== null && (
                              <p className={`font-medium flex items-center gap-1 mt-0.5 ${
                                product.rangeKm && product.distance > product.rangeKm 
                                  ? 'text-red-600' 
                                  : 'text-green-600'
                              }`}>
                                <FaMapMarkerAlt className="text-xs" />
                                {product.distance < 1 
                                  ? `${(product.distance * 1000).toFixed(0)}m away`
                                  : `${product.distance.toFixed(1)}km away`
                                }
                              </p>
                            )}
                          </div>
                          {Number(product.averageRating || 0) > 0 && (
                            <div className="flex items-center gap-1">
                              <svg className="w-3.5 h-3.5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              <span className="text-gray-700 font-medium">{Number(product.averageRating).toFixed(1)}</span>
                              <span className="text-gray-500">({product.totalReviews || 0})</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-end justify-between mb-1.5">
                          <div className="flex flex-col">
                            <span className="text-green-600 font-bold text-lg">₹{Number(product.price || 0).toFixed(2)}</span>
                            <span className="text-[10px] text-gray-500">{t('shop.per')} {product.unitSize || 1} {product.unitLabel || 'unit'}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <Link href={`/shop/${product.id}`} className="text-sm text-blue-600 hover:underline">
                            {t('shop.viewDetails')}
                          </Link>
                          <button
                            className={`${Number(product.inventory) <= 0 ? 'px-3 py-2 rounded-lg bg-gray-200 text-gray-400 cursor-not-allowed' : 'px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white transition'}`}
                            title={Number(product.inventory) <= 0 ? t('common.outOfStock') : t('common.addToCart')}
                            disabled={Number(product.inventory) <= 0}
                            onClick={async () => {
                              if (Number(product.inventory) <= 0) return;
                              const { addToCart } = await import('@/lib/api/cart');
                              try {
                                await addToCart(product.id, 1);
                                try {
                                  const { getCart } = await import('@/lib/api/cart');
                                  const cart = await getCart();
                                  const count = Array.isArray(cart?.CartItems) ? cart.CartItems.length : 0;
                                  localStorage.setItem('cartCount', String(count));
                                  window.dispatchEvent(new Event('cartCountUpdate'));
                                } catch {}
                                toast.success(t('cart.addedToCart'));
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
                  ))
                ) : (
                  <p className="col-span-full text-center text-gray-500">
                    {t('shop.noProducts')}
                  </p>
                )}
              </div>

              {/* Infinite scroll sentinel */}
              <div ref={loadMoreRef} className="h-1" />
              {pageLoading && products.length > 0 && (
                <div className="mt-4 flex justify-center">
                  <Loader />
                </div>
              )}
            </section>
          </div>
        )}
      </div>

      <style jsx global>{`
        .scroll-hide {
          -ms-overflow-style: none; /* IE and Edge */
          scrollbar-width: none; /* Firefox */
        }
        .scroll-hide::-webkit-scrollbar {
          display: none; /* Chrome, Safari, Opera */
        }
        /* Rounded scrollbar for filter sidebar */
        .custom-scroll-rounded::-webkit-scrollbar {
          width: 10px;
        }
        .custom-scroll-rounded::-webkit-scrollbar-track {
          background: #f3f4f6; /* gray-100 */
          border-radius: 9999px; /* fully rounded */
        }
        .custom-scroll-rounded::-webkit-scrollbar-thumb {
          background: #a7f3d0; /* emerald-200 */
          border-radius: 9999px;
          border: 2px solid #f3f4f6; /* creates padding look */
        }
        .custom-scroll-rounded::-webkit-scrollbar-thumb:hover {
          background: #6ee7b7; /* emerald-300 */
        }
      `}</style>
    </div>
  );
}
