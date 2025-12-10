import { useState, useRef, useCallback, useEffect } from 'react';
import type { CoverImagePosition } from '../types';

interface CoverImageEditorProps {
  imageUrl: string;
  position: CoverImagePosition;
  onPositionChange: (position: CoverImagePosition) => void;
}

const DEFAULT_POSITION: CoverImagePosition = {
  x: 50,
  y: 50,
  zoom: 100,
};

export function CoverImageEditor({ imageUrl, position, onPositionChange }: CoverImageEditorProps) {
  const [localPosition, setLocalPosition] = useState<CoverImagePosition>(position);
  const [isDragging, setIsDragging] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef({ startX: 0, startY: 0, startPosX: 0, startPosY: 0 });

  useEffect(() => {
    setLocalPosition(position);
  }, [position]);

  useEffect(() => {
    onPositionChange(localPosition);
  }, [localPosition, onPositionChange]);

  const handleDragStart = useCallback((clientX: number, clientY: number) => {
    setIsDragging(true);
    dragStateRef.current = {
      startX: clientX,
      startY: clientY,
      startPosX: localPosition.x,
      startPosY: localPosition.y,
    };
  }, [localPosition]);

  const handleDragMove = useCallback((clientX: number, clientY: number) => {
    if (!isDragging || !previewRef.current) return;

    const { startX, startY, startPosX, startPosY } = dragStateRef.current;
    const deltaX = clientX - startX;
    const deltaY = clientY - startY;

    const containerWidth = previewRef.current.offsetWidth;
    const containerHeight = previewRef.current.offsetHeight;

    const deltaXPercent = (deltaX / containerWidth) * 100;
    const deltaYPercent = (deltaY / containerHeight) * 100;

    // Calculate bounds based on zoom - prevent showing background
    const zoomFactor = localPosition.zoom / 100;
    const maxOffset = ((zoomFactor - 1) / zoomFactor) * 50;
    
    const minX = 50 - maxOffset;
    const maxX = 50 + maxOffset;
    const minY = 50 - maxOffset;
    const maxY = 50 + maxOffset;

    const newX = Math.max(minX, Math.min(maxX, startPosX - deltaXPercent));
    const newY = Math.max(minY, Math.min(maxY, startPosY - deltaYPercent));

    setLocalPosition(prev => ({
      ...prev,
      x: newX,
      y: newY,
    }));
  }, [isDragging, localPosition.zoom]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    handleDragStart(e.clientX, e.clientY);
  }, [handleDragStart]);

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1) {
      handleDragStart(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, [handleDragStart]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      handleDragMove(e.clientX, e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        handleDragMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handleEnd = () => {
      handleDragEnd();
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchend', handleEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  return (
    <div className="space-y-6">
      {/* Preview Area */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-slate-700">
            Cover Image Preview
          </label>
          <span className="text-xs text-slate-500">16:9 Aspect Ratio</span>
        </div>
        
        <div>
          {/* Main Preview */}
          <div
            ref={previewRef}
            className={`relative w-full bg-slate-100 rounded-xl overflow-hidden border-2 transition-colors shadow-sm ${
              isDragging ? 'border-sky-500 cursor-grabbing' : 'border-slate-300 cursor-grab'
            }`}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            style={{ aspectRatio: '16/9' }}
          >
            {/* Zoomed image - always fills frame */}
            <img
              src={imageUrl}
              alt="Cover preview"
              className="absolute pointer-events-none select-none"
              style={{
                width: `${localPosition.zoom}%`,
                height: `${localPosition.zoom}%`,
                objectFit: 'cover',
                left: `${localPosition.x}%`,
                top: `${localPosition.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
              draggable={false}
            />

            {/* Grid overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-20">
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="border border-slate-400"></div>
                ))}
              </div>
            </div>

            {/* Center crosshair */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-slate-400 rounded-full opacity-30"></div>
            </div>
            
            {/* Drag hint overlay */}
            {!isDragging && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-white bg-opacity-90 px-4 py-2 rounded-lg shadow-lg">
                  <p className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                    </svg>
                    Drag to reposition
                  </p>
                </div>
              </div>
            )}
          </div>
          <p className="text-xs text-slate-500 italic mt-2">
            Drag the image to reposition. Use zoom slider below to zoom in.
          </p>
        </div>
      </div>

      {/* Zoom Slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="zoom-slider" className="block text-sm font-medium text-slate-700">
            Zoom
          </label>
          <span className="text-sm font-semibold text-sky-600">{localPosition.zoom}%</span>
        </div>
        <input
          id="zoom-slider"
          type="range"
          min="100"
          max="200"
          step="1"
          value={localPosition.zoom}
          onChange={(e) => setLocalPosition(prev => ({ ...prev, zoom: Number(e.target.value) }))}
          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer slider-thumb"
        />
        <div className="flex justify-between text-xs text-slate-500">
          <span>100% (Fit)</span>
          <span>200% (Max Zoom)</span>
        </div>
      </div>

      {/* Reset Button */}
      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={() => setLocalPosition(DEFAULT_POSITION)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors duration-200"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Reset to Default
        </button>
      </div>
    </div>
  );
}