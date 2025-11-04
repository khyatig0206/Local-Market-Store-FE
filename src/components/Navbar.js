"use client";
import Link from "next/link";
import {useTranslations} from "next-intl";
import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname, useRouter } from 'next/navigation';
import { FiSearch, FiUser, FiShoppingCart, FiMenu, FiX, FiHeart } from "react-icons/fi";
import { FaLeaf, FaTractor, FaFish, FaSeedling, FaStore, FaStar } from "react-icons/fa";
import { instantSearch } from "@/lib/api/search";
import Image from "next/image";

function NavbarSearch() {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const inputRef = useRef();
  const dropdownRef = useRef();
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // Debounced search
  const debounceTimer = useRef(null);

  const performSearch = useCallback(async (query) => {
    if (!query || query.trim().length < 2) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    setLoading(true);
    try {
      const data = await instantSearch(query, 5);
      setResults(data);
      setShowDropdown(data.length > 0);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearch(value);
    setSelectedIndex(-1);

    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Set new timer for debounced search
    debounceTimer.current = setTimeout(() => {
      performSearch(value);
    }, 300);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (search.trim()) {
      setShowDropdown(false);
      router.push(`/shop?q=${encodeURIComponent(search.trim())}`);
    }
  };

  const handleResultClick = (productId) => {
    setShowDropdown(false);
    setSearch("");
    router.push(`/shop/${productId}`);
  };

  const handleKeyDown = (e) => {
    if (!showDropdown || results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      handleResultClick(results[selectedIndex].id);
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Clear search on route change
  useEffect(() => {
    setShowDropdown(false);
  }, [pathname]);

  const stripHtmlTags = (html) => {
    return html.replace(/<mark>/g, '').replace(/<\/mark>/g, '');
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <form onSubmit={handleSubmit} className="relative w-full">
        <input
          ref={inputRef}
          type="text"
          value={search}
          onChange={handleSearchChange}
          onKeyDown={handleKeyDown}
          placeholder={t('search.placeholder')}
          className="w-full pl-4 pr-12 py-2 border-2 border-green-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-700 bg-white/80 backdrop-blur-sm transition-all duration-300"
          autoComplete="off"
        />
        <button 
          type="submit" 
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-600 hover:text-green-700 hover:scale-110 transition-all duration-200"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
          ) : (
            <FiSearch size={20} />
          )}
        </button>
      </form>

      {/* Search Results Dropdown */}
      {showDropdown && results.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-white border-2 border-green-200 rounded-2xl shadow-2xl overflow-hidden z-50 max-h-[480px] overflow-y-auto">
          {results.map((product, index) => (
            <button
              key={product.id}
              onClick={() => handleResultClick(product.id)}
              className={`w-full flex items-center gap-3 p-3 hover:bg-green-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                selectedIndex === index ? 'bg-green-50' : ''
              }`}
            >
              {/* Product Image */}
              <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                {product.images && product.images[0] ? (
                  <Image
                    src={product.images[0]}
                    alt={stripHtmlTags(product.title)}
                    width={64}
                    height={64}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <FaLeaf size={24} />
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="flex-1 text-left min-w-0">
                <h4 
                  className="font-semibold text-gray-900 text-sm line-clamp-1"
                  dangerouslySetInnerHTML={{ __html: product.title }}
                />
                <div className="flex items-center gap-2 mt-1">
                  {product.producerBusinessName && (
                    <span className="text-xs text-gray-500 truncate">
                      by {product.producerBusinessName}
                    </span>
                  )}
                  {product.categoryName && (
                    <span className="text-xs text-gray-400">• {product.categoryName}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-green-600 font-bold text-sm">
                    ₹{Number(product.price).toFixed(2)}
                  </span>
                  {product.averageRating > 0 && (
                    <div className="flex items-center gap-1">
                      <FaStar className="text-yellow-400 w-3 h-3" />
                      <span className="text-xs text-gray-600">{product.averageRating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}

          {/* View All Results */}
          <button
            onClick={handleSubmit}
            className="w-full p-3 text-center text-green-600 hover:bg-green-50 font-semibold text-sm border-t-2 border-green-200"
          >
            View all results for "{search}"
          </button>
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const t = useTranslations();
  const [menuOpen, setMenuOpen] = useState(false);
  const [localeUI, setLocaleUI] = useState('en');
  const [searchOpen, setSearchOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [showAnnouncement, setShowAnnouncement] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const hideTimeout = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setShowAnnouncement(window.scrollY < 10);
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    try { setLocaleUI(localStorage.getItem('locale') || 'en'); } catch {}
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("userToken");
    const username = localStorage.getItem("username");
    if (token && username) {
      setUser({ username });
    } else {
      setUser(null);
    }
  }, []);

  const [cartCount, setCartCount] = useState(0);
  useEffect(() => {
    setCartCount(parseInt(localStorage.getItem('cartCount') || '0', 10));
    const handler = () => {
      setCartCount(parseInt(localStorage.getItem('cartCount') || '0', 10));
    };
    window.addEventListener('cartCountUpdate', handler);
    return () => window.removeEventListener('cartCountUpdate', handler);
  }, []);

  useEffect(() => {
    const updateFromStorage = () => {
      try {
        const token = localStorage.getItem("userToken");
        const username = localStorage.getItem("username");
        if (token && username) {
          setUser({ username });
        } else {
          setUser(null);
          try { localStorage.setItem('cartCount', '0'); } catch {}
          setCartCount(0);
          try { window.dispatchEvent(new Event('cartCountUpdate')); } catch {}
        }
      } catch {
        setUser(null);
        try { localStorage.setItem('cartCount', '0'); } catch {}
        setCartCount(0);
        try { window.dispatchEvent(new Event('cartCountUpdate')); } catch {}
      }
    };
    window.addEventListener('authUpdate', updateFromStorage);
    window.addEventListener('storage', updateFromStorage);
    window.addEventListener('focus', updateFromStorage);
    return () => {
      window.removeEventListener('authUpdate', updateFromStorage);
      window.removeEventListener('storage', updateFromStorage);
      window.removeEventListener('focus', updateFromStorage);
    };
  }, []);

  return (
    <header className={`w-full bg-white backdrop-blur-md border-b border-green-100 sticky top-0 z-50 transition-all duration-500 ${
      scrolled ? 'shadow-xl' : 'shadow-lg'
    }`}>
      {/* Top Announcement Bar */}
      <div
        className={`bg-gradient-to-r from-green-600 to-emerald-600 text-white text-center px-4 text-sm transition-all duration-500 overflow-hidden ${
          showAnnouncement ? 'opacity-100 max-h-10 py-2' : 'opacity-0 max-h-0 py-0'
        }`}
        style={{ willChange: 'opacity, max-height, padding' }}
      >
        <div className="flex items-center justify-center space-x-2">
          <FaSeedling className="text-green-200" />
          <span className="font-medium">{t('announcement')}</span>
          <FaSeedling className="text-green-200" />
        </div>
      </div>

      {/* Main Navigation */}
      <div className="max-w-7xl mx-auto px-2 sm:px-6">
        <div className="flex items-center h-16 justify-between gap-4">
          {/* Section 1: Logo and Categories */}
          <div className="flex items-center gap-6 min-w-fit">
            {/* Logo with PNG image only */}
            <Link href={`/`} className="flex items-center group">
              <div className="relative flex items-center justify-center">
                <Image
                  src="/icons/pallihaat.png"
                  alt="Pallihaat Logo"
                  width={160}  // Increased for better clarity
                  height={80}   // Adjusted height
                  className="w-auto h-10 object-contain transition-transform duration-300 group-hover:scale-105"
                  priority
                  quality={100} // Ensure highest quality
                  style={{
                    filter: 'brightness(1.1) contrast(1.1)', // Enhance clarity
                  }}
                />
              </div>
            </Link>

            <nav className="hidden lg:flex space-x-1">
              {[
                { href: '/shop?category=1', icon: FaTractor, text: t('nav.agri') },
                { href: '/shop?category=2', icon: FaLeaf, text: t('nav.horti') },
                { href: '/shop?category=3', icon: FaFish, text: t('nav.aqua') },
                { href: '/producer/signin', icon: FaStore, text: t('nav.sell') }
              ].map((item, index) => (
                <Link 
                  key={index}
                  href={item.href} 
                  className="flex items-center px-2 py-2 rounded-xl text-gray-700 hover:text-green-700 hover:bg-green-50 transition-all duration-300 group"
                >
                  <item.icon className="mr-2 text-green-600 group-hover:scale-110 transition-transform" />
                  <span className="font-medium">{item.text}</span>
                </Link>
              ))}
            </nav>
          </div>

          {/* Section 2: Search Bar */}
          <div className="hidden md:flex flex-1 max-w-3xl mx-4">
            <NavbarSearch />
          </div>

          {/* Section 3: Action Buttons */}
          <div className="flex items-center min-w-fit gap-4">
            {/* Cart */}
            <Link href={`/cart`} className="relative text-gray-600 hover:text-green-700 transition-all duration-300 hover:scale-110" title={t('nav.cart')}>
              <FiShoppingCart size={32} />
              <span className="absolute -top-2 -right-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold shadow-lg">
                {cartCount}
              </span>
            </Link>

            {/* Language Switcher */}
            <select
              aria-label="Language"
              className="hidden sm:block border-2 border-green-200 text-green-700 rounded-xl px-3 py-2 text-sm bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300"
              value={localeUI}
              onChange={(e) => {
                const l = e.target.value;
                setLocaleUI(l);
                try { document.cookie = `locale=${l}; path=/; max-age=31536000`; } catch {}
                try { localStorage.setItem('locale', l); } catch {}
                window.location.reload();
              }}
            >
              <option value="en">EN</option>
              <option value="hi">हिं</option>
              <option value="or">ଓଡ଼ିଆ</option>
            </select>

            {/* Mobile Search Button */}
            <button 
              className="md:hidden text-gray-600 hover:text-green-700 transition-all duration-300 hover:scale-110"
              onClick={() => setSearchOpen(!searchOpen)}
              aria-label="Search"
            >
              <FiSearch size={22} />
            </button>

            {/* User Section */}
            {user ? (
              <div
                className="hidden sm:flex items-center relative"
                onMouseEnter={() => {
                  clearTimeout(hideTimeout.current);
                  setDropdownOpen(true);
                }}
                onMouseLeave={() => {
                  hideTimeout.current = setTimeout(() => setDropdownOpen(false), 200);
                }}
              >
                <button className="flex items-center space-x-2 bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-2 rounded-2xl border-2 border-green-200 text-green-700 hover:shadow-lg transition-all duration-300 group">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                    <FiUser className="text-white text-sm" />
                  </div>
                  <span className="font-medium text-sm">{user.username}</span>
                  <svg
                    className="w-4 h-4 transform group-hover:rotate-180 transition-transform duration-300"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 top-12 w-56 bg-white backdrop-blur-md border-2 border-green-200 rounded-2xl shadow-2xl z-50 overflow-hidden">
                    <div className="p-2">
                      <Link
                        href="/account"
                        className="flex items-center px-4 py-3 text-gray-700 hover:bg-green-50 hover:text-green-700 rounded-xl transition-all duration-200"
                      >
                        <FiUser className="mr-3 text-green-600" />
                        {t('nav.account')}
                      </Link>
                      <Link
                        href="/orders"
                        className="flex items-center px-4 py-3 text-gray-700 hover:bg-green-50 hover:text-green-700 rounded-xl transition-all duration-200"
                      >
                        <FiShoppingCart className="mr-3 text-green-600" />
                        {t('nav.myOrders')}
                      </Link>
                      
                      <div className="border-t border-green-100 my-1"></div>
                      <button
                        onClick={() => {
                          localStorage.removeItem("userToken");
                          localStorage.removeItem("username");
                          try { localStorage.removeItem("cartCount"); } catch {}
                          try { window.dispatchEvent(new Event('cartCountUpdate')); } catch {}
                          try { window.dispatchEvent(new Event('authUpdate')); } catch {}
                          window.location.reload();
                        }}
                        className="flex items-center w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200"
                      >
                        <svg className="mr-3 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        {t('nav.logout')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden sm:flex items-center space-x-3">
                <Link href={`/signin`} className="flex items-center px-4 py-2 rounded-2xl border-2 border-green-600 text-green-700 hover:bg-green-50 font-semibold transition-all duration-300 hover:shadow-lg">
                  <span className="text-sm">{t('nav.signIn')}</span>
                </Link>
                <Link href={`/signup`} className="flex items-center px-4 py-2 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 font-semibold transition-all duration-300 hover:shadow-lg transform hover:scale-105">
                  <span className="text-sm">{t('nav.signUp')}</span>
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden text-gray-600 hover:text-green-700 ml-2 transition-all duration-300 hover:scale-110"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Menu"
            >
              {menuOpen ? <FiX size={26} /> : <FiMenu size={26} />}
            </button>
          </div>
        </div>

        {/* Mobile Search */}
        {searchOpen && (
          <div className="md:hidden my-4">
            <NavbarSearch />
          </div>
        )}
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="lg:hidden bg-white backdrop-blur-md border-t border-green-100 shadow-2xl">
          <nav className="px-4 py-6 space-y-2">
            {[
              { href: '/shop?category=1', icon: FaTractor, text: t('nav.agri') },
              { href: '/shop?category=10', icon: FaLeaf, text: t('nav.horti') },
              { href: '/shop?category=9', icon: FaFish, text: t('nav.aqua') },
              { href: '/producer/signin', icon: FaStore, text: t('nav.sell') }
            ].map((item, index) => (
              <Link 
                key={index}
                href={item.href} 
                className="flex items-center px-4 py-3 rounded-2xl text-gray-700 hover:bg-green-50 hover:text-green-700 transition-all duration-300 group"
                onClick={() => setMenuOpen(false)}
              >
                <item.icon className="mr-3 text-green-600 text-lg" />
                <span className="font-medium text-base">{item.text}</span>
              </Link>
            ))}
            
            <div className="border-t border-green-100 pt-4 mt-4">
              {user ? (
                <>
                  <div className="px-4 py-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl mb-3">
                    <p className="text-sm text-gray-600">Welcome back</p>
                    <p className="font-semibold text-green-700">{user.username}</p>
                  </div>
                  {[
                    { href: '/account', icon: FiUser, text: t('nav.account') },
                    { href: '/orders', icon: FiShoppingCart, text: t('nav.myOrders') },
                    { href: '/wishlist', icon: FiHeart, text: t('nav.wishlist') }
                  ].map((item, index) => (
                    <Link 
                      key={index}
                      href={item.href} 
                      className="flex items-center px-4 py-3 rounded-xl text-gray-700 hover:bg-green-50 hover:text-green-700 transition-all duration-200"
                      onClick={() => setMenuOpen(false)}
                    >
                      <item.icon className="mr-3 text-green-600" />
                      <span>{item.text}</span>
                    </Link>
                  ))}
                  <button
                    onClick={() => {
                      localStorage.removeItem("userToken");
                      localStorage.removeItem("username");
                      try { localStorage.removeItem("cartCount"); } catch {}
                      try { window.dispatchEvent(new Event('cartCountUpdate')); } catch {}
                      try { window.dispatchEvent(new Event('authUpdate')); } catch {}
                      setMenuOpen(false);
                      window.location.reload();
                    }}
                    className="flex items-center w-full text-left px-4 py-3 rounded-xl bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 mt-2 transition-all duration-200"
                  >
                    <svg className="mr-3 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    {t('nav.logout')}
                  </button>
                </>
              ) : (
                <div className="space-y-3">
                  <Link 
                    href="/signin" 
                    className="flex items-center justify-center px-4 py-3 rounded-2xl border-2 border-green-600 text-green-700 hover:bg-green-50 font-semibold transition-all duration-300"
                    onClick={() => setMenuOpen(false)}
                  >
                    {t('nav.signIn')}
                  </Link>
                  <Link 
                    href="/signup" 
                    className="flex items-center justify-center px-4 py-3 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 font-semibold transition-all duration-300"
                    onClick={() => setMenuOpen(false)}
                  >
                    {t('nav.signUp')}
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}