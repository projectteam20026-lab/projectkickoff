
import React, { useState } from 'react';

interface FieldImageProps {
  src: string;
  alt: string;
  className?: string;
  stadiumName?: string;
}

const FieldImage: React.FC<FieldImageProps> = ({ src, alt, className }) => {
  const [hasError, setHasError] = useState(false);

  // Unified high-quality field image as the primary visual and fallback
  const UNIFIED_IMAGE = 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80';

  const handleError = () => {
    if (!hasError) {
        setHasError(true);
    }
  };

  return (
    <div className={`relative overflow-hidden bg-slate-100 ${className}`}>
        <img 
            src={hasError ? UNIFIED_IMAGE : (src || UNIFIED_IMAGE)} 
            alt={alt} 
            onError={handleError}
            className="w-full h-full object-cover transition-transform duration-700 hover:scale-110" 
            loading="lazy"
        />
        {/* Subtle overlay for better text contrast if needed */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none opacity-40"></div>
    </div>
  );
};

export default FieldImage;
