'use client';
import { useTranslations } from 'next-intl';

export default function TestimonialsContent() {
    const t = useTranslations('home.testimonials');

    const reviews = t.raw('reviews');

    return (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {reviews.map((review, i) => (
                <div key={i} className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 group">
                    <div className="flex items-center mb-6">
                        {[...Array(5)].map((_, i) => (
                            <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                        ))}
                    </div>
                    <blockquote className="text-gray-700 text-lg leading-relaxed mb-6">
                        &ldquo;{review.quote}&rdquo;
                    </blockquote>
                    <div className="flex items-center">
                        <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-semibold mr-4">
                            {review.author.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900">{review.author}</p>
                            <p className="text-sm text-gray-500">{review.location}</p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
