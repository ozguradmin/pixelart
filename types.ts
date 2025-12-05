export enum PixelSize {
  XS = 32,
  S = 64,
  M = 128,
  L = 256,
}

export interface PixelData {
  x: number;
  y: number;
  color: string; // Hex or RGBA
}

export interface GenerationConfig {
  prompt: string;
  size: PixelSize;
}

export interface GenerationResult {
  imageUrl: string; // The raw image from Gemini
  pixels: string[]; // Flat array of hex codes matching the grid size
  width: number;
  height: number;
}
