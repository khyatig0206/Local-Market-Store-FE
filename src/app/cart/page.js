"use client";
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getCart, updateCartItem, removeCartItem } from '@/lib/api/cart';
import { FiTrash2, FiPlus, FiMinus, FiShoppingBag, FiArrowLeft } from 'react-icons/fi';
import { FaShoppingCart, FaRupeeSign, FaBoxOpen } from 'react-icons/fa';
import CheckoutModal from '@/components/CheckoutModal';
import { toast } from 'react-toastify';
import {useTranslations} from 'next-intl';
import { useRouter } from 'next/navigation';
import { placeOrder, verifyPayment } from '@/lib/api/orders';

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

export default function CartPage() {
  const t = useTranslations();
  const router = useRouter();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  useEffect(() => {
    async function fetchCart() {
      setLoading(true);
      setError(null);
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('userToken') : null;
        if (!token) { router.replace('/'); return; }
        const cart = await getCart();
        setCartItems(cart && cart.CartItems ? cart.CartItems : []);
        try {
          const count = Array.isArray(cart?.CartItems) ? cart.CartItems.length : 0;
          localStorage.setItem('cartCount', String(count));
          window.dispatchEvent(new Event('cartCountUpdate'));
        } catch {}
      } catch (e) {
        router.replace('/');
        return;
      } finally {
        setLoading(false);
      }
    }
    fetchCart();
    try {
      if (typeof window !== 'undefined') {
        const sp = new URLSearchParams(window.location.search);
        if (sp.get('checkout') === '1') setCheckoutOpen(true);
      }
    } catch {}
  }, [router]);

  const handleQuantityChange = async (productId, newQty) => {
    if (newQty < 1) return;
    const current = cartItems.find(i => i.productId === productId);
    const max = Number(current?.Product?.inventory || 0);
    if (max && newQty > max) {
      toast.error(`Only ${max} in stock`);
      return;
    }
    setUpdating(true);
    try {
      await updateCartItem(productId, newQty);
      setCartItems(items => items.map(item => item.productId === productId ? { ...item, quantity: newQty } : item));
    } catch (e) {
      toast.error(t('cartPage.updateQtyFailed'));
    } finally {
      setUpdating(false);
    }
  };

  const handleRemove = async (productId) => {
    setUpdating(true);
    try {
      await removeCartItem(productId);
      const cart = await getCart();
      const items = cart && cart.CartItems ? cart.CartItems : [];
      setCartItems(items);
      const count = Array.isArray(items) ? items.length : 0;
      try { localStorage.setItem('cartCount', String(count)); } catch {}
      try { window.dispatchEvent(new Event('cartCountUpdate')); } catch {}
    } catch (e) {
      toast.error(t('cartPage.removeItemFailed'));
    } finally {
      setUpdating(false);
    }
  };

  const total = cartItems.reduce((sum, item) => sum + (item.Product?.price || 0) * item.quantity, 0);
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 py-4 sm:py-6 px-4">
      {/* Background Pattern */}
      <div className="fixed inset-0 opacity-5 pointer-events-none">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="cart-pattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              <circle cx="20" cy="20" r="2" fill="currentColor" opacity="0.3"/>
              <circle cx="50" cy="50" r="2" fill="currentColor" opacity="0.2"/>
              <circle cx="80" cy="80" r="2" fill="currentColor" opacity="0.3"/>
              <path d="M30 30 L70 30 L70 70 L30 70 Z" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#cart-pattern)" className="text-green-600"/>
        </svg>
      </div>

      <div className="max-w-7xl mx-auto relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                <FaShoppingCart className="text-white text-xl" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-green-800">{t('cartPage.title')}</h1>
                <p className="text-green-600 text-sm md:text-base">
                  {itemCount} {itemCount === 1 ? t('cartPage.itemsLabel') : t('cartPage.itemsLabel')}
                </p>
              </div>
            </div>
          </div>
          
          <Link 
            href="/shop"
            className="hidden sm:flex items-center gap-2 px-6 py-3 rounded-2xl bg-white border border-green-200 text-green-700 hover:bg-green-50 transition-all shadow-sm hover:shadow-md font-medium"
          >
            <FiShoppingBag className="text-lg" />
            {t('cartPage.continueShopping')}
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-green-700 font-medium">Loading your cart...</p>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaBoxOpen className="text-red-600 text-3xl" />
            </div>
            <p className="text-red-600 text-lg font-medium mb-4">Failed to load cart</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : cartItems.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-32 h-32 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaShoppingCart className="text-green-600 text-5xl" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">{t('cartPage.empty')}</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              {t('cartPage.loading')}
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105"
            >
              <FiShoppingBag className="text-xl" />
              {t('orders.goToShop')}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-3xl shadow-lg border border-green-100 overflow-hidden lg:max-h-[70vh] flex flex-col">
                <div className="p-4 border-b border-green-50 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-800">{t('cartPage.cartItemsHeading')}</h2>
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                      {itemCount} {t('cartPage.itemsLabel')}
                    </span>
                  </div>
                </div>
                
                <div className="divide-y divide-green-50 flex-1 overflow-y-auto">
                  {cartItems.map((item, index) => (
                    <div key={item.productId} className="p-4 hover:bg-green-50 transition-colors">
                      <div className="flex gap-3">
                        {/* Product Image */}
                        <Link 
                          href={`/shop/${item.productId}`}
                          className="flex-shrink-0 relative group"
                        >
                          <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden border-2 border-green-200 group-hover:border-green-400 transition-colors">
                            <Image
                              src={item.Product?.images?.[0] || '/placeholder.png'}
                              alt={item.Product?.title || 'Product'}
                              width={96}
                              height={96}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                          </div>
                          {item.quantity > 1 && (
                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                              {item.quantity}
                            </div>
                          )}
                        </Link>

                        {/* Product Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col h-full">
                            <div className="flex-1">
                              <Link 
                                href={`/shop/${item.productId}`}
                                className="font-semibold text-gray-900 hover:text-green-700 transition-colors line-clamp-2 text-lg"
                              >
                                {item.Product?.title}
                              </Link>
                              <p className="text-gray-500 text-sm mt-1">
                                {item.Product?.Category?.name}
                              </p>
                              
                              {/* Stock Status */}
                              <div className="flex items-center gap-2 mt-1">
                                <div className={`w-2 h-2 rounded-full ${
                                  Number(item.Product?.inventory || 0) > 0 
                                    ? 'bg-green-500' 
                                    : 'bg-red-500'
                                }`} />
                                <span className="text-xs text-gray-600">
                                  {Number(item.Product?.inventory || 0) > 0 
                                    ? `${item.Product.inventory} in stock` 
                                    : 'Out of stock'
                                  }
                                </span>
                              </div>
                            </div>

                            {/* Price and Actions */}
                            <div className="flex items-center justify-between mt-3">
                              <div className="flex items-center gap-3">
                                <span className="text-lg font-bold text-green-700 flex items-center">
                                  <FaRupeeSign className="text-sm" />
                                  {item.Product?.price}
                                </span>
                                <span className="text-gray-400 text-sm">
                                  × {item.quantity}
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-3">
                                {/* Quantity Controls */}
                                <div className="flex items-center gap-2 bg-green-50 rounded-2xl px-2 py-1">
                                  <button
                                    className="p-1 rounded-full hover:bg-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                    disabled={updating || item.quantity <= 1}
                                    onClick={() => handleQuantityChange(item.productId, item.quantity - 1)}
                                  >
                                    <FiMinus className="text-green-700" />
                                  </button>
                                  <span className="w-7 text-center font-semibold text-green-900">
                                    {item.quantity}
                                  </span>
                                  <button
                                    className="p-1 rounded-full hover:bg-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                    disabled={updating || (Number(item?.Product?.inventory || 0) > 0 && item.quantity >= Number(item?.Product?.inventory || 0))}
                                    onClick={() => handleQuantityChange(item.productId, item.quantity + 1)}
                                  >
                                    <FiPlus className="text-green-700" />
                                  </button>
                                </div>

                                {/* Remove Button */}
                                <button
                                  className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50"
                                  disabled={updating}
                                  onClick={() => handleRemove(item.productId)}
                                  aria-label="Remove item"
                                >
                                  <FiTrash2 className="text-lg" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Continue Shopping Button - Mobile */}
              <div className="sm:hidden mt-6">
                <Link 
                  href="/shop"
                  className="flex items-center justify-center gap-2 w-full px-6 py-4 rounded-2xl bg-white border border-green-200 text-green-700 hover:bg-green-50 transition-all shadow-sm hover:shadow-md font-medium"
                >
                  <FiShoppingBag className="text-lg" />
                  {t('cartPage.continueShopping')}
                </Link>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-3xl shadow-lg border border-green-100 p-6 sticky top-6">
                <h3 className="text-xl font-bold text-gray-800 mb-6">{t('cartPage.orderSummary')}</h3>
                
                {/* Summary Details */}
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">{t('cartPage.itemsLabel')} ({itemCount})</span>
                    <span className="font-semibold text-gray-900 flex items-center">
                      <FaRupeeSign className="text-sm" />
                      {total}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">{t('cartPage.shipping')}</span>
                    <span className="font-semibold text-green-600">{t('cartPage.free')}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <span>{t('cartPage.deliveryEta')}</span>
                  </div>
                </div>

                {/* Total */}
                <div className="border-t border-green-100 pt-4 mb-6">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span className="text-gray-800">{t('cartPage.totalAmount')}</span>
                    <span className="text-green-700 flex items-center text-xl">
                      <FaRupeeSign className="text-sm" />
                      {total}
                    </span>
                  </div>
                </div>

                {/* Checkout Button */}
                <button
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                  onClick={() => setCheckoutOpen(true)}
                  disabled={updating}
                >
                  {updating ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      {t('cartPage.processing')}
                    </div>
                  ) : (
                    t('cartPage.proceedToCheckout')
                  )}
                </button>

                {/* Security Badge */}
                <div className="text-center mt-6 pt-6 border-t border-green-100">
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                    <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    {t('cartPage.secureCheckout')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Checkout Modal */}
        <CheckoutModal
          open={checkoutOpen}
          onClose={() => setCheckoutOpen(false)}
          title={t('cartPage.checkout')}
          itemsPreview={cartItems.map((item) => ({
            title: item.Product?.title,
            quantity: item.quantity,
            price: Number(item.Product?.price || 0),
            image: item.Product?.images?.[0]
          }))}
          total={Number(total || 0)}
          onConfirm={async ({ addressId, paymentMethod }) => {
            try {
              // Fetch the selected address details for Razorpay prefill
              const { getAddressById } = await import('@/lib/api/addresses');
              let selectedAddress = null;
              try {
                selectedAddress = await getAddressById(addressId);
              } catch (e) {
                console.warn('Could not fetch address details:', e.message);
              }

              const res = await placeOrder({
                addressId,
                paymentMethod
              });

              if (paymentMethod === 'PREPAID' && res?.razorpayOrderId && res?.keyId) {
                const loaded = await loadRazorpay();
                if (!loaded || !window.Razorpay) {
                  toast.error(t('cartPage.paymentGatewayFailed'));
                  setCheckoutOpen(false);
                  return;
                }

                const options = {
                  key: res.keyId,
                  amount: res.amount,
                  currency: res.currency || 'INR',
                  name: 'Marketplace',
                  description: `Order #${res.orderId}`,
                  order_id: res.razorpayOrderId,
                  prefill: selectedAddress ? {
                    name: selectedAddress.contactName,
                    contact: selectedAddress.contactPhone
                  } : {},
                  handler: async function (response) {
                    try {
                      await verifyPayment({
                        orderId: res.orderId,
                        razorpay_order_id: response.razorpay_order_id,
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_signature: response.razorpay_signature
                      });
                      setCartItems([]);
                      try { localStorage.setItem('cartCount', '0'); } catch {}
                      try { window.dispatchEvent(new Event('cartCountUpdate')); } catch {}
                      toast.success(t('cartPage.paymentSuccess'));
                      router.replace('/orders');
                    } catch (err) {
                      toast.error(t('cartPage.paymentVerifyFailed'));
                    } finally {
                      setCheckoutOpen(false);
                    }
                  },
                  modal: {
                    ondismiss: function () {
                      setCheckoutOpen(false);
                      toast.info(t('cartPage.paymentCancelled'));
                    }
                  },
                  theme: { color: '#16a34a' }
                };

                const rzp = new window.Razorpay(options);
                rzp.open();
                return;
              }

              // COD flow
              setCartItems([]);
              try { localStorage.setItem('cartCount', '0'); } catch {}
              try { window.dispatchEvent(new Event('cartCountUpdate')); } catch {}
              toast.success(t('cartPage.orderPlaced'));
              router.replace('/orders');
            } catch (e) {
              if (e?.status === 401 || e?.code === 'UNAUTHORIZED') {
                router.replace('/signin');
                return;
              }
              toast.error(t('cartPage.orderFailed'));
            } finally {
              setCheckoutOpen(false);
            }
          }}
        />
      </div>
    </div>
  );
}