import React, { useEffect, useRef, type HTMLAttributes } from "react";
import { Mesh, Program, Renderer, Triangle } from "ogl";

const MAX_POINTS = 64;

export interface LaserCursorLayerProps extends Omit<HTMLAttributes<HTMLDivElement>, "color"> {
  color?: string;
  secondaryColor?: string;
  trailLength?: number;
  trailWidth?: number;
  trailTaper?: number;
  followSpeed?: number;
  glowIntensity?: number;
  glowSpread?: number;
  hotspot?: number;
  brightness?: number;
  opacity?: number;
  pulseSpeed?: number;
  noiseStrength?: number;
  idleFade?: boolean;
  idleTimeout?: number;
  fadeDuration?: number;
  enabled?: boolean;
}

const VERTEX_SHADER = `
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `
precision highp float;

#define MAX_POINTS 64

uniform vec2 uResolution;
uniform vec2 uPoints[MAX_POINTS];
uniform float uPointCount;
uniform vec3 uColor;
uniform vec3 uSecondaryColor;
uniform float uTrailWidth;
uniform float uTaper;
uniform float uGlowIntensity;
uniform float uGlowSpread;
uniform float uHotspot;
uniform float uBrightness;
uniform float uOpacity;
uniform float uPulseSpeed;
uniform float uNoiseStrength;
uniform float uTime;
uniform float uFade;

varying vec2 vUv;

float sRGB(float x) {
  if (x <= 0.00031308) return 12.92 * x;
  return 1.055 * pow(x, 1.0 / 2.4) - 0.055;
}

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float filmGrain(vec2 p, float time) {
  float frame = time * 18.0;
  float frameIndex = mod(floor(frame), 256.0);
  float nextFrameIndex = mod(frameIndex + 1.0, 256.0);
  float blend = fract(frame);
  blend = blend * blend * (3.0 - 2.0 * blend);
  vec2 pixel = floor(p);
  float current = hash(pixel + vec2(frameIndex * 17.0, frameIndex * 31.0));
  float next = hash(pixel + vec2(nextFrameIndex * 17.0, nextFrameIndex * 31.0));
  return mix(current, next, blend) * 2.0 - 1.0;
}

