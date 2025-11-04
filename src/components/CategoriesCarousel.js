'use client';

import { useState, useEffect, useRef } from "react";
import Loader from "@/components/Loader";
import Image from "next/image";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";

export default function CategoriesCarousel({ categories = [] }) {
  const [isMounted, setIsMounted] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState([]);

  // Embla + Autoplay
  const autoplayRef = useRef(
    Autoplay({
      delay: 5000,
      stopOnInteraction: true,
      stopOnMouseEnter: true,
    })
  );

  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      align: "start",
      slidesToScroll: 1,
    },
    [autoplayRef.current]
  );

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const displayCategories = categories.length < 12 
    ? [...categories, ...categories, ...categories] 
    : categories;

  // Track selected snap and total snaps
  useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => {
      setSelectedIndex(emblaApi.selectedScrollSnap());
    };

    setScrollSnaps(emblaApi.scrollSnapList());
    onSelect();
    emblaApi.on("select", onSelect);

    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  if (!isMounted) {
    return (
      <div className="flex justify-center py-10">
        <Loader size={10} />
      </div>
    );
  }

  const hasMultiplePages = (scrollSnaps?.length || 0) > 1;
  const originalPageCount = Math.ceil(categories.length / 6);

  return (
    <div className="relative w-full max-w-6xl mx-auto px-4 py-4">
      <div
        className="embla relative overflow-hidden"
        ref={emblaRef}
        onMouseEnter={() => autoplayRef.current?.stop?.()}
        onMouseLeave={() => autoplayRef.current?.play?.()}
      >
        <div className="flex -ml-1">
          {displayCategories.map((cat, idx) => (
            <div
              key={`${cat.id}-${idx}`}
              className="pl-1 flex-[0_0_calc(100%/3)] sm:flex-[0_0_calc(100%/6)] min-w-0"
            >
              <Link
                href={`/shop?category=${cat.id}`}
                className="w-[92%] sm:w-[85%] mx-auto flex flex-col items-center bg-white rounded-xl shadow p-4 h-40 sm:h-44 justify-between border border-gray-100 hover:shadow-lg cursor-pointer transition-shadow duration-200"
                title={`View all ${cat.name}`}
              >
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center mb-2 shadow-inner">
                  <Image
                    src={cat.photo}
                    alt={cat.name}
                    className="w-full h-full object-cover"
                    width={120}
                    height={120}
                  />
                </div>
                <div className="text-center px-2 min-w-0 w-full">
                  <div className="text-sm sm:text-base font-semibold text-gray-800 mb-1 truncate">
                    {cat.name}
                  </div>
                  <div className="text-xs sm:text-sm text-green-600 font-medium">Shop Now →</div>
                </div>
              </Link>
            </div>
          ))}
        </div>



      </div>

      {hasMultiplePages && (
        <div className="pointer-events-none select-none absolute top-1/2 translate-y-[calc(-50%-12px)] left-0 right-0 sm:-left-4 sm:-right-4 lg:-left-8 lg:-right-8 z-10 flex items-center justify-between">
          <button
            type="button"
            aria-label="Previous categories"
            onClick={() => {
              emblaApi?.scrollPrev();
              autoplayRef.current?.reset?.();
            }}
            className="pointer-events-auto inline-flex items-center justify-center h-10 w-10 rounded-full bg-white/90 border border-gray-200 text-gray-700 shadow-lg hover:bg-white transition-colors duration-200 backdrop-blur-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
              <path fillRule="evenodd" d="M15.78 3.22a.75.75 0 010 1.06L9.06 11l6.72 6.72a.75.75 0 11-1.06 1.06l-7.25-7.25a.75.75 0 010-1.06l7.25-7.25a.75.75 0 011.06 0z" clipRule="evenodd" />
            </svg>
          </button>
          <button
            type="button"
            aria-label="Next categories"
            onClick={() => {
              emblaApi?.scrollNext();
              autoplayRef.current?.reset?.();
            }}
            className="pointer-events-auto inline-flex items-center justify-center h-10 w-10 rounded-full bg-white/90 border border-gray-200 text-gray-700 shadow-lg hover:bg-white transition-colors duration-200 backdrop-blur-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
              <path fillRule="evenodd" d="M8.22 20.78a.75.75 0 010-1.06L14.94 13 8.22 6.28a.75.75 0 111.06-1.06l7.25 7.25a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}

      {hasMultiplePages && originalPageCount > 1 && (
        <div className="flex justify-center mt-6 space-x-2">
          {Array.from({ length: originalPageCount }).map((_, i) => (
            <button
              key={i}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                (selectedIndex % originalPageCount) === i ? "bg-green-600" : "bg-gray-300"
              }`}
              onClick={() => {
                emblaApi?.scrollTo(i);
                autoplayRef.current?.reset?.();
              }}
              aria-label={`Go to page ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
