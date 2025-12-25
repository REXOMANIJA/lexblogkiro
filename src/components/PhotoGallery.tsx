import { useState, useEffect, useRef } from 'react';

interface PhotoGalleryProps {
  photos: string[];
  alt: string;
}

export function PhotoGallery({ photos, alt }: PhotoGalleryProps) {
  const len = photos?.length ?? 0;
  const [index, setIndex] = useState(0);
  const startXRef = useRef<number | null>(null);

  const next = () => {
    if (len <= 1) return;
    setIndex((i) => (i === len - 1 ? 0 : i + 1));
  };

  const prev = () => {
    if (len <= 1) return;
    setIndex((i) => (i === 0 ? len - 1 : i - 1));
  };

  const onTouchStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (startXRef.current === null) return;
    const dx = e.changedTouches[0].clientX - startXRef.current;
    startXRef.current = null;
    if (Math.abs(dx) < 40) return;
    if (dx < 0) next();
    else prev();
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (len <= 1) return;
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [len]);

  if (len === 0) return null;

  const leftIndex = len > 1 ? (index - 1 + len) % len : null;
  const rightIndex = len > 1 ? (index + 1) % len : null;

  return (
    <div
      className="relative mb-10 flex items-center justify-center overflow-hidden w-full max-w-[1000px] mx-auto px-4 aspect-video"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* LEFT preview */}
      {leftIndex !== null && (
        <div 
          data-testid="adjacent-photo-left"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-[25%] sm:w-[20%] md:w-[18%] h-[80%] opacity-90 blur-sm scale-90 transition-all duration-500 flex items-center justify-center"
        >
          <img
            src={photos[leftIndex]}
            alt=""
            className="max-w-full max-h-full object-contain rounded-xl"
          />
        </div>
      )}

      {/* RIGHT preview */}
      {rightIndex !== null && (
        <div 
          data-testid="adjacent-photo-right"
          className="absolute right-0 top-1/2 -translate-y-1/2 w-[25%] sm:w-[20%] md:w-[18%] h-[80%] opacity-90 blur-sm scale-90 transition-all duration-500 flex items-center justify-center"
        >
          <img
            src={photos[rightIndex]}
            alt=""
            className="max-w-full max-h-full object-contain rounded-xl"
          />
        </div>
      )}

      {/* CENTER image */}
      <div 
        data-testid="center-photo"
        className="relative z-20 w-[90vw] sm:w-[70vw] md:w-[80%] h-[80vh] max-h-[600px] transition-transform duration-500 flex items-center justify-center"
      >
        <button
          onClick={next}
          className="absolute inset-0 z-30"
          aria-label="Next photo"
        />
        <img
          src={photos[index]}
          alt={`${alt}-${index}`}
          className="max-w-full max-h-full object-contain rounded-xl"
        />
      </div>

      {/* Buttons */}
      {len > 1 && (
        <>
          <button
            data-testid="nav-arrow-prev"
            onClick={prev}
            className="absolute left-2 sm:left-4 z-40 rounded-full bg-black/40 p-2 sm:p-3 text-white hover:bg-black/60 flex items-center justify-center"
            aria-label="Previous photo"
          >
            ‹
          </button>
          <button
            data-testid="nav-arrow-next"
            onClick={next}
            className="absolute right-2 sm:right-4 z-40 rounded-full bg-black/40 p-2 sm:p-3 text-white hover:bg-black/60 flex items-center justify-center"
            aria-label="Next photo"
          >
            ›
          </button>
        </>
      )}

      {/* Index pill */}
      {len > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 rounded-full bg-black/30 px-3 py-1 text-xs sm:text-sm text-white">
          {index + 1} / {len}
        </div>
      )}
    </div>
  );
}
