
import React, { useState, useEffect } from 'react';

const FOOTBALL_POOL = [
  'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800&q=80',
  'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800&q=80',
  'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80',
  'https://images.unsplash.com/photo-1459865264687-595d652de67e?w=800&q=80',
  'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=800&q=80',
  'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&q=80',
  'https://images.unsplash.com/photo-1600679472829-3044539ce405?w=800&q=80',
  'https://images.unsplash.com/photo-1625993051168-f9bf22945546?w=800&q=80',
];

function pickFromPool(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) & 0xffffffff;
  }
  return FOOTBALL_POOL[Math.abs(hash) % FOOTBALL_POOL.length];
}

interface FieldImageProps {
  src?: string;
  alt: string;
  className?: string;
  stadiumName?: string;
}

const FieldImage: React.FC<FieldImageProps> = ({ src, alt, className, stadiumName }) => {
  const fallback = pickFromPool(stadiumName || alt);
  const [imgSrc, setImgSrc] = useState<string>(src || fallback);

  useEffect(() => {
    setImgSrc(src || fallback);
  }, [src, fallback]);

  return (
    <div className={`relative overflow-hidden bg-slate-100 ${className}`}>
      <img
        src={imgSrc}
        alt={alt}
        onError={() => setImgSrc(fallback)}
        className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none opacity-40" />
    </div>
  );
};

export default FieldImage;
