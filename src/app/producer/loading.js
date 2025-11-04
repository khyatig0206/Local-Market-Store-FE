"use client";
import CircleSpinner from "@/components/CircleSpinner";

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-100 via-white to-blue-100">
      <CircleSpinner size={56} color="border-green-700" />
    </div>
  );
}
