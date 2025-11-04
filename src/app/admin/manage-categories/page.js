'use client';
import { useEffect, useState, useRef, useCallback } from "react";
import Image from 'next/image';
import {
  fetchCategoriesPaginaxted,
  addCategoryAPI,
  updateCategoryAPI,
  deleteCategoryAPI
} from "@/lib/api/categories";
import { toast } from 'react-toastify';
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import Loader from "@/components/Loader";

export default function ManageCategories() {
  const [categories, setCategories] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [form, setForm] = useState({
    name: '',
    platformFeePercent: '',
    photo: null,
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState('');

  // Infinite scroll state (mirror producer products)
  const PAGE_SIZE = 18;
  const [pageCursor, setPageCursor] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [pageLoading, setPageLoading] = useState(false);
  const loadMoreRef = useRef(null);

  // Client-side search over loaded items
  const handleSearch = useCallback((value) => {
    setSearch(value);
    const q = (value || '').toLowerCase();
    const filteredList = (categories || []).filter(cat => (cat.name || '').toLowerCase().includes(q));
    setFiltered(filteredList);
  }, [categories]);

  useEffect(() => {
    handleSearch(search);
  }, [categories, handleSearch, search]);

  useEffect(() => {
    // initial page
    resetAndLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetAndLoad = async () => {
    setCategories([]);
    setFiltered([]);
    setPageCursor(1);
    setHasMore(true);
    await loadNextPage(true);
  };

  const loadNextPage = async (initial = false) => {
    if (pageLoading || (!hasMore && !initial)) return;
    try {
      setPageLoading(true);
      const data = await fetchCategoriesPaginaxted(initial ? 1 : pageCursor, PAGE_SIZE);
      const rows = data?.categories || [];
      setCategories(prev => {
        const map = new Map(prev.map(c => [c.id, c]));
        rows.forEach(c => map.set(c.id, c));
        return Array.from(map.values());
      });
      setPageCursor(p => p + 1);
      const totalPages = Number(data?.totalPages || 1);
      const currentPage = Number(data?.page || (initial ? 1 : pageCursor));
      setHasMore(currentPage < totalPages);
    } catch (err) {
      toast.error("Failed to load categories");
    } finally {
      setPageLoading(false);
    }
  };

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && hasMore && !pageLoading) {
          loadNextPage(false);
        }
      },
      { root: null, rootMargin: '200px', threshold: 0 }
    );
    obs.observe(el);
    return () => obs.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, pageLoading, loadMoreRef]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData();
    formData.append('name', form.name);
    formData.append('platformFeePercent', form.platformFeePercent);
    if (form.photo) formData.append('photo', form.photo);

    try {
      if (editingId) {
        const result = await updateCategoryAPI(editingId, formData);
        toast.success(result.message || "Category updated");
      } else {
        const result = await addCategoryAPI(formData);
        toast.success(result.message || "Category added");
      }
      setForm({ name: '', platformFeePercent: '', photo: null });
      setEditingId(null);
      setModalOpen(false);
      await resetAndLoad();
    } catch (err) {
      toast.error(err.message || "Failed to save category");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (cat) => {
    setForm({
      name: cat.name,
      platformFeePercent: cat.platformFeePercent,
      photo: null,
    });
    setEditingId(cat.id);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this category?")) {
      try {
        const result = await deleteCategoryAPI(id);
        toast.success(result.message || "Deleted successfully");
        await resetAndLoad();
      } catch (err) {
        toast.error(err.message || "Failed to delete");
      }
    }
  };

  const list = filtered.length || search ? filtered : categories;

  return (
    <main className="flex-1 p-2 sm:p-2">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-2">
        <h1 className="text-lg sm:text-xl font-semibold text-gray-800 tracking-tight">
          Manage Categories
        </h1>
        <button
          onClick={() => {
            setEditingId(null);
            setForm({ name: '', platformFeePercent: '', photo: null });
            setModalOpen(true);
          }}
          className="bg-green-600 text-white px-3 py-1.5 rounded text-sm hover:bg-green-700 shadow-sm"
        >
          Add Category
        </button>
      </div>

      <input
        type="text"
        value={search}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Search category..."
        className="w-full mb-4 p-1.5 border border-gray-300 rounded text-gray-600 text-sm"
      />

      <div className="min-h-[60vh]">
        {list.length === 0 && !pageLoading ? (
          <p className="text-gray-600 text-center mt-10">🚫 No categories found.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {list.map((cat) => (
              <div
                key={cat.id}
                className="bg-white p-2 shadow-sm rounded flex flex-col items-center text-center relative border border-gray-200"
              >
                <Image
                  src={cat.photo}
                  alt={cat.name}
                  width={128}
                  height={128}
                  className="w-24 h-24 object-cover rounded mb-2 border"
                />
                <h3 className="text-base font-medium text-gray-800 mb-1 truncate">{cat.name}</h3>
                <p className="text-xs text-gray-500 mb-2">
                  Fee: <span className="font-semibold">{cat.platformFeePercent}%</span>
                </p>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(cat)} className="text-blue-500 hover:text-blue-700">
                    <FiEdit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(cat.id)} className="text-red-500 hover:text-red-700">
                    <FiTrash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Infinite scroll sentinel */}
        <div ref={loadMoreRef} className="h-1" />
        {pageLoading && list.length > 0 && (
          <div className="mt-4 flex justify-center">
            <Loader />
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded shadow-lg w-full max-w-xs space-y-3 relative border border-gray-200">
            <button
              onClick={() => {
                setModalOpen(false);
                setEditingId(null);
              }}
              className="absolute top-2 right-2 text-gray-500 hover:text-red-500 text-xl"
            >
              &times;
            </button>
            <h2 className="text-base font-semibold text-gray-800 mb-2">
              {editingId ? "Edit Category" : "Add New Category"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-2">
              <input
                type="text"
                placeholder="Category Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full p-1.5 border border-gray-300 rounded text-gray-600 text-sm"
                required
              />
              <input
                type="number"
                placeholder="Platform Fee Percent (e.g., 10)"
                value={form.platformFeePercent}
                onChange={(e) => setForm({ ...form, platformFeePercent: e.target.value })}
                className="w-full p-1.5 border border-gray-300 rounded text-gray-600 text-sm"
                required
              />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setForm({ ...form, photo: e.target.files[0] })}
                className="w-full text-gray-600 text-xs"
                {...(!editingId && { required: true })}
              />

              <button
                type="submit"
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded w-full text-sm"
              >
                {loading ? (editingId ? "Updating..." : "Adding...") : editingId ? "Update" : "Add"}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
