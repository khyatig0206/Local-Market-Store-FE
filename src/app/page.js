import HomeCarousel from "@/components/HomeCarousel";
import HomeCategories from "@/components/server/HomeCategories";
import HomeCategoryProducts from "@/components/HomeCategoryProducts";
import HomeBestSellers from "@/components/HomeBestSellers";
import I18nText from "@/components/i18n/I18nText";
import NewsletterInput from "@/components/home/NewsletterInput";
import NewsletterButton from "@/components/home/NewsletterButton";
import ValuePropositions from "@/components/home/ValuePropositions";
import FeaturedFarmers from "@/components/home/FeaturedFarmers";
import TestimonialsContent from "@/components/home/TestimonialsContent";

export default function Home() {
    return (
        <div className="min-h-screen flex flex-col bg-white">
            <main className="flex-1">
                {/* Hero Carousel Section */}
                <section className="w-full relative">
  <HomeCarousel />
</section>

                {/* Main Content */}
                <div className="max-w-7xl mx-auto px-4 sm:px-4 lg:px-4">
                    {/* Categories Section */}
                    <section className="py-12">
                        <div className="text-center mb-10">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full mb-4">
                                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                            </div>
                            <h2 className="text-4xl font-bold text-gray-900 mb-4">
                                <I18nText id="home.shopByCategory" />
                            </h2>
                            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                                <I18nText id="home.categoryDescription" />
                            </p>
                        </div>
                        <HomeCategories />
                    </section>

                    {/* Featured Products */}
                    <section className="py-12 bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 rounded-3xl mb-12 ">
                        <div className="text-center mb-10">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-100 to-amber-100 rounded-full mb-4">
                                <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                </svg>
                            </div>
                            <h2 className="text-4xl font-bold text-gray-900 mb-4">
                                <I18nText id="home.featuredProducts" />
                            </h2>
                            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                                <I18nText id="home.featuredProductsDescription" />
                            </p>
                        </div>
                        <HomeCategoryProducts />
                    </section>

                    {/* Best Sellers */}
                    <section id="bestsellers">
                        <HomeBestSellers />
                    </section>

                    {/* Featured Farmers */}
                    <section className="py-12 mb-12 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 rounded-3xl px-6">
                        <FeaturedFarmers />
                    </section>

                    {/* Testimonials */}
                    <section id="testimonials" className="py-12 mb-12 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-3xl px-6 relative overflow-hidden">
                        {/* Background Elements */}
                        <div className="absolute top-0 left-0 w-72 h-72 bg-blue-200 rounded-full -translate-x-1/2 -translate-y-1/2 opacity-20"></div>
                        <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-200 rounded-full translate-x-1/2 translate-y-1/2 opacity-20"></div>

                        <div className="relative">
                            <div className="text-center mb-10">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full mb-4">
                                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                </div>
                                <h2 className="text-4xl font-bold text-gray-900 mb-4">
                                    <I18nText id="home.testimonials.title" />
                                </h2>
                                <p className="text-xl text-gray-600">
                                    <I18nText id="home.testimonials.subtitle" />
                                </p>
                            </div>

                            <TestimonialsContent />
                        </div>
                    </section>
                    {/* Value Propositions Section */}
                    <section className="pb-12">
                        <ValuePropositions />
                    </section>
                    {/* Newsletter */}
                    <section className="py-12 mb-12 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-green-600 via-emerald-600 to-teal-700 rounded-3xl"></div>
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
                        <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full translate-y-40 -translate-x-40"></div>

                        <div className="relative text-center text-white px-6">
                            <h2 className="text-4xl font-bold mb-6">
                                <I18nText id="home.newsletter.title" />
                            </h2>
                            <p className="text-green-100 text-xl mb-8 max-w-2xl mx-auto leading-relaxed">
                                <I18nText id="home.newsletter.subtitle" />
                            </p>
                            <div className="max-w-md mx-auto flex flex-col sm:flex-row gap-4">
                                <NewsletterInput className="flex-1 px-6 py-4 rounded-2xl border-0 bg-white/20 text-white placeholder-green-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 backdrop-blur-sm" />
                                <NewsletterButton className="bg-white text-green-600 px-8 py-4 rounded-2xl font-semibold hover:bg-gray-50 transition-colors duration-200" />
                            </div>
                        </div>
                    </section>

                    
                </div>
            </main>

            {/* Enhanced Footer */}
            <footer className="bg-gray-900 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
                        {/* Brand */}
                        <div className="lg:col-span-2">
                            <div className="flex items-center mb-6">
                                <span className="text-3xl font-bold text-green-400">Pallihaat</span>
                            </div>
                            <p className="text-gray-400 mb-6 max-w-md text-lg leading-relaxed">
                                Connecting local farmers directly with consumers. Fresh, sustainable, and traceable products from farm to table.
                            </p>
                            <div className="flex space-x-4">
                                {['Facebook', 'Instagram', 'Twitter'].map((social) => (
                                    <a key={social} href="#" className="text-gray-400 hover:text-green-400 transition-colors duration-200">
                                        <span className="sr-only">{social}</span>
                                        <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors duration-200">
                                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                                            </svg>
                                        </div>
                                    </a>
                                ))}
                            </div>
                        </div>

                        {/* Quick Links */}
                        {[
                            {
                                title: "Shop",
                                links: ["All Products", "New Arrivals", "Best Sellers", "Seasonal Specials", "Gift Cards"]
                            },
                            {
                                title: "Support",
                                links: ["Contact Us", "FAQs", "Shipping Info", "Returns", "Track Order"]
                            },
                            {
                                title: "Farmers",
                                links: ["Sell on Pallihaat", "Farmer Resources", "Quality Standards", "Join Our Network", "Success Stories"]
                            }
                        ].map((section, index) => (
                            <div key={index}>
                                <h3 className="text-lg font-semibold text-green-400 mb-6">{section.title}</h3>
                                <ul className="space-y-4">
                                    {section.links.map((link, linkIndex) => (
                                        <li key={linkIndex}>
                                            <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200 text-base">
                                                {link}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>

                    {/* Bottom Bar */}
                    <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
                        <p className="text-gray-400 text-base mb-4 md:mb-0">
                            © 2025 Pallihaat. All rights reserved.
                        </p>
                        <div className="flex space-x-8">
                            <a href="#" className="text-gray-400 hover:text-white text-base transition-colors duration-200">Privacy Policy</a>
                            <a href="#" className="text-gray-400 hover:text-white text-base transition-colors duration-200">Terms of Service</a>
                            <a href="#" className="text-gray-400 hover:text-white text-base transition-colors duration-200">Cookie Policy</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}