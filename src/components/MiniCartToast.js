"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import { getCart } from "@/lib/api/cart";
import {useTranslations} from "next-intl";
import { useRouter } from "next/navigation";

const DISPLAY_MS = 6000; // 12 seconds

export default function MiniCartToast() {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [progress, setProgress] = useState(0); // 0..1
  const [hovered, setHovered] = useState(false);

  const router = useRouter();

  const hideToRef = useRef(null);
  const tickRef = useRef(null);
  const remainingRef = useRef(DISPLAY_MS);
  const startedAtRef = useRef(0);

  const clearTimers = useCallback(() => {
    if (hideToRef.current) clearTimeout(hideToRef.current);
    if (tickRef.current) clearInterval(tickRef.current);
    hideToRef.current = null;
    tickRef.current = null;
  }, []);

  const startTimers = useCallback(() => {
    startedAtRef.current = Date.now();
    clearTimers();
    hideToRef.current = setTimeout(() => {
      setOpen(false);
    }, remainingRef.current);
    tickRef.current = setInterval(() => {
      const elapsed = Date.now() - startedAtRef.current;
      const remain = Math.max(0, remainingRef.current - elapsed);
      setProgress(1 - remain / DISPLAY_MS);
    }, 100);
  }, [clearTimers]);

  useEffect(() => {
    const handler = async (e) => {
      try {
        const cart = await getCart();
        const list = Array.isArray(cart?.CartItems) ? cart.CartItems : [];
        const pid = e?.detail?.productId;
        const reordered = pid != null
          ? [...list.filter(it => it.productId === pid), ...list.filter(it => it.productId !== pid)]
          : list;
        setItems(reordered);
        const t = reordered.reduce((sum, it) => sum + (it?.Product?.price || 0) * (it?.quantity || 0), 0);
        setTotal(t);
        setOpen(true);
        setProgress(0);
        remainingRef.current = DISPLAY_MS;
        startTimers();
      } catch {}
    };
    window.addEventListener("cart:item-added", handler);
    return () => {
      window.removeEventListener("cart:item-added", handler);
      clearTimers();
    };
  }, [startTimers, clearTimers]);

  if (!open) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[60]">
      <div
        className="w-[340px] max-h-[50vh] bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden flex flex-col min-h-0"
        onMouseEnter={() => {
          if (hovered) return;
          setHovered(true);
          // pause timers
          const elapsed = Date.now() - startedAtRef.current;
          remainingRef.current = Math.max(0, remainingRef.current - elapsed);
          clearTimers();
        }}
        onMouseLeave={() => {
          setHovered(false);
          // resume timers
          if (remainingRef.current > 0) startTimers();
        }}
      >
        <div className="px-3 py-2 bg-green-600 text-white text-sm font-semibold flex items-center justify-between flex-none">
          <span>{t('cart.addedToCart')}</span>
          <button
            aria-label="Close"
            className="text-white/90 hover:text-white text-lg leading-none"
            onClick={() => { clearTimers(); setOpen(false); }}
          >
            ×
          </button>
        </div>
        <div className="p-3 flex-1 min-h-0 max-h-full overflow-y-auto">
          {items.length === 0 ? (
            <div className="text-sm text-gray-600">{t('cart.updated')}</div>
          ) : (
            <ul className="space-y-2">
              {items.map((it) => (
                <li key={it.productId} className="flex items-center gap-2">
                  <Image src={it.Product?.images?.[0] || '/placeholder.png'} alt={it.Product?.title || 'Product'} width={40} height={40} className="w-10 h-10 rounded border object-cover" />
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-800 truncate">{it.Product?.title}</div>
                    <div className="text-xs text-gray-500">Qty {it.quantity} · ₹{it.Product?.price}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="px-3 pb-3 flex items-center justify-between flex-none">
          <div className="text-sm text-gray-700"><span className="font-semibold text-gray-900">{t('common.total')}:</span> ₹{total}</div>
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-1 rounded border text-gray-700 hover:bg-gray-50 text-sm"
              onClick={() => { clearTimers(); setOpen(false); router.push('/cart'); }}
            >{t('cart.viewCart')}</button>
            <button
              className="px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700 text-sm"
              onClick={() => { clearTimers(); setOpen(false); router.push('/cart?checkout=1'); }}
            >{t('cart.checkout')}</button>
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-0.5 w-full bg-gray-200 flex-none">
          <div
            className="h-full bg-green-600"
            style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%`, transition: hovered ? 'none' : 'width 100ms linear' }}
          />
        </div>
      </div>
    </div>
  );
}
