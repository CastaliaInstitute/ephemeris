const SIGNS = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces",
];

const GLYPHS = ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"];

/** Normalize longitude to [0, 360). */
export function norm360(lon) {
  let x = lon % 360;
  if (x < 0) x += 360;
  return x;
}

export function lonToSign(lon) {
  const n = norm360(lon);
  const idx = Math.floor(n / 30) % 12;
  const deg = n - idx * 30;
  return {
    sign: SIGNS[idx],
    glyph: GLYPHS[idx],
    deg,
    formatted: `${GLYPHS[idx]} ${deg.toFixed(2)}° ${SIGNS[idx]}`,
  };
}

export function formatLon(lon) {
  return `${norm360(lon).toFixed(4)}°`;
}
