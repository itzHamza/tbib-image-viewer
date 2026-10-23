import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faImages,
  faExpand,
  faMoon,
  faSun,
  faUpload,
  faCircleCheck,
  faBookMedical,
  faPenFancy,
} from "@fortawesome/free-solid-svg-icons";
import { ImageViewer, ImageGalleryLightbox } from "@tbib-image-viewer/react";
import "@tbib-image-viewer/react/styles.css";
import { SAMPLE_GALLERY_IMAGES } from "./samples";

export const App: React.FC = () => {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [galleryItems, setGalleryItems] = useState(SAMPLE_GALLERY_IMAGES);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"inline" | "lightbox">("inline");

  const currentImage = galleryItems[selectedImageIndex] || galleryItems[0];

  const handleCustomUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const newItem = {
        id: `custom-${Date.now()}`,
        src: result,
        title: file.name,
        description: `Uploaded custom asset (${(file.size / 1024).toFixed(1)} KB)`,
      };
      setGalleryItems((prev) => [newItem, ...prev]);
      setSelectedImageIndex(0);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: theme === "dark" ? "#0b1120" : "#f8fafc",
        color: theme === "dark" ? "#f8fafc" : "#0f172a",
        display: "flex",
        flexDirection: "column",
        transition: "background-color 0.2s ease",
      }}
    >
      {/* Top Header */}
      <header
        style={{
          borderBottom: `1px solid ${theme === "dark" ? "rgba(148, 163, 184, 0.15)" : "rgba(148, 163, 184, 0.3)"}`,
          padding: "14px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
          backgroundColor: theme === "dark" ? "#111b2e" : "#ffffff",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "10px",
              backgroundColor: "rgba(139, 92, 246, 0.18)",
              color: "#8b5cf6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
            }}
          >
            <FontAwesomeIcon icon={faBookMedical} />
          </div>
          <div>
            <h1 style={{ fontSize: "17px", fontWeight: "700", letterSpacing: "-0.01em" }}>
              TBiB Image & Gallery Viewer
            </h1>
            <p style={{ fontSize: "12px", color: theme === "dark" ? "#94a3b8" : "#64748b" }}>
              Interactive medical illustration & radiology suite with hand-free sketch tools
            </p>
          </div>
        </div>

        {/* Global Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {/* Custom image upload button */}
          <label
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "13px",
              fontWeight: "500",
              padding: "7px 12px",
              borderRadius: "10px",
              backgroundColor: theme === "dark" ? "#1e293b" : "#f1f5f9",
              border: `1px solid ${theme === "dark" ? "#334155" : "#cbd5e1"}`,
              color: "inherit",
              cursor: "pointer",
            }}
          >
            <FontAwesomeIcon icon={faUpload} style={{ fontSize: "12px" }} />
            <span>Upload Image</span>
            <input
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleCustomUpload}
            />
          </label>

          {/* Theme Switcher */}
          <button
            type="button"
            onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              backgroundColor: theme === "dark" ? "#1e293b" : "#f1f5f9",
              border: `1px solid ${theme === "dark" ? "#334155" : "#cbd5e1"}`,
              color: "inherit",
              cursor: "pointer",
            }}
            title="Toggle Theme"
          >
            <FontAwesomeIcon icon={theme === "dark" ? faSun : faMoon} />
          </button>
        </div>
      </header>

      {/* Main Content Arena */}
      <main style={{ flex: 1, padding: "20px", maxWidth: "1280px", margin: "0 auto", width: "100%" }}>
        {/* Mode Selector Tabs */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "16px",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              padding: "4px",
              backgroundColor: theme === "dark" ? "#131f37" : "#e2e8f0",
              borderRadius: "12px",
              border: `1px solid ${theme === "dark" ? "rgba(148, 163, 184, 0.15)" : "#cbd5e1"}`,
            }}
          >
            <button
              type="button"
              onClick={() => setActiveTab("inline")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 16px",
                borderRadius: "9px",
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer",
                border: "none",
                backgroundColor: activeTab === "inline" ? (theme === "dark" ? "#8b5cf6" : "#4f46e5") : "transparent",
                color: activeTab === "inline" ? "#ffffff" : "inherit",
                transition: "all 0.15s ease",
              }}
            >
              <FontAwesomeIcon icon={faPenFancy} />
              <span>Inline Embed Viewer</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("lightbox");
                setIsLightboxOpen(true);
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 16px",
                borderRadius: "9px",
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer",
                border: "none",
                backgroundColor: activeTab === "lightbox" ? (theme === "dark" ? "#8b5cf6" : "#4f46e5") : "transparent",
                color: activeTab === "lightbox" ? "#ffffff" : "inherit",
                transition: "all 0.15s ease",
              }}
            >
              <FontAwesomeIcon icon={faImages} />
              <span>Swipe Gallery Lightbox</span>
            </button>
          </div>

          {/* Quick Trigger Button for Lightbox */}
          <button
            type="button"
            onClick={() => setIsLightboxOpen(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 16px",
              borderRadius: "10px",
              backgroundColor: "#8b5cf6",
              color: "#ffffff",
              border: "none",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(139, 92, 246, 0.35)",
            }}
          >
            <FontAwesomeIcon icon={faExpand} />
            <span>Open Fullscreen Gallery</span>
          </button>
        </div>

        {/* Gallery Thumbnails Selector */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            marginBottom: "16px",
            overflowX: "auto",
            paddingBottom: "8px",
          }}
        >
          {galleryItems.map((item, idx) => (
            <div
              key={item.id}
              onClick={() => setSelectedImageIndex(idx)}
              style={{
                padding: "8px 12px",
                borderRadius: "12px",
                backgroundColor: selectedImageIndex === idx
                  ? (theme === "dark" ? "#1e293b" : "#ffffff")
                  : (theme === "dark" ? "#131f37" : "#f1f5f9"),
                border: `2px solid ${selectedImageIndex === idx ? "#8b5cf6" : "transparent"}`,
                cursor: "pointer",
                minWidth: "180px",
                transition: "all 0.15s ease",
              }}
            >
              <p style={{ fontSize: "13px", fontWeight: "600", marginBottom: "2px" }}>
                {item.title}
              </p>
              <p style={{ fontSize: "11px", color: theme === "dark" ? "#94a3b8" : "#64748b" }}>
                Slide #{idx + 1}
              </p>
            </div>
          ))}
        </div>

        {/* Viewer Box */}
        <div
          style={{
            height: "640px",
            borderRadius: "16px",
            overflow: "hidden",
            border: `1px solid ${theme === "dark" ? "rgba(148, 163, 184, 0.2)" : "rgba(148, 163, 184, 0.35)"}`,
            boxShadow: theme === "dark" ? "0 20px 30px rgba(0,0,0,0.5)" : "0 10px 25px rgba(0,0,0,0.08)",
          }}
        >
          <ImageViewer
            key={currentImage.id}
            src={currentImage.src}
            alt={currentImage.title}
            theme={theme}
            slideId={currentImage.id}
            initialTool="hand"
          />
        </div>

        {/* Feature List Cards */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "16px",
            marginTop: "24px",
          }}
        >
          <div
            style={{
              padding: "16px",
              borderRadius: "14px",
              backgroundColor: theme === "dark" ? "#131f37" : "#ffffff",
              border: `1px solid ${theme === "dark" ? "rgba(148,163,184,0.15)" : "#e2e8f0"}`,
            }}
          >
            <h3 style={{ fontSize: "14px", fontWeight: "700", marginBottom: "6px" }}>
              <FontAwesomeIcon icon={faCircleCheck} style={{ color: "#10b981", marginRight: "8px" }} />
              Hand-Free Sketch Suite
            </h3>
            <p style={{ fontSize: "12px", color: theme === "dark" ? "#94a3b8" : "#64748b", lineHeight: "1.5" }}>
              Bézier-smoothed Pen, semi-transparent multiply Highlighter, and precision stroke Eraser locked directly to image coordinates.
            </p>
          </div>

          <div
            style={{
              padding: "16px",
              borderRadius: "14px",
              backgroundColor: theme === "dark" ? "#131f37" : "#ffffff",
              border: `1px solid ${theme === "dark" ? "rgba(148,163,184,0.15)" : "#e2e8f0"}`,
            }}
          >
            <h3 style={{ fontSize: "14px", fontWeight: "700", marginBottom: "6px" }}>
              <FontAwesomeIcon icon={faCircleCheck} style={{ color: "#10b981", marginRight: "8px" }} />
              WebGL Laser Pointer
            </h3>
            <p style={{ fontSize: "12px", color: theme === "dark" ? "#94a3b8" : "#64748b", lineHeight: "1.5" }}>
              High-performance 60fps OGL WebGL shader with dynamic hotspot, energy aura, and automatic fading trail.
            </p>
          </div>

          <div
            style={{
              padding: "16px",
              borderRadius: "14px",
              backgroundColor: theme === "dark" ? "#131f37" : "#ffffff",
              border: `1px solid ${theme === "dark" ? "rgba(148,163,184,0.15)" : "#e2e8f0"}`,
            }}
          >
            <h3 style={{ fontSize: "14px", fontWeight: "700", marginBottom: "6px" }}>
              <FontAwesomeIcon icon={faCircleCheck} style={{ color: "#10b981", marginRight: "8px" }} />
              PhotoSwipe-Like Gallery
            </h3>
            <p style={{ fontSize: "12px", color: theme === "dark" ? "#94a3b8" : "#64748b", lineHeight: "1.5" }}>
              Mobile touch swipe gestures, multi-touch pinch-to-zoom, side navigation arrows, and bottom thumbnail strip.
            </p>
          </div>

          <div
            style={{
              padding: "16px",
              borderRadius: "14px",
              backgroundColor: theme === "dark" ? "#131f37" : "#ffffff",
              border: `1px solid ${theme === "dark" ? "rgba(148,163,184,0.15)" : "#e2e8f0"}`,
            }}
          >
            <h3 style={{ fontSize: "14px", fontWeight: "700", marginBottom: "6px" }}>
              <FontAwesomeIcon icon={faCircleCheck} style={{ color: "#10b981", marginRight: "8px" }} />
              Native-Res Download
            </h3>
            <p style={{ fontSize: "12px", color: theme === "dark" ? "#94a3b8" : "#64748b", lineHeight: "1.5" }}>
              Burns annotations directly onto the source image dimensions off-screen without losing a single pixel of quality.
            </p>
          </div>
        </section>
      </main>

      {/* Lightbox Modal */}
      <ImageGalleryLightbox
        isOpen={isLightboxOpen}
        items={galleryItems}
        activeIndex={selectedImageIndex}
        onIndexChange={setSelectedImageIndex}
        onClose={() => setIsLightboxOpen(false)}
        theme={theme}
      />
    </div>
  );
};
