import React from "react";
import type { GalleryItem } from "@tbib-image-viewer/core";

export interface ThumbnailStripProps {
  items: GalleryItem[];
  activeIndex: number;
  onSelect: (index: number) => void;
}

export const ThumbnailStrip: React.FC<ThumbnailStripProps> = ({
  items,
  activeIndex,
  onSelect,
}) => {
  if (items.length <= 1) return null;

  return (
    <div className="tbib-iv-thumbnail-strip">
      {items.map((item, idx) => (
        <button
          key={item.id || idx}
          type="button"
          className={`tbib-iv-thumbnail-item ${idx === activeIndex ? "tbib-iv-thumbnail-item-active" : ""}`}
          onClick={() => onSelect(idx)}
          title={item.title || `Image ${idx + 1}`}
        >
          <img
            src={item.thumbnailSrc || item.src}
            alt={item.alt || `Thumb ${idx + 1}`}
            className="tbib-iv-thumbnail-img"
            loading="lazy"
          />
        </button>
      ))}
    </div>
  );
};
