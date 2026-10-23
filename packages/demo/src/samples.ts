import type { GalleryItem } from "@tbib-image-viewer/core";

// High-fidelity medical and anatomical illustrations encoded as SVG data URIs
function createSvgDataUri(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg.trim())}`;
}

const chestXraySvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 900" width="800" height="900">
  <rect width="800" height="900" fill="#080c14"/>
  <!-- Thoracic Cage Outline -->
  <path d="M 220 180 Q 400 120 580 180 Q 640 400 600 720 Q 400 820 200 720 Q 160 400 220 180 Z" fill="#111927" stroke="#1e293b" stroke-width="4"/>
  <!-- Spine -->
  <rect x="385" y="140" width="30" height="660" rx="6" fill="#475569" opacity="0.6"/>
  <!-- Left & Right Lung Fields -->
  <path d="M 240 220 C 300 200 370 230 375 350 C 380 500 370 650 300 680 C 240 680 200 550 210 400 Z" fill="#020617" opacity="0.85"/>
  <path d="M 560 220 C 500 200 430 230 425 350 C 420 500 430 650 500 680 C 560 680 600 550 590 400 Z" fill="#020617" opacity="0.85"/>
  <!-- Cardiac Silhouette -->
  <path d="M 390 420 Q 450 430 460 520 Q 470 620 400 650 Q 340 640 370 540 Z" fill="#334155" opacity="0.75"/>
  <!-- Ribs (Costal arches) -->
  <g stroke="#334155" stroke-width="8" stroke-linecap="round" fill="none" opacity="0.4">
    <path d="M 240 260 Q 320 280 380 280 M 560 260 Q 480 280 420 280"/>
    <path d="M 220 340 Q 310 370 380 370 M 580 340 Q 490 370 420 370"/>
    <path d="M 210 420 Q 300 460 380 460 M 590 420 Q 500 460 420 460"/>
    <path d="M 205 510 Q 300 560 380 560 M 595 510 Q 500 560 420 560"/>
    <path d="M 215 600 Q 300 650 370 660 M 585 600 Q 500 650 430 660"/>
  </g>
  <!-- Labels -->
  <text x="40" y="80" fill="#94a3b8" font-family="sans-serif" font-size="24" font-weight="bold">CHEST X-RAY (PA VIEW)</text>
  <text x="40" y="115" fill="#64748b" font-family="sans-serif" font-size="16">Patient ID: #TBIB-MED-8492 • Adult Male</text>
  <text x="730" y="80" fill="#ef4444" font-family="sans-serif" font-size="28" font-weight="bold">R</text>
</svg>
`;

const cardiacAnatomySvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800">
  <rect width="800" height="800" fill="#0f172a"/>
  <!-- Aorta Arc -->
  <path d="M 360 320 C 350 180 480 160 500 260 L 520 340 Z" fill="#dc2626" stroke="#991b1b" stroke-width="4"/>
  <!-- Pulmonary Artery -->
  <path d="M 430 290 C 440 220 340 200 320 270 L 300 330 Z" fill="#2563eb" stroke="#1d4ed8" stroke-width="4"/>
  <!-- Left Ventricle -->
  <path d="M 430 380 C 560 410 590 580 470 670 C 410 710 380 660 370 590 Z" fill="#b91c1c" stroke="#7f1d1d" stroke-width="4"/>
  <!-- Right Ventricle -->
  <path d="M 370 390 C 370 580 390 670 330 660 C 250 630 240 480 340 400 Z" fill="#1e40af" stroke="#1e3a8a" stroke-width="4"/>
  <!-- Superior Vena Cava -->
  <rect x="280" y="180" width="45" height="150" rx="10" fill="#1d4ed8"/>
  <!-- Septum line -->
  <path d="M 380 390 C 380 500 390 640 400 680" stroke="#f8fafc" stroke-dasharray="6,6" stroke-width="3" fill="none"/>
  <!-- Title -->
  <text x="50" y="70" fill="#f8fafc" font-family="sans-serif" font-size="24" font-weight="bold">CARDIAC CHAMBERS & GREAT VESSELS</text>
  <text x="50" y="100" fill="#94a3b8" font-family="sans-serif" font-size="16">Cardiovascular Pathology • TBiB Medical Curriculum</text>
</svg>
`;

const brainCtSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800">
  <rect width="800" height="800" fill="#030712"/>
  <!-- Cranium Bone Ring -->
  <circle cx="400" cy="400" r="320" fill="#111827" stroke="#e2e8f0" stroke-width="14"/>
  <!-- Brain Parenchyma -->
  <path d="M 200 400 C 200 240 330 180 400 180 C 470 180 600 240 600 400 C 600 560 470 620 400 620 C 330 620 200 560 200 400 Z" fill="#1f2937" stroke="#374151" stroke-width="3"/>
  <!-- Interhemispheric Fissure -->
  <line x1="400" y1="180" x2="400" y2="620" stroke="#030712" stroke-width="6"/>
  <!-- Lateral Ventricles (Butterfly shape) -->
  <path d="M 370 360 C 350 330 330 380 370 430 C 390 410 390 380 370 360 Z" fill="#030712"/>
  <path d="M 430 360 C 450 330 470 380 430 430 C 410 410 410 380 430 360 Z" fill="#030712"/>
  <!-- Basal Ganglia / Thalamus hints -->
  <circle cx="340" cy="420" r="28" fill="#374151" opacity="0.6"/>
  <circle cx="460" cy="420" r="28" fill="#374151" opacity="0.6"/>
  <!-- Title -->
  <text x="40" y="60" fill="#f8fafc" font-family="sans-serif" font-size="22" font-weight="bold">AXIAL BRAIN CT SCAN</text>
  <text x="40" y="90" fill="#94a3b8" font-family="sans-serif" font-size="14">Ventricular level • Neuroanatomy</text>
  <text x="740" y="60" fill="#ef4444" font-family="sans-serif" font-size="26" font-weight="bold">L</text>
</svg>
`;

export const SAMPLE_GALLERY_IMAGES: GalleryItem[] = [
  {
    id: "sample-chest-xray",
    src: createSvgDataUri(chestXraySvg),
    title: "Thoracic Radiography (PA)",
    description: "Posteroanterior projection showing bilateral clear lung fields and normal cardiothoracic ratio.",
  },
  {
    id: "sample-cardiac-anatomy",
    src: createSvgDataUri(cardiacAnatomySvg),
    title: "Cardiac Cavities & Outflow Tracts",
    description: "Systemic circulation diagram detailing ventricular chambers, ascending aorta and pulmonary trunk.",
  },
  {
    id: "sample-brain-ct",
    src: createSvgDataUri(brainCtSvg),
    title: "Brain CT (Axial Slices)",
    description: "Cross-sectional tomographic imaging depicting lateral ventricles and cortical sulci.",
  },
];
