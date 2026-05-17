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

let swe;
let sweReady;

async function getSwe() {
  if (sweReady) return swe;
  swe = new SwissEph();
  await swe.initSwissEph();
  sweReady = true;
  return swe;
}

function norm360(lon) {
  let x = lon % 360;
  if (x < 0) x += 360;
  return x;
}

function lonToSign(lon) {
  const n = norm360(lon);
  const idx = Math.floor(n / 30) % 12;
  return SIGNS[idx];
}

function juldayFromDate(d) {
  const ut =
    d.getUTCHours() + d.getUTCMinutes() / 60 + d.getUTCSeconds() / 3600;
  return swe.julday(
    d.getUTCFullYear(),
    d.getUTCMonth() + 1,
    d.getUTCDate(),
    ut,
  );
}

function computePayload(epochSec) {
  const d = new Date(epochSec * 1000);
  const jd = juldayFromDate(d);
  const flag = swe.SEFLG_SWIEPH | swe.SEFLG_SPEED;
  const bodies = {};
  for (const body of BODIES) {
    const raw = swe.calc_ut(jd, swe[body.swe], flag);
    const lon = norm360(raw[0]);
    bodies[body.id] = {
      lon,
      speed: raw[3],
      sign: lonToSign(lon),
    };
  }
  return {
    source: "swisseph-wasm",
    coordinate: "tropical-ecliptic",
    epoch: d.toISOString(),
    bodies,
  };
}

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }
    if (url.pathname !== "/api/v1/positions") {
      return new Response("Not found", { status: 404, headers: cors });
    }
    const epochRaw = url.searchParams.get("epoch");
    const epoch = Number(epochRaw);
    if (!epochRaw || !Number.isFinite(epoch) || epoch < 0) {
      return new Response(
        JSON.stringify({ error: "epoch query param required (unix seconds UTC)" }),
        { status: 400, headers: { ...cors, "Content-Type": "application/json" } },
      );
    }
    try {
      await getSwe();
      const payload = computePayload(Math.floor(epoch));
      return new Response(JSON.stringify(payload), {
        headers: {
          ...cors,
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=60",
        },
      });
    } catch (err) {
      return new Response(
        JSON.stringify({ error: String(err?.message || err) }),
        { status: 500, headers: { ...cors, "Content-Type": "application/json" } },
      );
    }
  },
};
