import React, { useState, useEffect } from 'react';

// 12 confirmed football/soccer field photos
const FOOTBALL_IMGS = [
  'https://images.pexels.com/photos/46798/the-ball-stadion-football-the-pitch-46798.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/47730/the-ball-stadion-football-stadium-47730.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1487466365202-1afdb86c764e?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1553778263-73a83bab9b0c?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1459865264687-595d652de67e?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1606925797300-0b35e9d1794e?auto=format&fit=crop&w=800&q=80',
];

// Pick a deterministic football photo from the pool based on the field name
function pickFallbackImage(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) & 0xffffffff;
  }
  return FOOTBALL_IMGS[Math.abs(hash) % FOOTBALL_IMGS.length];
}

// Gradient colors used only as a base layer behind the image
function seedColor(seed: string): { from: string; to: string } {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) & 0xffffffff;
  }
  const palettes = [
    { from: '#064e3b', to: '#065f46' },
    { from: '#1e3a5f', to: '#1e40af' },
    { from: '#3b0764', to: '#6b21a8' },
    { from: '#7f1d1d', to: '#991b1b' },
    { from: '#134e4a', to: '#0f766e' },
    { from: '#1c1917', to: '#44403c' },
    { from: '#0c4a6e', to: '#0369a1' },
    { from: '#14532d', to: '#166534' },
  ];
  return palettes[Math.abs(hash) % palettes.length];
}

interface FieldImageProps {
  src?: string;
  alt: string;
  className?: string;
  stadiumName?: string;
}

const FieldImage: React.FC<FieldImageProps> = ({ src, alt, className, stadiumName }) => {
  const name = stadiumName || alt;
  const fallbackSrc = pickFallbackImage(name);
  const colors = seedColor(name);

  // primary = supplied src; if missing or broken, use fallback football photo
  const [primaryFailed, setPrimaryFailed] = useState(false);
  const [fallbackFailed, setFallbackFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const activeSrc = (!src || primaryFailed) ? fallbackSrc : src;
  const showGradientOnly = fallbackFailed;

  useEffect(() => {
    setPrimaryFailed(false);
    setFallbackFailed(false);
    setLoaded(false);
  }, [src]);

  return (
    <div className={`relative overflow-hidden bg-slate-800 ${className}`}>
      {/* Gradient — always behind everything */}
      <div
        className="absolute inset-0"
        style={{ background: `linear-gradient(135deg, ${colors.from}, ${colors.to})` }}
      />

      {/* Football photo */}
      {!showGradientOnly && (
        <img
          src={activeSrc}
          alt={alt}
          onError={() => {
            if (!primaryFailed && src && activeSrc === src) {
              setPrimaryFailed(true);
            } else {
              setFallbackFailed(true);
            }
            setLoaded(false);
          }}
          onLoad={() => setLoaded(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        />
      )}

      {/* SVG pitch lines — only when no photo loaded yet */}
      {!loaded && (
        <svg viewBox="0 0 120 80" className="absolute inset-0 m-auto w-24 h-16 opacity-20" fill="none" stroke="white" strokeWidth="1.5">
          <rect x="4" y="4" width="112" height="72" rx="2" />
          <line x1="60" y1="4" x2="60" y2="76" />
          <circle cx="60" cy="40" r="12" />
          <rect x="4" y="24" width="18" height="32" />
          <rect x="98" y="24" width="18" height="32" />
          <rect x="4" y="30" width="8" height="20" />
          <rect x="108" y="30" width="8" height="20" />
        </svg>
      )}

      {/* Gradient overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
    </div>
  );
};

export default FieldImage;
