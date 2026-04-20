import { useEffect, useState } from "react";

import Grainient from "@/components/Grainient";

const lightBackground = {
  color1: "#fafafa",
  color2: "#00897b",
  color3: "#fafafa",
  timeSpeed: 0,
  colorBalance: 0.01,
  warpStrength: 1.65,
  warpFrequency: 4.9,
  warpSpeed: 0,
  warpAmplitude: 50,
  blendAngle: -145,
  blendSoftness: 0,
  rotationAmount: 970,
  noiseScale: 2,
  grainAmount: 0.12,
  grainScale: 2,
  grainAnimated: false,
  contrast: 1.15,
  gamma: 0.75,
  saturation: 1,
  centerX: -0.04,
  centerY: 0.22,
  zoom: 2.55,
};

const darkBackground = {
  color1: "#00897b",
  color2: "#fafafa",
  color3: "#00897b",
  timeSpeed: 0,
  colorBalance: 0.06,
  warpStrength: 1.5,
  warpFrequency: 10.6,
  warpSpeed: 0,
  warpAmplitude: 23,
  blendAngle: 85,
  blendSoftness: 0,
  rotationAmount: 970,
  noiseScale: 2,
  grainAmount: 0.12,
  grainScale: 2,
  grainAnimated: false,
  contrast: 1.15,
  gamma: 0.75,
  saturation: 1,
  centerX: -0.09,
  centerY: 1,
  zoom: 2.55,
};

export function SiteBackground() {
  const [isDark, setIsDark] = useState(() =>
    typeof document !== "undefined" && document.documentElement.classList.contains("dark")
  );

  useEffect(() => {
    const root = document.documentElement;
    const syncTheme = () => {
      setIsDark(root.classList.contains("dark"));
    };

    syncTheme();

    const observer = new MutationObserver(syncTheme);
    observer.observe(root, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <Grainient {...(isDark ? darkBackground : lightBackground)} className="h-full w-full" />
    </div>
  );
}
