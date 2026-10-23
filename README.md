# 🖼️ TBiB Image Viewer & Gallery

[![npm version (react)](https://img.shields.io/npm/v/@tbib-image-viewer/react.svg?color=8b5cf6&label=react)](https://www.npmjs.com/package/@tbib-image-viewer/react)
[![npm version (core)](https://img.shields.io/npm/v/@tbib-image-viewer/core.svg?color=8b5cf6&label=core)](https://www.npmjs.com/package/@tbib-image-viewer/core)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

An open-source, high-performance, interactive **Image Viewer & Multi-Image Swipe Gallery** with hand-free annotation tools (Pen, Highlighter, Laser pointer, Eraser), GPU-accelerated pan & zoom, mobile touch swipe gestures, and high-resolution export.

---

## ✨ Features

- 🎨 **Hand-Free Annotation Suite**:
  - **Pen**: Smooth Bézier quadratic path interpolation with customizable palette and stroke width.
  - **Highlighter**: Semi-transparent highlighter (`rgba(..., 0.35)`) with multiply blend mode for clinical illustrations.
  - **Laser Pointer**: High-performance 60fps WebGL (`ogl`) shader with neon energy hotspot and trailing decay fade.
  - **Eraser**: Instant stroke-proximity eraser for correcting markings.
  - **Undo / Redo & Clear**: Complete history stack per slide (`Ctrl+Z`, `Ctrl+Y`).
- 📱 **PhotoSwipe-Style Mobile Gestures**:
  - **1-Finger Drag**: Fluid pan across high-res imagery in Hand mode.
  - **1-Finger Swipe**: Smooth slide transitions between gallery images on touch screens.
  - **2-Finger Pinch**: GPU-accelerated pinch-to-zoom centered on focal touch points.
  - **Side Navigation & Thumbnails**: Desktop arrow navigation and collapsible bottom thumbnail drawer.
- 📐 **Image-Space Coordinate Locking**:
  - Drawings are locked directly to native image coordinates `[0..1]`. Zooming (100% to 800%), panning, and rotating (90° steps) never drifts annotations.
- 💾 **Native-Resolution Download**:
  - Burns annotations directly onto an off-screen canvas at the source image's native resolution, exporting crisp PNG/JPEG without quality loss.
  - Clean image download & JSON stroke data export.
- 💎 **DESIGN.md Compliant**:
  - 100% Font Awesome vector icons (zero `lucide-react`).
  - Signature **Midnight Ocean** dark mode & **Warm Parchment** light mode.
  - Tabular numbers (`tabular-nums`) and safe area insets on mobile notches.
- ⚡ **Lightweight Core**: Framework-agnostic coordinate math and export logic separated into `@tbib-image-viewer/core`.

---

## 📦 Packages

| Package | Description | Version |
|---|---|---|
| [`@tbib-image-viewer/core`](https://www.npmjs.com/package/@tbib-image-viewer/core) | Framework-agnostic coordinate transforms, stroke engine, and canvas export | [![npm](https://img.shields.io/npm/v/@tbib-image-viewer/core)](https://www.npmjs.com/package/@tbib-image-viewer/core) |
| [`@tbib-image-viewer/react`](https://www.npmjs.com/package/@tbib-image-viewer/react) | Ready-to-use React components (`<ImageViewer />`, `<ImageGalleryLightbox />`) | [![npm](https://img.shields.io/npm/v/@tbib-image-viewer/react)](https://www.npmjs.com/package/@tbib-image-viewer/react) |

---

## 🚀 Quick Start

### 1. Install

```bash
npm install @tbib-image-viewer/react @tbib-image-viewer/core @fortawesome/react-fontawesome @fortawesome/free-solid-svg-icons ogl
```

### 2. Standalone Inline Viewer

```tsx
import React from "react";
import { ImageViewer } from "@tbib-image-viewer/react";
import "@tbib-image-viewer/react/styles.css";

export function MedicalViewer() {
  return (
    <div style={{ height: "600px", width: "100%" }}>
      <ImageViewer
        src="/path/to/chest-xray.png"
        alt="Chest X-Ray (PA)"
        theme="dark"
        initialTool="pen"
        initialColor="#ef4444"
      />
    </div>
  );
}
```

### 3. Fullscreen Swipe Gallery Lightbox

```tsx
import React, { useState } from "react";
import { ImageGalleryLightbox } from "@tbib-image-viewer/react";
import "@tbib-image-viewer/react/styles.css";

const IMAGES = [
  { id: "1", src: "/xray.png", title: "Chest Radiography" },
  { id: "2", src: "/ct.png", title: "Brain CT" },
  { id: "3", src: "/mri.png", title: "Cardiac MRI" },
];

export function GalleryPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [index, setIndex] = useState(0);

  return (
    <div>
      <button onClick={() => setIsOpen(true)}>Open Gallery</button>
      <ImageGalleryLightbox
        isOpen={isOpen}
        items={IMAGES}
        activeIndex={index}
        onIndexChange={setIndex}
        onClose={() => setIsOpen(false)}
        theme="dark"
      />
    </div>
  );
}
```

---

## 🎛️ Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl + Z` / `Cmd + Z` | Undo last stroke |
| `Ctrl + Y` / `Cmd + Shift + Z` | Redo stroke |
| `+` / `=` | Zoom In |
| `-` | Zoom Out |
| `0` | Reset Fit to Screen |
| `←` / `→` | Previous / Next Image in Gallery |
| `Esc` | Close Lightbox Modal |

---

## 📄 License

MIT © [TBiB Space](https://tbib.space)
