import { hexToLch, lchToHex } from 'lch-color-utils';

export function clamp(x: number, low: number, high: number): number {
  return Math.min(Math.max(x, low), high);
}

export function getLocalStorage(key: string): string | undefined {
  try {
    return localStorage[key];
  } catch (err) {
    console.error(err);
    return undefined;
  }
}

export function getLocalStorageNumber(
  key: string,
  defaultValue: number,
  min: number,
  max: number
): number {
  const s = getLocalStorage(key);
  if (!s) {
    return defaultValue;
  }
  const x = parseFloat(s);
  return Number.isFinite(x) ? clamp(x, min, max) : defaultValue;
}

export function setLocalStorage(key: string, val: unknown): void {
  try {
    localStorage[key] = val;
  } catch (err) {
    console.error(err);
  }
}

export function isHexColor(c: string): boolean {
  return /^#[0-9a-f]{6}$/i.test(c);
}

// Only supports hex colors without without alpha.
//
// Note that I initially used colord for rgb => lch => rgb conversion, but the
// clamping into sRGB seems flawed; lch(100% 77 31) is converted to #ffc6b4
// which is extremely far from the expected white (lightness 100%). In fact,
// Safari which supposedly supports lch also displays lch(100% 77 31) as the
// non-white which is very puzzling. However, https://css.land/lch/ somehow has
// very reasonable sGRB clamping. I was about to take its code, but found a new
// niche library that already does just that.
export function withLchLightness(color: string, lightness: number): string {
  const lch = hexToLch(color);
  lch.l = lightness;
  return lchToHex(lch).value;
}
