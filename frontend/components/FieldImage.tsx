
import React, { useState, useEffect } from 'react';

const FOOTBALL_POOL = [
  'https://images.pexels.com/photos/46798/the-ball-stadion-football-the-pitch-46798.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/47730/the-ball-stadion-football-stadium-47730.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/16826134/pexels-photo-16826134.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/12486370/pexels-photo-12486370.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/15153169/pexels-photo-15153169.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/16114080/pexels-photo-16114080.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/17203165/pexels-photo-17203165.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/21561836/pexels-photo-21561836.jpeg?auto=compress&cs=tinysrgb&w=800',
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
  const [imgSrc, setImgSrc] = useState<string>(fallback);

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