void main() {
  vec2 pixel = vUv * uResolution;
  float denominator = max(uPointCount - 1.0, 1.0);
  float strongest = 0.0;
  float strongestCore = 0.0;
  float colorWeight = 0.0;
  vec3 colorSum = vec3(0.0);

  for (int i = 0; i < MAX_POINTS - 1; i++) {
    float index = float(i);
    vec2 start = uPoints[i];
    vec2 end = uPoints[i + 1];
    vec2 toPixel = pixel - start;
    vec2 segment = end - start;
    float along = clamp(dot(toPixel, segment) / max(dot(segment, segment), 0.0001), 0.0, 1.0);
    float progress = clamp((index + along) / denominator, 0.0, 1.0);
    float life = pow(max(1.0 - progress, 0.0), mix(0.55, 1.25, uTaper));
    float width = uTrailWidth * mix(1.0, 0.25, pow(progress, mix(0.55, 1.6, uTaper)));
    float distanceToTrail = length(toPixel - segment * along);
    float falloff = max(width * (0.8 + uGlowSpread * 1.4), 0.5);
    float beam = min(1.0, (falloff * falloff) / (distanceToTrail * distanceToTrail + falloff * falloff));
    float core = exp(-pow(distanceToTrail / max(width, 0.5), 2.0) * 2.5);
    float pulseAmount = min(abs(uPulseSpeed), 1.0);
    float pulse = 1.0 + sin(uTime * uPulseSpeed * 3.0 - progress * 11.0) * 0.16 * pulseAmount;
    float intensity = (core + beam * uGlowIntensity * 0.55) * life * pulse;
    vec3 segmentColor = mix(uColor, uSecondaryColor, progress);

    strongest = max(strongest, intensity);
    strongestCore = max(strongestCore, core * life);
    colorSum += segmentColor * intensity;
    colorWeight += intensity;
  }

  float grain = filmGrain(pixel, uTime);
  float noiseAmount = (1.0 - exp(-uNoiseStrength * 2.2)) * 0.4;
  float alpha = clamp(strongest * uOpacity * uFade, 0.0, 1.0);
  if (alpha < 0.0005) discard;

  vec3 color = colorSum / max(colorWeight, 0.0001);
  color = mix(color, vec3(1.0), smoothstep(0.25, 0.95, strongestCore) * uHotspot);
  float luminance = sRGB(clamp(strongest * uBrightness, 0.0, 1.0));
  luminance *= 1.0 + grain * noiseAmount;
  vec3 additiveColor = color * luminance;
  float normalAlpha = clamp(strongest * uBrightness * uOpacity * uFade, 0.0, 1.0);
  vec3 normalColor = mix(color, vec3(1.0), smoothstep(0.45, 1.0, strongestCore) * uHotspot * 0.35);
  gl_FragColor = vec4(mix(additiveColor, normalColor, 1.0), mix(alpha, normalAlpha, 1.0));
}
`;

function hexToRgb(hex: string): [number, number, number] {
  let value = (hex || "").replace("#", "").trim();
  if (value.length === 3) {
    value = value.split("").map((c) => c + c).join("");
  }
  const parsed = Number.parseInt(value || "ff0000", 16);
  return [
    ((parsed >> 16) & 255) / 255,
    ((parsed >> 8) & 255) / 255,
    (parsed & 255) / 255,
  ];
}

export const LaserCursorLayer: React.FC<LaserCursorLayerProps> = ({
  color = "#ef4444",
  secondaryColor = "#ef4444",
  trailLength = 29,
  trailWidth = 8,
  trailTaper = 0.22,
  followSpeed = 1.5,
  glowIntensity = 1.9,
  glowSpread = 0.1,
  hotspot = 0.5,
  brightness = 1.25,
  opacity = 1,
  pulseSpeed = 0.8,
  noiseStrength = 0.035,
  idleFade = true,
  idleTimeout = 700,
  fadeDuration = 1500,
  enabled = true,
  className = "",
  style,
  ...rest
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas || !enabled) return;

    let renderer: Renderer | null = null;
    try {
      renderer = new Renderer({
        canvas,
        alpha: true,
        dpr: Math.min(window.devicePixelRatio || 1, 1.5),
      });
    } catch {
      return;
    }

    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);

    const pointData = Array(MAX_POINTS * 2).fill(0);
    const points = Array.from({ length: MAX_POINTS }, () => ({ x: 0, y: 0 }));
    const target = { x: 0, y: 0 };
    const head = { x: 0, y: 0 };

    let program: Program;
    let mesh: Mesh;
    try {
      program = new Program(gl, {
        vertex: VERTEX_SHADER,
        fragment: FRAGMENT_SHADER,
        uniforms: {
          uResolution: { value: [1, 1] },
          uPoints: { value: pointData },
          uPointCount: { value: trailLength },
          uColor: { value: hexToRgb(color) },
          uSecondaryColor: { value: hexToRgb(secondaryColor) },
          uTrailWidth: { value: trailWidth },
          uTaper: { value: trailTaper },
          uGlowIntensity: { value: glowIntensity },
          uGlowSpread: { value: glowSpread },
          uHotspot: { value: hotspot },
          uBrightness: { value: brightness },
          uOpacity: { value: opacity },
          uPulseSpeed: { value: pulseSpeed },
          uNoiseStrength: { value: noiseStrength },
          uTime: { value: 0 },
          uFade: { value: 0 },
        },
        transparent: true,
        depthTest: false,
        depthWrite: false,
      });
      mesh = new Mesh(gl, { geometry: new Triangle(gl), program });
    } catch {
      return;
    }

    let width = 0;
    let height = 0;
    let isHovered = false;
    let lastMoveTime = 0;
    let animationId: number;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const newWidth = Math.floor(rect.width);
      const newHeight = Math.floor(rect.height);
      if (newWidth <= 0 || newHeight <= 0) return;
      if (newWidth === width && newHeight === height) return;
      width = newWidth;
      height = newHeight;
      renderer?.setSize(width, height);
      program.uniforms.uResolution.value = [width, height];
    };

    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    const onPointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      target.x = e.clientX - rect.left;
      target.y = rect.height - (e.clientY - rect.top);
      lastMoveTime = performance.now();
      isHovered = true;
    };

    const onPointerLeave = () => {
      isHovered = false;
    };

    container.addEventListener("pointermove", onPointerMove);
    container.addEventListener("pointerleave", onPointerLeave);

    let lastTime = performance.now();

    const render = (now: number) => {
      animationId = requestAnimationFrame(render);
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // Follow target smoothly
      const speed = followSpeed * 20;
      head.x += (target.x - head.x) * Math.min(dt * speed, 1);
      head.y += (target.y - head.y) * Math.min(dt * speed, 1);

      // Shift trail points
      for (let i = MAX_POINTS - 1; i > 0; i--) {
        points[i].x = points[i - 1].x;
        points[i].y = points[i - 1].y;
      }
      points[0].x = head.x;
      points[0].y = head.y;

      for (let i = 0; i < MAX_POINTS; i++) {
        pointData[i * 2] = points[i].x;
        pointData[i * 2 + 1] = points[i].y;
      }

      program.uniforms.uTime.value = now * 0.001;

      // Fade handling
      let fade = 1.0;
      if (idleFade) {
        const idleTime = now - lastMoveTime;
        if (!isHovered || idleTime > idleTimeout) {
          const fadeProgress = Math.min(Math.max((idleTime - idleTimeout) / fadeDuration, 0), 1);
          fade = 1.0 - fadeProgress;
        }
      }
      program.uniforms.uFade.value = fade;

      if (fade > 0.001) {
        renderer?.render({ scene: mesh });
      } else {
        gl.clear(gl.COLOR_BUFFER_BIT);
      }
    };

    animationId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerleave", onPointerLeave);
    };
  }, [
    color,
    secondaryColor,
    trailLength,
    trailWidth,
    trailTaper,
    followSpeed,
    glowIntensity,
    glowSpread,
    hotspot,
    brightness,
    opacity,
    pulseSpeed,
    noiseStrength,
    idleFade,
    idleTimeout,
    fadeDuration,
    enabled,
  ]);

  return (
    <div
      ref={containerRef}
      className={`tbib-iv-laser-layer ${className}`}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "auto",
        touchAction: "none",
        cursor: "crosshair",
        zIndex: 30,
        overflow: "hidden",
        ...style,
      }}
      {...rest}
    >
      <canvas
        ref={canvasRef}
        className="tbib-iv-laser-canvas"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          display: "block",
          pointerEvents: "none",
        }}
      />
    </div>
  );
};
