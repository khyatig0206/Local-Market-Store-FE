'use client'
import Image from "next/image";
import {useTranslations} from 'next-intl';
import { useState, useEffect, useCallback } from "react";
import { FaLeaf, FaTractor, FaHandHoldingUsd } from "react-icons/fa";

export default function HomeCarousel() {
  const t = useTranslations();
  const slides = [
    {
      image: "/home-carousel/1.png",
      title: t('carousel.slide1.title'),
      subtitle: t('carousel.slide1.subtitle'),
      cta: t('carousel.slide1.cta'),
      link: "/producer/signup",
      icon: <FaTractor className="text-green-500 text-4xl" />,
      tagline: "For Farmers"
    },
    {
      image: "/home-carousel/2.png",
      title: t('carousel.slide2.title'),
      subtitle: t('carousel.slide2.subtitle'),
      cta: t('carousel.slide2.cta'),
      link: "/shop",
      icon: <FaLeaf className="text-green-500 text-4xl" />,
      tagline: "Fresh Produce"
    },
    {
      image: "/home-carousel/3.png",
      title: t('carousel.slide3.title'),
      subtitle: t('carousel.slide3.subtitle'),
      cta: t('carousel.slide3.cta'),
      link: "/about",
      icon: <FaHandHoldingUsd className="text-green-500 text-4xl" />,
      tagline: "Fair Prices"
    }
  ];

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Smooth slide transition
  const goToSlide = useCallback((index) => {
    if (isTransitioning || index === currentSlide) return;
    
    setIsTransitioning(true);
    setIsAutoPlaying(false);
    
    setTimeout(() => {
      setCurrentSlide(index);
      setIsTransitioning(false);
      // Resume auto-play after a brief pause
      setTimeout(() => setIsAutoPlaying(true), 3000);
    }, 500);
  }, [currentSlide, isTransitioning]);

  const nextSlide = useCallback(() => {
    goToSlide((currentSlide + 1) % slides.length);
  }, [currentSlide, slides.length, goToSlide]);

  // Auto-rotate slides with smooth one-way movement
  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const interval = setInterval(() => {
      nextSlide();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [isAutoPlaying, nextSlide]);

  const prevSlide = () => {
    goToSlide((currentSlide - 1 + slides.length) % slides.length);
  };

  return (
    <div className="relative w-full h-[70vh] md:h-[80vh] min-h-[500px] md:min-h-[600px] max-h-[900px] overflow-hidden bg-gray-900">
      {/* Slides */}
      {slides.map((slide, idx) => (
        <div 
          key={idx}
          className={`absolute inset-0 w-full h-full transition-all duration-600 ease-in-out ${
            idx === currentSlide 
              ? "opacity-100 z-10 translate-x-0" 
              : "opacity-0 z-0 translate-x-0"
          }`}
          style={{
            transition: 'opacity 600ms ease-in-out, transform 600ms ease-in-out'
          }}
        >
          <Image 
            src={slide.image} 
            alt="" 
            fill 
            className="object-cover w-full h-full"
            priority={idx === 0}
            sizes="100vw"
          />
          
          {/* Enhanced Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent">
            <div className="container mx-auto px-6 md:px-12 h-full flex items-center">
              <div className="max-w-2xl">
                {/* Dynamic Tagline Badge */}
                <div className="mb-6 inline-flex items-center gap-3 bg-white/10 backdrop-blur-md px-5 py-3 rounded-full border border-white/20 group hover:bg-white/20 transition-all duration-300">
                  <span className="text-green-400 transform group-hover:scale-110 transition-transform duration-300">
                    {slide.icon}
                  </span>
                  <span className="text-white/90 text-sm font-medium uppercase tracking-wider">
                    {slide.tagline}
                  </span>
                </div>
                
                {/* Enhanced Title */}
                <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight text-white drop-shadow-2xl">
                  {slide.title}
                </h2>
                
                {/* Enhanced Subtitle */}
                <p className="text-lg md:text-xl lg:text-2xl mb-10 max-w-xl leading-relaxed text-white/95 drop-shadow-lg">
                  {slide.subtitle}
                </p>
                
                {/* Enhanced CTA Button */}
                <a
                  href={slide.link}
                  className="inline-flex items-center gap-3 bg-green-600 text-white px-10 py-5 rounded-full shadow-2xl text-base md:text-lg font-semibold transition-all duration-300 transform hover:scale-105 group relative z-30"
                  onMouseEnter={() => setIsAutoPlaying(false)}
                  onMouseLeave={() => setIsAutoPlaying(true)}
                >
                  {slide.cta}
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Enhanced Slide Indicators */}
      <div className="absolute bottom-8 left-0 right-0 z-20 flex justify-center gap-3">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => goToSlide(idx)}
            className={`relative w-8 h-2 rounded-full transition-all duration-300 ${
              idx === currentSlide 
                ? "bg-green-500 shadow-lg shadow-green-500/50" 
                : "bg-white/60 hover:bg-white/90"
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          >
            {idx === currentSlide && isAutoPlaying && (
              <div className="absolute inset-0 rounded-full bg-green-300 animate-pulse"></div>
            )}
          </button>
        ))}
      </div>

      {/* FIXED: Navigation Arrows - Only cover the edges */}
      <div className="absolute inset-y-0 left-0 right-0 z-20 flex items-center justify-between pointer-events-none">
        {/* Left Arrow Container - Only covers left edge */}
        <div className="h-full flex items-center pl-4 md:pl-6 pointer-events-auto">
          <button
            onClick={prevSlide}
            className="bg-black/10 hover:bg-black/20 text-white p-2 rounded-full transition-all duration-300 backdrop-blur-md hover:scale-110 border border-white/30 group"
            aria-label="Previous slide"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 group-hover:-translate-x-0.5 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {/* Right Arrow Container - Only covers right edge */}
        <div className="h-full flex items-center pr-4 md:pr-6 pointer-events-auto">
          <button
            onClick={nextSlide}
            className="bg-black/10 hover:bg-black/20 text-white p-2 rounded-full transition-all duration-300 backdrop-blur-md hover:scale-110 border border-white/30 group"
            aria-label="Next slide"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 group-hover:translate-x-0.5 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="absolute top-0 left-0 right-0 z-30 h-1 bg-white/20">
        {isAutoPlaying && (
          <div 
            className="h-full bg-green-500 transition-all duration-5000 ease-linear"
            style={{ 
              width: isTransitioning ? '100%' : '0%',
              transition: isTransitioning ? 'width 5s linear' : 'width 5s linear'
            }}
            key={currentSlide}
          />
        )}
      </div>
    </div>
  );
}