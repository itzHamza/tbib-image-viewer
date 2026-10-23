# @tbib-image-viewer/core

Framework-agnostic coordinate math, annotation engine, stroke smoothing, and native-res canvas export for TBiB Image Viewer.

## Installation

```bash
npm install @tbib-image-viewer/core
```

## Features

- **Normalized Image Transforms**: Point conversions between screen pixels and normalized image coordinate space `[0..1]`.
- **Stroke Smoothing**: Bézier quadratic interpolation for anti-aliased freehand drawing.
- **Annotation Store**: Per-slide history management with undo/redo stacks and JSON serialization.
- **Native-Res Offscreen Exporter**: High-resolution canvas rendering that burns annotations onto images at original image dimensions without quality loss.

## Documentation

See main repository: [https://github.com/itzHamza/tbib-image-viewer](https://github.com/itzHamza/tbib-image-viewer)

## License

MIT © [TBiB Space](https://tbib.space)
