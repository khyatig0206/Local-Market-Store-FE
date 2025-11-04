import { fetchCategoriesAPI } from "@/lib/api/categories";
import CategoriesCarousel from "../CategoriesCarousel";

export default async function HomeCategories() {
  let categories = [];
  let error = null;
  try {
    categories = await fetchCategoriesAPI();
  } catch (err) {
    error = err.message;
  }

  if (error) {
    return <div className="text-red-600 text-center py-8">Could not load categories: {error}</div>;
  }

  if (!categories.length) return null;

  return (
    <section className="w-full max-w-6xl mx-auto mt-6 mb-0">
      <CategoriesCarousel categories={categories} />
    </section>
  );
}