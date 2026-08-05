import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const PACKAGE_JSON_URL = new URL("../node_modules/swisseph-wasm/package.json", import.meta.url);
const DATA_URL = new URL("../node_modules/swisseph-wasm/wasm/swisseph.data", import.meta.url);

export function calcUtAudited(swe, julianDay, body, flags) {
  const module = swe.SweModule;
  const resultPtr = module._malloc(6 * Float64Array.BYTES_PER_ELEMENT);
  const errorBuffer = module._malloc(256);
  try {
    const returnFlags = module.ccall(
      "swe_calc_ut",
      "number",
      ["number", "number", "number", "pointer", "pointer"],
      [julianDay, body, flags, resultPtr, errorBuffer],
    );
    if (returnFlags < 0) {
      throw new Error(`Swiss Ephemeris calculation failed: ${module.UTF8ToString(errorBuffer)}`);
    }
    const ephemerisFlag = returnFlags & (swe.SEFLG_JPLEPH | swe.SEFLG_SWIEPH | swe.SEFLG_MOSEPH);
    if (ephemerisFlag !== swe.SEFLG_SWIEPH) {
      throw new Error(`Swiss Ephemeris fallback: requested SWIEPH, return flags=${returnFlags}`);
    }
    const start = resultPtr / Float64Array.BYTES_PER_ELEMENT;
    return {
      values: module.HEAPF64.slice(start, start + 6),
      returnFlags,
    };
  } finally {
    module._free(resultPtr);
    module._free(errorBuffer);
  }
}

export async function runtimeProvenance(swe) {
  const [packageBytes, dataBytes] = await Promise.all([
    readFile(PACKAGE_JSON_URL),
    readFile(DATA_URL),
  ]);
  const packageData = JSON.parse(packageBytes.toString("utf8"));
  return {
    source: "swisseph-wasm",
    engine: "Swiss Ephemeris",
    engine_version: swe.version(),
    binding: `${packageData.name}@${packageData.version}`,
    ephemeris_mode: "SWIEPH",
    engine_data_sha256: createHash("sha256").update(dataBytes).digest("hex"),
  };
}
