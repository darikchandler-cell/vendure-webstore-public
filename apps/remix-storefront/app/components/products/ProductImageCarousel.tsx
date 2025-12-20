/**
 * Product Image Carousel Component
 * High-res image gallery with thumbnail navigation, zoom, and video support
 */

import { useState } from 'react';
import { PhotoIcon, PlayIcon } from '@heroicons/react/24/solid';
import { MagnifyingGlassPlusIcon } from '@heroicons/react/24/outline';

interface Asset {
  id: string;
  preview: string;
  name?: string;
  type?: string;
}

interface ProductImageCarouselProps {
  assets: Asset[];
  featuredAsset?: Asset;
  productName: string;
  onAssetChange?: (asset: Asset) => void;
}

export function ProductImageCarousel({
  assets,
  featuredAsset,
  productName,
  onAssetChange,
}: ProductImageCarouselProps) {
  const [selectedAsset, setSelectedAsset] = useState<Asset | undefined>(
    featuredAsset || assets[0],
  );
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });

  if (!assets || assets.length === 0) {
    return (
      <div className="w-full aspect-square glass-card rounded-xl flex items-center justify-center">
        <PhotoIcon className="w-24 h-24 text-white/30" />
      </div>
    );
  }

  const currentAsset = selectedAsset || assets[0];
  const isVideo =
    currentAsset.type === 'video' || currentAsset.preview.includes('.mp4');

  const handleThumbnailClick = (asset: Asset) => {
    setSelectedAsset(asset);
    setIsZoomed(false);
    onAssetChange?.(asset);
  };

  const handleImageMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isZoomed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPosition({ x, y });
  };

  const handleImageClick = () => {
    setIsZoomed(!isZoomed);
  };

  return (
    <div className="w-full">
      {/* Main Image/Video Display */}
      <div className="relative w-full aspect-square glass-card rounded-xl overflow-hidden mb-4">
        {isVideo ? (
          <video
            className="w-full h-full object-cover"
            controls
            src={currentAsset.preview}
            aria-label={productName}
          >
            Your browser does not support the video tag.
          </video>
        ) : (
          <div
            className="relative w-full h-full cursor-zoom-in"
            onMouseMove={handleImageMouseMove}
            onClick={handleImageClick}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleImageClick();
              }
            }}
            role="button"
            tabIndex={0}
            aria-label="Click to zoom image"
          >
            <img
              src={currentAsset.preview + '?w=800'}
              alt={currentAsset.name || productName}
              className={`w-full h-full object-cover transition-transform duration-300 ${
                isZoomed ? 'scale-150' : ''
              }`}
              style={
                isZoomed
                  ? {
                      transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                    }
                  : {}
              }
            />
            {!isZoomed && (
              <div
                className="absolute bottom-4 right-4 glass-button p-2 rounded-lg opacity-0 hover:opacity-100 transition-opacity"
                aria-hidden="true"
              >
                <MagnifyingGlassPlusIcon className="w-5 h-5 text-white" />
              </div>
            )}
            {isVideo && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="glass-button p-4 rounded-full">
                  <PlayIcon className="w-12 h-12 text-white" />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Thumbnail Navigation */}
      {assets.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {assets.map((asset) => {
            const isSelected = asset.id === currentAsset.id;
            const isAssetVideo =
              asset.type === 'video' || asset.preview.includes('.mp4');

            return (
              <button
                key={asset.id}
                onClick={() => handleThumbnailClick(asset)}
                className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                  isSelected
                    ? 'border-white/60 ring-2 ring-white/30'
                    : 'border-white/20 hover:border-white/40'
                }`}
                aria-label={`View ${asset.name || 'image'}`}
              >
                {isAssetVideo ? (
                  <div className="relative w-full h-full">
                    <img
                      src={asset.preview + '?w=80&h=80'}
                      alt={asset.name || 'Video thumbnail'}
                      className="w-full h-full object-cover opacity-60"
                    />
                    <PlayIcon className="absolute inset-0 m-auto w-6 h-6 text-white" />
                  </div>
                ) : (
                  <img
                    src={asset.preview + '?w=80&h=80'}
                    alt={asset.name || 'Thumbnail'}
                    className="w-full h-full object-cover"
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
