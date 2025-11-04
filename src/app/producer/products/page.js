"use client";
import { useEffect, useState, useRef } from "react";
import { useTranslations } from 'next-intl';
import { FaUpload, FaSearch, FaPlus, FaEdit, FaTrash, FaBox, FaTags, FaChartLine, FaLeaf, FaInfoCircle, FaStar } from "react-icons/fa";
import { uploadProduct, fetchMyProducts, updateProduct, deleteProduct } from "@/lib/api/products";
import Loader from "@/components/Loader";
import { getProducerProfile } from "@/lib/api/producers";
import { toast } from "react-toastify";
import Image from 'next/image';
import "react-toastify/dist/ReactToastify.css";
import ProducerReviewsModal from "@/components/ProducerReviewsModal";

export default function ProductUploadPage() {
  const t = useTranslations();
  const [product, setProduct] = useState({
    title: "",
    description: "",
    price: "",
    inventory: "",
    categoryId: "",
    images: [],
    unitLabel: "piece",
    unitSize: "1",
    discountType: "none",
    discountValue: "",
    discountMinQuantity: "",
    discountMinSubtotal: "",
    customUnitLabel: "",
  });
  const [imagePreviews, setImagePreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [products, setProducts] = useState([]);
  const [pageLoading, setPageLoading] = useState(false);
  const [pageCursor, setPageCursor] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const loadMoreRef = useRef(null);
  const PAGE_SIZE = 18;
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [stats, setStats] = useState({ total: 0, lowStock: 0, outOfStock: 0 });
  const [reviewsModal, setReviewsModal] = useState({ open: false, product: null });
  const [reviews, setReviews] = useState([]); 
  const handleWheelPrevent = (e) => {
    e.target.blur();
  };
  // Calculate inventory explanation
  const getInventoryExplanation = () => {
    const unitSize = parseFloat(product.unitSize) || 1;
    const inventory = parseInt(product.inventory) || 0;
    const unitLabel = product.unitLabel === 'custom' && product.customUnitLabel ? product.customUnitLabel : product.unitLabel;

    if (!inventory) return "Enter how many selling units you have available.";

    let totalAmount = inventory * unitSize;
    let explanation = `You are listing ${inventory} pack(s) of ${unitSize} ${unitLabel}`;

    // Add total calculation for better understanding
    if (unitLabel === 'kg' && unitSize < 1) {
      explanation += ` (Total: ${totalAmount} kg)`;
    } else if (unitLabel === 'g' && unitSize >= 1000) {
      explanation += ` (Total: ${totalAmount / 1000} kg)`;
    } else if (unitLabel === 'ml' && unitSize >= 1000) {
      explanation += ` (Total: ${totalAmount / 1000} litres)`;
    } else if (unitLabel === 'litre' && unitSize < 1) {
      explanation += ` (Total: ${totalAmount * 1000} ml)`;
    } else if (unitSize !== 1) {
      explanation += ` (Total quantity: ${totalAmount} ${unitLabel})`;
    }

    return explanation;
  };

  // Calculate discount explanation (applies on total amount when conditions met)
  const getDiscountExplanation = () => {
    if (product.discountType === 'none' || !product.discountValue) return "";

    const unitLabel = product.unitLabel === 'custom' && product.customUnitLabel ? product.customUnitLabel : product.unitLabel;
    const unitSize = Number(product.unitSize) || 1;
    const price = parseFloat(product.price) || 0;
    const discountValue = parseFloat(product.discountValue) || 0;
    const minQuantity = parseInt(product.discountMinQuantity) || 0;
    const minSubtotal = parseFloat(product.discountMinSubtotal) || 0;

    let explanation = "Discount applies when: ";
    const conditions = [];
    if (minQuantity > 0) conditions.push(`buying ${minQuantity} or more ${unitLabel}`);
    if (minSubtotal > 0) conditions.push(`order total is ₹${minSubtotal} or more`);

    if (conditions.length === 0) explanation = "Discount applies to every purchase.";
    else explanation += conditions.join(" and ") + ".";

    // Example based on total, not per unit
    if (price > 0 && discountValue > 0) {
      const sampleQty = Math.max(minQuantity || 1, 1);
      const baseTotal = price * sampleQty;
      const finalTotal = product.discountType === 'percentage'
        ? +(baseTotal * (1 - discountValue / 100)).toFixed(2)
        : Math.max(0, +(baseTotal - discountValue).toFixed(2));
      explanation += ` Example: Base total (₹${price} x ${sampleQty}) = ₹${baseTotal.toFixed(2)} → After discount ₹${finalTotal.toFixed(2)} for ${sampleQty} ${unitSize} ${unitLabel}${sampleQty>1?'s':''}.`;
    }

    return explanation;
  };

  // Reset form and previews
  const resetForm = () => {
    setProduct({
      title: "",
      description: "",
      price: "",
      inventory: "",
      categoryId: "",
      images: [],
      unitLabel: "piece",
      unitSize: "1",
      discountType: "none",
      discountValue: "",
      discountMinQuantity: "",
      discountMinSubtotal: "",
      customUnitLabel: "",
    });
    setImagePreviews([]);
    setEditingProduct(null);
  };

  useEffect(() => {
    fetchAndSetProducts(true);
    (async () => {
      try {
        const profile = await getProducerProfile();
        setCategories(profile?.Categories || []);
      } catch {
        setCategories([]);
      }
    })();
  }, []);

  useEffect(() => {
    // Calculate stats whenever products change
    const total = products.length;
    const lowStock = products.filter(p => p.inventory > 0 && p.inventory <= 10).length;
    const outOfStock = products.filter(p => p.inventory === 0).length;
    setStats({ total, lowStock, outOfStock });
  }, [products]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProduct((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setProduct((prev) => {
      const newImages = [...(prev.images || []), ...files].slice(0, 5);
      setImagePreviews(newImages.map(file => URL.createObjectURL(file)));
      return { ...prev, images: newImages };
    });
  };

  const removeImage = (index) => {
    setProduct(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();

    const safeUnitLabel = product.unitLabel === 'custom' && product.customUnitLabel ? product.customUnitLabel : product.unitLabel;
    const entries = {
      categoryId: product.categoryId,
      title: product.title,
      description: product.description,
      price: product.price,
      inventory: product.inventory,
      unitLabel: safeUnitLabel,
      unitSize: product.unitSize,
      discountType: product.discountType,
      discountValue: product.discountType === 'none' ? '' : product.discountValue,
      discountMinQuantity: product.discountType === 'none' ? '' : product.discountMinQuantity,
      discountMinSubtotal: product.discountType === 'none' ? '' : product.discountMinSubtotal,
    };
    
    Object.entries(entries).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') formData.append(k, v);
    });

    (product.images || []).forEach((file) => {
      formData.append("images", file);
    });

    try {
      setUploading(true);
      
      if (editingProduct) {
        await updateProduct(editingProduct.id, formData);
        toast.success("Product updated successfully!");
      } else {
        await uploadProduct(formData);
        toast.success("Product uploaded successfully!");
      }
      resetForm();
      setShowModal(false);
      setEditingProduct(null);
      await fetchAndSetProducts(true);
    } catch (err) {
      console.error(err);
      toast.error(editingProduct ? "Failed to update product." : "Failed to upload product.");
    } finally {
      setUploading(false);
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    const knownUnits = new Set(['piece','kg','g','litre','ml','pack','dozen','box']);
    const isKnown = product.unitLabel && knownUnits.has(String(product.unitLabel).toLowerCase());
    setProduct({
      title: product.title,
      description: product.description,
      price: product.price,
      inventory: product.inventory,
      categoryId: product.categoryId,
      images: [],
      unitLabel: isKnown ? String(product.unitLabel).toLowerCase() : 'custom',
      unitSize: String(product.unitSize ?? '1'),
      discountType: product.discountType || 'none',
      discountValue: product.discountValue != null ? String(product.discountValue) : '',
      discountMinQuantity: product.discountMinQuantity != null ? String(product.discountMinQuantity) : '',
      discountMinSubtotal: product.discountMinSubtotal != null ? String(product.discountMinSubtotal) : '',
      customUnitLabel: isKnown ? '' : (product.unitLabel || ''),
    });
    setImagePreviews(product.images || []);
    setShowModal(true);
  };

  const handleDeleteProduct = (product) => {
    setProductToDelete(product);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteProduct = async () => {
    if (!productToDelete) return;
    
    try {
      setDeleting(productToDelete.id);
      await deleteProduct(productToDelete.id);
      toast.success("Product deleted successfully!");
      await fetchAndSetProducts(true);
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete product.");
    } finally {
      setDeleting(null);
      setShowDeleteConfirm(false);
      setProductToDelete(null);
    }
  };

  const fetchAndSetProducts = async (initial = false) => {
    try {
      setPageLoading(true);
      const limit = PAGE_SIZE;
      const data = await fetchMyProducts(initial ? 1 : pageCursor, limit, search, selectedCategory);
      if (initial) {
        setProducts(data.items || []);
        setPageCursor(2);
        setHasMore(!!data.hasMore);
      } else {
        setProducts((prev) => {
          const map = new Map(prev.map((p) => [p.id, p]));
          (data.items || []).forEach((item) => map.set(item.id, item));
          return Array.from(map.values());
        });
        setPageCursor((p) => p + 1);
        setHasMore(!!data.hasMore);
      }
    } catch (err) {
      toast.error("Failed to load products.");
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => {
      fetchAndSetProducts(true);
    }, 300);
    return () => clearTimeout(t);
  }, [search, selectedCategory]);

  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && hasMore && !pageLoading) {
          fetchAndSetProducts(false);
        }
      },
      { root: null, rootMargin: "200px", threshold: 0 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, pageLoading, loadMoreRef, search, selectedCategory]);

  const getCategoryName = (categoryId) => {
    const cat = categories.find((c) => c.id === categoryId);
    return cat ? cat.name : "";
  };

  const getStockStatus = (inventory) => {
    if (inventory === 0) return { text: "Out of Stock", color: "text-red-600 bg-red-50" };
    if (inventory <= 10) return { text: "Low Stock", color: "text-orange-600 bg-orange-50" };
    return { text: "In Stock", color: "text-green-600 bg-green-50" };
  };

  const calculateDiscountedPrice = (product) => {
    const price = Number(product.price) || 0;
    if (product.discountType === 'percentage') {
      const d = Number(product.discountValue) || 0;
      return (price * (1 - d / 100)).toFixed(2);
    }
    if (product.discountType === 'flat') {
      const d = Number(product.discountValue) || 0;
      return Math.max(0, price - d).toFixed(2);
    }
    return price.toFixed(2);
  };

  return (
    <div className="">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
              <FaLeaf className="text-green-600" />
              {t('producer.products.header.title')}
            </h1>
            <p className="text-gray-600 mt-2">{t('producer.products.header.subtitle')}</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-xl flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <FaUpload className="text-sm" />
            {t('producer.products.header.addNew')}
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">{t('producer.products.stats.total')}</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <FaBox className="text-green-600 text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">{t('producer.products.stats.low')}</p>
                <p className="text-3xl font-bold text-orange-600 mt-2">{stats.lowStock}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <FaChartLine className="text-orange-600 text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">{t('producer.products.stats.out')}</p>
                <p className="text-3xl font-bold text-red-600 mt-2">{stats.outOfStock}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <FaTags className="text-red-600 text-xl" />
              </div>
            </div>
          </div>
        </div>

        {/* Search & Category Filter */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8">
          <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
            <div className="relative max-w-md w-full">
              <input
                type="text"
                placeholder={t('producer.products.search.placeholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full border-0 bg-gray-50 px-4 py-3 rounded-xl pl-12 text-gray-700 focus:ring-2 focus:ring-green-500 focus:bg-white transition-all"
              />
              <FaSearch className="absolute top-3.5 left-4 text-gray-400" />
            </div>

            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-600">{t('producer.products.filter.label')}</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="border bg-gray-50 px-3 py-2 rounded-xl text-gray-700 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">{t('producer.products.filter.all')}</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="min-h-[60vh]">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {products.length === 0 && !pageLoading ? (
              <div className="col-span-full text-center py-16">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaBox className="text-gray-400 text-3xl" />
                </div>
                <h3 className="text-xl font-semibold text-gray-600 mb-2">{t('producer.products.empty.title')}</h3>
                <p className="text-gray-500 mb-6">{t('producer.products.empty.subtitle')}</p>
                <button
                  onClick={() => setShowModal(true)}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
                >
                  {t('producer.products.empty.cta')}
                </button>
              </div>
            ) : (
              products.map((product) => {
                const stockStatus = getStockStatus(product.inventory);
                const discountedPrice = calculateDiscountedPrice(product);
                
                return (
                  <div key={product.id} className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100 group">
                    {/* Product Image */}
                    <div className="relative h-48 overflow-hidden">
                      {product.images && product.images[0] ? (
                        <Image
                          src={product.images[0]}
                          alt={product.title}
                          width={400}
                          height={192}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
                          <FaLeaf className="text-green-300 text-4xl" />
                        </div>
                      )}
                      
                      {/* Action Buttons */}
                      <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                          onClick={() => handleEditProduct(product)}
                          className="bg-white/90 hover:bg-white text-gray-700 p-2 rounded-full shadow-lg backdrop-blur-sm transition-colors"
                          title="Edit product"
                        >
                          <FaEdit className="text-sm" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product)}
                          disabled={deleting === product.id}
                          className="bg-white/90 hover:bg-white text-red-600 p-2 rounded-full shadow-lg backdrop-blur-sm transition-colors disabled:opacity-50"
                          title="Delete product"
                        >
                          {deleting === product.id ? (
                            <div className="w-3 h-3 border border-red-600 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <FaTrash className="text-sm" />
                          )}
                        </button>
                      </div>

                      {/* Stock Badge */}
                      <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-medium ${stockStatus.color} backdrop-blur-sm`}>
                        {stockStatus.text}
                      </div>

                      {/* Discount Badge */}
                      {product.discountType !== 'none' && (
                        <div className="absolute bottom-3 left-3 bg-red-500 text-white px-2 py-1 rounded-lg text-xs font-bold">
                          {product.discountType === 'percentage' ? `${product.discountValue}% OFF` : 'SALE'}
                          {(product.discountMinQuantity || product.discountMinSubtotal) && (() => {
                            const unitLblRaw = product.unitLabel || 'unit';
                            const unitLbl = String(unitLblRaw);
                            const uSize = Number(product.unitSize) || 1;
                            const unitSuffix = `${unitLbl}`;
                            return (
                              <span className="ml-2 bg-white/20 text-[10px] px-1.5 py-0.5 rounded">
                                {product.discountMinQuantity ? `on ${product.discountMinQuantity}${unitSuffix}+` : ''}
                                {product.discountMinQuantity && product.discountMinSubtotal ? ' & ' : ''}
                                {product.discountMinSubtotal ? `₹${product.discountMinSubtotal}+` : ''}
                              </span>
                            );
                          })()}
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-800 mb-1 line-clamp-2 leading-tight">
                        {product.title}
                      </h3>
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                        <span>{getCategoryName(product.categoryId)}</span>
                        <div className="flex items-center gap-1">
                          <FaStar className="text-yellow-500" />
                          <span className="text-gray-700 font-medium">{Number(product.averageRating || 0).toFixed(1)}</span>
                          <span>({product.totalReviews || 0})</span>
                        </div>
                      </div>

                      {/* Pricing */}
                      <div className="flex items-end justify-between mb-3">
                        <div className="flex flex-col">
                          <span className="text-green-600 font-bold text-lg">₹{Number(product.price).toFixed(2)}</span>
                          <span className="text-[10px] text-gray-500">{t('producer.products.card.perUnit', { size: product.unitSize || 1, unit: product.unitLabel || 'unit' })}</span>
                        </div>
                        <span className="text-gray-500 text-sm">
                          {t('producer.products.card.inStock', { count: product.inventory })}
                        </span>
                      </div>

                      {/* Unit Info */}
                      <div className="text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-lg flex items-center justify-between">
                        <span>{t('producer.products.card.pricePerUnit', { size: product.unitSize || 1, unit: product.unitLabel || 'piece' })}</span>
                        <button
                          onClick={() => setReviewsModal({ open: true, product })}
                          className="text-blue-600 hover:text-blue-700 text-xs font-medium"
                        >
                          {t('producer.products.card.viewReviews')}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Infinite Scroll Sentinel */}
          <div ref={loadMoreRef} className="h-1" />
          {pageLoading && products.length > 0 && (
            <div className="mt-8 flex justify-center">
              <div className="flex items-center gap-3 text-gray-600">
                <div className="w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                {t('producer.products.loading.more')}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Product Form Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto text-gray-800">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    {editingProduct ? t('producer.products.modal.editTitle') : t('producer.products.modal.addTitle')}
                  </h2>
                  <p className="text-gray-600 text-sm mt-1">
                    {editingProduct ? t('producer.products.modal.editSubtitle') : t('producer.products.modal.addSubtitle')}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                  aria-label="Close modal"
                >
                  &times;
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <FaBox className="text-green-600" />
                  {t('producer.products.basicInfo.title')}
                </h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('producer.products.basicInfo.productName')} *</label>
                  <input
                    type="text"
                    name="title"
                    placeholder={t('producer.products.basicInfo.productNamePlaceholder')}
                    value={product.title}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 px-4 py-3 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('producer.products.basicInfo.description')}</label>
                  <textarea
                    name="description"
                    placeholder={t('producer.products.basicInfo.descriptionPlaceholder')}
                    value={product.description}
                    onChange={handleChange}
                    rows={3}
                    className="w-full border border-gray-300 px-4 py-3 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all resize-none"
                  />
                </div>
              </div>

              {/* Pricing & Inventory */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <FaTags className="text-green-600" />
                  {t('producer.products.pricing.title')}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('producer.products.pricing.priceLabel')} *</label>
                    <input
                      type="number"
                      name="price"
                      placeholder={t('producer.products.pricing.pricePlaceholder')}
                      value={product.price}
                      onChange={handleChange}
                      onWheel={handleWheelPrevent}
                      required
                      min="0"
                      step="0.01"
                      className="w-full border border-gray-300 px-4 py-3 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    />
                    <p className="text-xs text-gray-500 mt-1">{t('producer.products.pricing.priceHelp')}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('producer.products.pricing.stockLabel')} *</label>
                    <input
                      type="number"
                      name="inventory"
                      placeholder={t('producer.products.pricing.stockPlaceholder')}
                      value={product.inventory}
                      onChange={handleChange}
                      onWheel={handleWheelPrevent}
                      required
                      min="0"
                      step="1"
                      className="w-full border border-gray-300 px-4 py-3 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    />
                    <div className="flex items-start gap-1 mt-1">
                      <FaInfoCircle className="text-green-600 text-xs mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-gray-600">{getInventoryExplanation()}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Unit Configuration */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">{t('producer.products.unit.title')}</h3>
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
                  <div className="flex items-start gap-2">
                    <FaInfoCircle className="text-green-600 text-sm mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-green-800">
                      <strong>{t('producer.products.unit.howItWorks.prefix')}</strong> {t('producer.products.unit.howItWorks.text')}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('producer.products.unit.typeLabel')}</label>
                    <select
                      name="unitLabel"
                      value={product.unitLabel}
                      onChange={handleChange}
                      className="w-full border border-gray-300 px-4 py-3 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    >
                      <option value="piece">Piece/Item</option>
                      <option value="kg">Kilogram (kg)</option>
                      <option value="g">Gram (g)</option>
                      <option value="litre">Litre (L)</option>
                      <option value="ml">Millilitre (ml)</option>
                      <option value="pack">Pack/Bundle</option>
                      <option value="dozen">Dozen (12 pieces)</option>
                      <option value="box">Box/Crate</option>
                      <option value="custom">Other...</option>
                    </select>
                    {product.unitLabel === 'custom' && (
                      <input
                        type="text"
                        name="customUnitLabel"
                        value={product.customUnitLabel}
                        onChange={handleChange}
                        placeholder={t('producer.products.unit.customPlaceholder')}
                        className="mt-2 w-full border border-gray-300 px-4 py-3 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      />
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('producer.products.unit.sizeLabel')}</label>
                    <input
                      type="number"
                      name="unitSize"
                      min="0.01"
                      step="0.01"
                      placeholder={t('producer.products.unit.sizePlaceholder')}
                      value={product.unitSize}
                      onChange={handleChange}
                      onWheel={handleWheelPrevent}
                      className="w-full border border-gray-300 px-4 py-3 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      {t('producer.products.unit.sizeHelp')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Discount */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">{t('producer.products.discount.title')}</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('producer.products.discount.typeLabel')}</label>
                    <select
                      name="discountType"
                      value={product.discountType}
                      onChange={handleChange}
                      className="w-full border border-gray-300 px-4 py-3 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    >
                      <option value="none">{t('producer.products.discount.type.none')}</option>
                      <option value="percentage">{t('producer.products.discount.type.percentage')}</option>
                      <option value="flat">{t('producer.products.discount.type.flat')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('producer.products.discount.valueLabel')}</label>
                    <input
                      type="number"
                      name="discountValue"
                      min="0"
                      step="0.01"
                      placeholder={product.discountType === 'percentage' ? t('producer.products.discount.valuePlaceholderPercent') : t('producer.products.discount.valuePlaceholderFlat')}
                      value={product.discountValue}
                      onChange={handleChange}
                      onWheel={handleWheelPrevent}
                      disabled={product.discountType === 'none'}
                      className="w-full border border-gray-300 px-4 py-3 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all disabled:bg-gray-50 disabled:text-gray-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('producer.products.discount.minQtyLabel')}
                    </label>
                    <input
                      type="number"
                      name="discountMinQuantity"
                      min="1"
                      step="1"
                      placeholder={t('producer.products.discount.minQtyPlaceholder')}
                      value={product.discountMinQuantity}
                      onChange={handleChange}
                      onWheel={handleWheelPrevent}
                      disabled={product.discountType === 'none'}
                      className="w-full border border-gray-300 px-4 py-3 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all disabled:bg-gray-50 disabled:text-gray-400"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {t('producer.products.discount.minQtyHelp', { unit: (product.unitLabel === 'custom' && product.customUnitLabel ? product.customUnitLabel : product.unitLabel) || 'unit' })}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('producer.products.discount.minSubtotalLabel')}
                    </label>
                    <input
                      type="number"
                      name="discountMinSubtotal"
                      min="0"
                      step="0.01"
                      placeholder={t('producer.products.discount.minSubtotalPlaceholder')}
                      value={product.discountMinSubtotal}
                      onChange={handleChange}
                      onWheel={handleWheelPrevent}
                      disabled={product.discountType === 'none'}
                      className="w-full border border-gray-300 px-4 py-3 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all disabled:bg-gray-50 disabled:text-gray-400"
                    />
                    <p className="text-xs text-gray-500 mt-1">{t('producer.products.discount.minSubtotalHelp')}</p>
                  </div>
                </div>

                {product.discountType !== 'none' && product.discountValue && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-start gap-2">
                      <FaInfoCircle className="text-blue-600 text-sm mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-blue-800">
                        {getDiscountExplanation()}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Category & Images */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('producer.products.category.title')} *</label>
                  <select
                    name="categoryId"
                    value={product.categoryId}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 px-4 py-3 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  >
                    <option value="">{t('producer.products.category.selectPlaceholder')}</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">{t('producer.products.images.title')}</label>
                  <div className="flex flex-wrap gap-4">
                    {imagePreviews.map((url, idx) => (
                      <div key={idx} className="relative group">
                        <div className="h-24 w-24 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 overflow-hidden">
                          <Image src={url} width={96} height={96} className="h-full w-full object-cover" alt="preview" />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                    {imagePreviews.length < 5 && (
                      <label className="h-24 w-24 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors">
                        <FaPlus className="text-gray-400 text-xl mb-1" />
                        <span className="text-xs text-gray-500 text-center">{t('producer.products.images.addImage')}</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageChange}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">{t('producer.products.images.help')}</p>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-6 py-3 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                >
                  {t('producer.products.form.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-3 rounded-xl flex items-center gap-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {uploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {editingProduct ? t('producer.products.form.updating') : t('producer.products.form.uploading')}
                    </>
                  ) : (
                    <>
                      <FaUpload />
                      {editingProduct ? t('producer.products.form.update') : t('producer.products.form.add')}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-4">
              <FaTrash className="text-red-600 text-xl" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">{t('producer.products.delete.title')}</h3>
            <p className="text-gray-600 mb-6">
              {t('producer.products.delete.prompt', { title: productToDelete?.title || '' })}
            </p>
            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setProductToDelete(null);
                }}
                className="px-6 py-3 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                >
                {t('producer.products.delete.cancel')}
              </button>
              <button
                onClick={confirmDeleteProduct}
                disabled={deleting === productToDelete?.id}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {deleting === productToDelete?.id ? (
                <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {t('producer.products.delete.deleting')}
                </>
                ) : (
                t('producer.products.delete.confirm')
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Reviews Modal */}
      <ProducerReviewsModal
        open={reviewsModal.open}
        onClose={() => setReviewsModal({ open: false, product: null })}
        product={reviewsModal.product}
      />
    </div>
  );
}