"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import CircleSpinner from "@/components/CircleSpinner";

export default function DocumentViewerModal({ open, images = [], initialIndex = 0, onClose }) {
  const [index, setIndex] = useState(initialIndex || 0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    setIndex(initialIndex || 0);
    setLoading(true);
  }, [open, initialIndex]);

  if (!open || !Array.isArray(images) || images.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
      <button
        className="absolute top-4 right-4 text-white text-2xl hover:text-gray-300 z-10 bg-black/50 rounded-full p-2"
        onClick={onClose}
        aria-label="Close viewer"
      >
        ✕
      </button>

      <div className="relative max-w-4xl max-h-[90vh] w-full flex items-center justify-center">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <CircleSpinner />
          </div>
        )}

        <div className="relative w-full h-full flex items-center justify-center">
          <Image
            src={images[index]}
            alt={`document-${index}`}
            width={1200}
            height={900}
            className={`max-w-full max-h-[80vh] object-contain rounded-lg transition-opacity duration-300 ${
              loading ? "opacity-0" : "opacity-100"
            }`}
            onLoad={() => setLoading(false)}
          />
        </div>

        {images.length > 1 && (
          <>
            {index > 0 && (
              <button
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-3xl bg-black/50 hover:bg-black/70 rounded-full p-3 transition-all"
                onClick={() => {
                  setIndex((prev) => Math.max(prev - 1, 0));
                  setLoading(true);
                }}
                aria-label="Previous"
              >
                ‹
              </button>
            )}
            {index < images.length - 1 && (
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-3xl bg-black/50 hover:bg-black/70 rounded-full p-3 transition-all"
                onClick={() => {
                  setIndex((prev) => Math.min(prev + 1, images.length - 1));
                  setLoading(true);
                }}
                aria-label="Next"
              >
                ›
              </button>
            )}
          </>
        )}

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full text-sm">
          {index + 1} / {images.length}
        </div>
      </div>
    </div>
  );
}
