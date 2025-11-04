"use client";
import { useEffect, useState } from "react";
import { getProductReviews } from "@/lib/api/reviews";
import { FaTimes, FaStar } from "react-icons/fa";

export default function ProducerReviewsModal({ open, onClose, product }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    if (!open || !product?.id) return;
    setLoading(true);
    setError("");
    (async () => {
      try {
        const data = await getProductReviews(product.id, { limit: 20 });
        setReviews(Array.isArray(data) ? data : (data.items || []));
      } catch (e) {
        setError("Failed to load reviews");
      } finally {
        setLoading(false);
      }
    })();
  }, [open, product?.id]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between rounded-t-2xl">
          <div>
            <h3 className="text-xl font-semibold text-gray-800">Reviews for {product?.title}</h3>
            <p className="text-sm text-gray-600">Average {Number(product?.averageRating || 0).toFixed(1)} · {product?.totalReviews || 0} reviews</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500">
            <FaTimes />
          </button>
        </div>
        <div className="p-4">
          {loading && <div className="text-gray-600">Loading...</div>}
          {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
          {!loading && reviews.length === 0 && (
            <div className="text-gray-500">No reviews yet.</div>
          )}
          <ul className="space-y-4">
            {reviews.map((r) => (
              <li key={r.id} className="border border-gray-100 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex items-center text-yellow-500">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <FaStar key={i} className={i < (r.rating || 0) ? "fill-yellow-500" : "text-gray-300"} />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">{r.rating}/5</span>
                  {r.User?.username && (
                    <span className="text-xs text-gray-400">· by {r.User.username}</span>
                  )}
                </div>
                {r.comment && <p className="text-gray-700 text-sm">{r.comment}</p>}
                {r.images && r.images.length > 0 && (
                  <div className="mt-2 flex gap-2 flex-wrap">
                    {r.images.map((img, idx) => (
                      <img key={idx} src={img} alt="review" className="h-16 w-16 object-cover rounded" />
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
