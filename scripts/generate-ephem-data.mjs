/**
 * Precompute geocentric tropical ecliptic longitudes (Swiss Ephemeris via swisseph-wasm).
 * Writes public/data/ephem/YYYY-MM.json for GitHub Pages (watch + tools).
 */
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import SwissEph from "swisseph-wasm";

const BODIES = [
  { id: "sun", swe: "SE_SUN" },
  { id: "moon", swe: "SE_MOON" },
  { id: "mercury", swe: "SE_MERCURY" },
  { id: "venus", swe: "SE_VENUS" },
  { id: "mars", swe: "SE_MARS" },
  { id: "jupiter", swe: "SE_JUPITER" },
  { id: "saturn", swe: "SE_SATURN" },
];

const STEP_SEC = 900; // 15 minutes
const MONTHS_BACK = 3;
const MONTHS_FORWARD = 18;

function norm360(lon) {
  let x = lon % 360;
  if (x < 0) x += 360;
  return x;
}

function monthKey(d) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function monthStartUtc(y, m0) {
  return new Date(Date.UTC(y, m0, 1, 0, 0, 0));
}

function addMonths(d, n) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, 1));
}

async function main() {
  const swe = new SwissEph();
  await swe.initSwissEph();
  const flag = swe.SEFLG_SWIEPH;

  const outDir = join(process.cwd(), "public", "data", "ephem");
  await mkdir(outDir, { recursive: true });

  const now = new Date();
  const start = addMonths(now, -MONTHS_BACK);
  const end = addMonths(now, MONTHS_FORWARD + 1);
  const months = [];

  for (let cur = new Date(start); cur < end; cur = addMonths(cur, 1)) {
    const y = cur.getUTCFullYear();
    const m = cur.getUTCMonth();
    const t0 = Math.floor(monthStartUtc(y, m).getTime() / 1000);
    const t1 = Math.floor(monthStartUtc(y, m + 1).getTime() / 1000);
    const bodySeries = Object.fromEntries(BODIES.map((b) => [b.id, []]));

    for (let t = t0; t < t1; t += STEP_SEC) {
      const d = new Date(t * 1000);
      const ut =
        d.getUTCHours() + d.getUTCMinutes() / 60 + d.getUTCSeconds() / 3600;
      const jd = swe.julday(
        d.getUTCFullYear(),
        d.getUTCMonth() + 1,
        d.getUTCDate(),
        ut,
      );
      for (const body of BODIES) {
        const raw = swe.calc_ut(jd, swe[body.swe], flag);
        bodySeries[body.id].push(Math.round(norm360(raw[0]) * 10000) / 10000);
      }
    }

    const key = monthKey(cur);
    months.push(key);
    const payload = {
      step: STEP_SEC,
      t0,
      t1,
      source: "swisseph-wasm",
      coordinate: "tropical-ecliptic",
      bodies: bodySeries,
    };
    const path = join(outDir, `${key}.json`);
    await writeFile(path, JSON.stringify(payload));
    console.log(path, bodySeries.sun.length, "samples");
  }

  swe.close();

  const manifest = {
    version: 1,
    stepSec: STEP_SEC,
    months,
    generatedAt: new Date().toISOString(),
  };
  await writeFile(join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2));
  console.log("manifest", months.length, "months");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
