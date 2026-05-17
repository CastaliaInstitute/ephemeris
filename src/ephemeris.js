import { BODIES } from "./bodies.js";
import { formatLon, lonToSign, norm360 } from "./zodiac.js";

let sweInstance = null;
let initPromise = null;

export function isReady() {
  return sweInstance != null;
}

export async function initSwissEph() {
  if (sweInstance) return sweInstance;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const { default: SwissEph } = await import("swisseph-wasm");
    const swe = new SwissEph();
    await swe.initSwissEph();
    sweInstance = swe;
    return swe;
  })();

  return initPromise;
}

/** UTC calendar fields → Julian day (UT). */
export function juldayFromUtc({ year, month, day, hour, minute, second = 0 }) {
  const ut =
    hour + minute / 60 + second / 3600;
  return sweInstance.julday(year, month, day, ut);
}

export function computePositions(jd) {
  if (!sweInstance) {
    throw new Error("Swiss Ephemeris not initialized");
  }

  const flag = sweInstance.SEFLG_SWIEPH | sweInstance.SEFLG_SPEED;
  const rows = [];

  for (const body of BODIES) {
    const planetId = sweInstance[body.swe];
    const raw = sweInstance.calc_ut(jd, planetId, flag);
    const lon = norm360(raw[0]);
    const speed = raw[3];
    rows.push({
      id: body.id,
      label: body.label,
      short: body.short,
      lon,
      lonFormatted: formatLon(lon),
      zodiac: lonToSign(lon),
      speedLon: speed,
    });
  }

  return rows;
}

/** Shape for future Castalia ephemeris API / device clients. */
export function toApiPayload(utc, rows) {
  return {
    source: "swisseph-wasm",
    coordinate: "tropical-ecliptic",
    epoch: utc.toISOString(),
    bodies: Object.fromEntries(
      rows.map((r) => [
        r.id,
        {
          lon: r.lon,
          speed: r.speedLon,
          sign: r.zodiac.sign,
        },
      ]),
    ),
  };
}
