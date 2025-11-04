export default function FarmLoader({ size = 12, color = "text-green-600" }) {
  const pixelSize = `${size * 4}px`;

  return (
    <div className="w-full flex flex-col items-center justify-center py-12 space-y-4">
      {/* Animated growing plant loader */}
      <div className="relative" style={{ height: pixelSize, width: pixelSize }}>
        {/* Pot/Basin */}
        <div className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 w-3/4 h-1/4 rounded-b-lg ${color.replace('text', 'bg')} opacity-70`}></div>
        
        {/* Stem */}
        <div className={`absolute bottom-1/4 left-1/2 transform -translate-x-1/2 w-1 h-1/2 ${color.replace('text', 'bg')} animate-pulse`}
             style={{ animationDuration: '1.5s' }}>
          {/* Leaves */}
          <div className={`absolute -left-2 top-1/4 w-2 h-3 rounded-full ${color.replace('text', 'bg')} opacity-80 transform -rotate-12 origin-right animate-pulse`}
               style={{ animationDuration: '1.7s', animationDelay: '0.2s' }}></div>
          <div className={`absolute -right-2 top-2/4 w-2 h-3 rounded-full ${color.replace('text', 'bg')} opacity-80 transform rotate-12 origin-left animate-pulse`}
               style={{ animationDuration: '1.6s', animationDelay: '0.3s' }}></div>
        </div>
        
        {/* Growing animation */}
        <div className={`absolute top-0 left-1/2 transform -translate-x-1/2 w-1 h-0 ${color.replace('text', 'bg')} animate-grow`}
             style={{ animationDuration: '2s' }}></div>
      </div>

      {/* Loading text with farming terminology */}
      <p className={`text-sm ${color} font-medium`}>
        Gathering fresh produce...
      </p>

      {/* Custom animation keyframes - add to your global CSS */}
      <style jsx>{`
        @keyframes grow {
          0% { height: 0; opacity: 0; }
          50% { opacity: 1; }
          100% { height: 100%; opacity: 0; }
        }
        .animate-grow {
          animation-name: grow;
          animation-iteration-count: infinite;
        }
      `}</style>
    </div>
  );
}