/**
 * Precompute geocentric tropical ecliptic longitudes (Swiss Ephemeris via swisseph-wasm).
 * Writes public/data/ephem/YYYY-MM.json for GitHub Pages (watch + tools).
 */
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import SwissEph from "swisseph-wasm";

const ASTROLABE_BODIES = [
  { id: "sun", swe: "SE_SUN" },
  { id: "moon", swe: "SE_MOON" },
  { id: "mercury", swe: "SE_MERCURY" },
  { id: "venus", swe: "SE_VENUS" },
  { id: "mars", swe: "SE_MARS" },
  { id: "jupiter", swe: "SE_JUPITER" },
  { id: "saturn", swe: "SE_SATURN" },
];

const HUMAN_DESIGN_BODIES = [
  ...ASTROLABE_BODIES,
  { id: "uranus", swe: "SE_URANUS" },
  { id: "neptune", swe: "SE_NEPTUNE" },
  { id: "pluto", swe: "SE_PLUTO" },
  { id: "true_node", swe: "SE_TRUE_NODE" },
  { id: "mean_node", swe: "SE_MEAN_NODE" },
];

const STEP_SEC = 900; // 15 minutes
const MONTHS_BACK = 3;
const MONTHS_FORWARD = 18;
const HD_DAYS_BACK = 120;

function norm360(lon) {
  let x = lon % 360;
  if (x < 0) x += 360;
  return x;
}

function monthKey(d) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function dayKey(d) {
  return `${monthKey(d)}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

function monthStartUtc(y, m0) {
  return new Date(Date.UTC(y, m0, 1, 0, 0, 0));
}

function dayStartUtc(y, m0, d) {
  return new Date(Date.UTC(y, m0, d, 0, 0, 0));
}

function addMonths(d, n) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, 1));
}

function addDays(d, n) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + n));
}

function parseMonthArg(value, label) {
  const match = /^(\d{4})-(\d{2})$/.exec(value || "");
  if (!match) {
    throw new Error(`${label} must be YYYY-MM`);
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) {
    throw new Error(`${label} month must be 01..12`);
  }
  return monthStartUtc(year, month - 1);
}

function parseArgs(argv) {
  const args = {
    start: null,
    end: null,
    humanDesign: false,
    onlyHumanDesign: false,
  };
  for (let i = 0; i < argv.length; ++i) {
    const arg = argv[i];
    if (arg === "--start") {
      args.start = parseMonthArg(argv[++i], "--start");
    } else if (arg === "--end") {
      args.end = parseMonthArg(argv[++i], "--end");
    } else if (arg === "--human-design") {
      args.humanDesign = true;
    } else if (arg === "--only-human-design") {
      args.humanDesign = true;
      args.onlyHumanDesign = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return args;
}

function calcBodySeries(swe, flag, bodies, t0, t1) {
  const bodySeries = Object.fromEntries(bodies.map((b) => [b.id, []]));
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
    for (const body of bodies) {
      const raw = swe.calc_ut(jd, swe[body.swe], flag);
      const lon = norm360(raw[0]);
      bodySeries[body.id].push(Math.round(lon * 10000) / 10000);
    }
  }
  return bodySeries;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const swe = new SwissEph();
  await swe.initSwissEph();
  const flag = swe.SEFLG_SWIEPH;

  const outDir = join(process.cwd(), "public", "data", "ephem");
  const hdOutDir = join(process.cwd(), "public", "data", "human-design");
  await mkdir(outDir, { recursive: true });
  if (args.humanDesign) {
    await mkdir(hdOutDir, { recursive: true });
  }

  const now = new Date();
  const start = args.start || addMonths(now, -MONTHS_BACK);
  const end = args.end ? addMonths(args.end, 1) : addMonths(now, MONTHS_FORWARD + 1);
  const months = [];
  const hdDays = [];

  if (!args.onlyHumanDesign) {
    for (let cur = new Date(start); cur < end; cur = addMonths(cur, 1)) {
      const y = cur.getUTCFullYear();
      const m = cur.getUTCMonth();
      const t0 = Math.floor(monthStartUtc(y, m).getTime() / 1000);
      const t1 = Math.floor(monthStartUtc(y, m + 1).getTime() / 1000);
      const bodySeries = calcBodySeries(swe, flag, ASTROLABE_BODIES, t0, t1);

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
  }

  if (args.humanDesign) {
    const hdStart = addDays(start, -HD_DAYS_BACK);
    for (let cur = new Date(hdStart); cur < end; cur = addDays(cur, 1)) {
      const y = cur.getUTCFullYear();
      const m = cur.getUTCMonth();
      const d = cur.getUTCDate();
      const t0 = Math.floor(dayStartUtc(y, m, d).getTime() / 1000);
      const t1 = Math.floor(dayStartUtc(y, m, d + 1).getTime() / 1000);
      const bodySeries = calcBodySeries(swe, flag, HUMAN_DESIGN_BODIES, t0, t1);
      const key = dayKey(cur);
      hdDays.push(key);
      const payload = {
        version: 1,
        step: STEP_SEC,
        t0,
        t1,
        source: "swisseph-wasm",
        coordinate: "tropical-ecliptic",
        purpose: "human-design-local-cache",
        bodies: bodySeries,
      };
      const path = join(hdOutDir, `${key}.json`);
      await writeFile(path, JSON.stringify(payload));
      console.log(path, bodySeries.sun.length, "samples");
    }
  }

  swe.close();

  if (!args.onlyHumanDesign) {
    const manifest = {
      version: 1,
      stepSec: STEP_SEC,
      months,
      generatedAt: new Date().toISOString(),
    };
    await writeFile(join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2));
    console.log("manifest", months.length, "months");
  }

  if (args.humanDesign) {
    const hdManifest = {
      version: 1,
      stepSec: STEP_SEC,
      days: hdDays,
      bodies: HUMAN_DESIGN_BODIES.map((b) => b.id),
      generatedAt: new Date().toISOString(),
    };
    await writeFile(join(hdOutDir, "manifest.json"), JSON.stringify(hdManifest, null, 2));
    console.log("human-design manifest", hdDays.length, "days");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
