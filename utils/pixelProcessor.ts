import { PixelSize } from "../types";

/**
 * Converts a Base64 image into a grid of colors corresponding to the selected pixel size.
 * It essentially downsamples the high-res AI image to the target resolution.
 */
export const processImageToGrid = async (imageUrl: string, size: PixelSize): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      // Draw the image scaled down to the target pixel size.
      // High quality smoothing helps represent the shapes correctly before we quantize them.
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, size, size);

      const imageData = ctx.getImageData(0, 0, size, size);
      const data = imageData.data;
      const hexGrid: string[] = [];

      // Heuristic to detect background color (assume top-left pixel is background)
      const rBg = data[0];
      const gBg = data[1];
      const bBg = data[2];

      // Tolerance for background removal.
      // We use a distance based check. 
      // Since we switched to Black background, blending artifacts are dark.
      // We can be slightly aggressive to remove "near black" shadows that are actually just anti-aliasing.
      const threshold = 60; // Distance threshold (0-441 range roughly)

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];

        // Calculate Euclidean distance from background color
        const dist = Math.sqrt(
          Math.pow(r - rBg, 2) +
          Math.pow(g - gBg, 2) +
          Math.pow(b - bBg, 2)
        );

        const isBg = dist < threshold;

        // If alpha is already low, or it matches background color
        if (a < 50 || isBg) {
          hexGrid.push('transparent');
        } else {
          hexGrid.push(rgbToHex(r, g, b));
        }
      }

      resolve(hexGrid);
    };
    img.onerror = (err) => reject(err);
    img.src = imageUrl;
  });
};

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

export const downloadCanvasAsPng = (grid: string[], size: PixelSize) => {
  const canvas = document.createElement('canvas');
  // Export at a larger size so it's visible, not literally 32px wide on screen
  const exportScale = 10; 
  canvas.width = size * exportScale;
  canvas.height = size * exportScale;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) return;

  // Draw discrete pixels
  grid.forEach((color, index) => {
    if (color === 'transparent') return;
    
    const x = index % size;
    const y = Math.floor(index / size);
    
    ctx.fillStyle = color;
    ctx.fillRect(x * exportScale, y * exportScale, exportScale, exportScale);
  });

  const link = document.createElement('a');
  link.download = `pixelart-${size}x${size}-${Date.now()}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
};

/**
 * Generates a compact JSON representation of the pixel art.
 * Uses Run-Length Encoding (RLE) to drastically reduce size.
 */
export const generateCodeSnippet = (grid: string[], size: PixelSize): string => {
  // 1. Extract unique palette
  const palette = Array.from(new Set(grid.filter(c => c !== 'transparent')));
  
  // 2. Map grid to palette indices (-1 for transparent)
  const rawIndices = grid.map(color => {
    if (color === 'transparent') return -1;
    return palette.indexOf(color);
  });

  // 3. Run-Length Encoding (RLE)
  // Format: [value, count, value, count, ...]
  const rleData: number[] = [];
  if (rawIndices.length > 0) {
    let currentVal = rawIndices[0];
    let currentCount = 1;

    for (let i = 1; i < rawIndices.length; i++) {
      if (rawIndices[i] === currentVal) {
        currentCount++;
      } else {
        rleData.push(currentVal);
        rleData.push(currentCount);
        currentVal = rawIndices[i];
        currentCount = 1;
      }
    }
    // Push last run
    rleData.push(currentVal);
    rleData.push(currentCount);
  }

  const output = {
    format: "RLE (Value, Count)",
    width: size,
    height: size,
    palette: palette,
    data: rleData
  };
  
  return JSON.stringify(output, null, 0); // No whitespace for max compactness, or 2 for readability
}