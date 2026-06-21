import React, { useState, useEffect } from 'react';

// Generates a deterministic gradient + color from field name
function seedColor(seed: string): { from: string; to: string } {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) & 0xffffffff;
  }
  const palettes = [
    { from: '#064e3b', to: '#065f46' }, // emerald deep
    { from: '#1e3a5f', to: '#1e40af' }, // blue navy
    { from: '#3b0764', to: '#6b21a8' }, // purple
    { from: '#7f1d1d', to: '#991b1b' }, // red dark
    { from: '#134e4a', to: '#0f766e' }, // teal
    { from: '#1c1917', to: '#44403c' }, // stone
    { from: '#0c4a6e', to: '#0369a1' }, // sky
    { from: '#14532d', to: '#166534' }, // green
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
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const colors = seedColor(stadiumName || alt);

  // Reset state when src changes
  useEffect(() => {
    setFailed(false);
    setLoaded(false);
  }, [src]);

  const showPlaceholder = !src || failed;

  return (
    <div className={`relative overflow-hidden bg-slate-800 ${className}`}>
      {/* Gradient placeholder — always rendered behind the image */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center gap-2"
        style={{ background: `linear-gradient(135deg, ${colors.from}, ${colors.to})` }}
      >
        {/* Field lines SVG */}
        <svg viewBox="0 0 120 80" className="w-24 h-16 opacity-20" fill="none" stroke="white" strokeWidth="1.5">
          <rect x="4" y="4" width="112" height="72" rx="2" />
          <line x1="60" y1="4" x2="60" y2="76" />
          <circle cx="60" cy="40" r="12" />
          <rect x="4" y="24" width="18" height="32" />
          <rect x="98" y="24" width="18" height="32" />
          <rect x="4" y="30" width="8" height="20" />
          <rect x="108" y="30" width="8" height="20" />
        </svg>
        <span className="text-white/50 text-xs font-bold tracking-widest uppercase">
          {stadiumName || alt}
        </span>
      </div>

      {/* Real image on top */}
      {!showPlaceholder && (
        <img
          src={src}
          alt={alt}
          onError={() => setFailed(true)}
          onLoad={() => setLoaded(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        />
      )}

      {/* Subtle gradient overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
    </div>
  );
};

export default FieldImage;
