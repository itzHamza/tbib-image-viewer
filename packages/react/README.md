# @tbib-image-viewer/react

Interactive React Image Viewer & Swipe Gallery with Hand-Free Annotation Suite (Pen, Highlighter, WebGL Laser, Eraser), pan & zoom, mobile touch gestures, and high-res export.

## Installation

```bash
npm install @tbib-image-viewer/react @tbib-image-viewer/core @fortawesome/react-fontawesome @fortawesome/free-solid-svg-icons ogl
```

## Quick Start

```tsx
import React from "react";
import { ImageViewer } from "@tbib-image-viewer/react";
import "@tbib-image-viewer/react/styles.css";

export function App() {
  return (
    <div style={{ height: "600px", width: "100%" }}>
      <ImageViewer
        src="/path/to/image.png"
        theme="dark"
        initialTool="pen"
        initialColor="#ef4444"
      />
    </div>
  );
}
```

## Fullscreen Swipe Lightbox Modal

```tsx
import React, { useState } from "react";
import { ImageGalleryLightbox } from "@tbib-image-viewer/react";
import "@tbib-image-viewer/react/styles.css";

export function Gallery() {
  const [isOpen, setIsOpen] = useState(false);
  const items = [
    { id: "1", src: "/img1.png", title: "Slide 1" },
    { id: "2", src: "/img2.png", title: "Slide 2" },
  ];

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Open Gallery</button>
      <ImageGalleryLightbox
        isOpen={isOpen}
        items={items}
        onClose={() => setIsOpen(false)}
        theme="dark"
      />
    </>
  );
}
```

## Documentation

Full documentation & interactive demo: [https://github.com/itzHamza/tbib-image-viewer](https://github.com/itzHamza/tbib-image-viewer)

## License

MIT © [TBiB Space](https://tbib.space)
