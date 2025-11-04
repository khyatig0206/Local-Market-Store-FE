export default function CircleSpinner({ size = 48, color = "border-green-700" }) {
  const px = typeof size === "number" ? `${size}px` : size;
  return (
    <div className="flex items-center justify-center">
      <div
        className={`rounded-full border-4 ${color} border-t-transparent animate-spin`}
        style={{ width: px, height: px }}
        aria-label="Loading"
        role="status"
      />
    </div>
  );
}
