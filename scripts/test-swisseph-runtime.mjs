import assert from "node:assert/strict";
import test from "node:test";
import SwissEph from "swisseph-wasm";

import { calcUtAudited, runtimeProvenance } from "./swisseph-runtime.mjs";

test("embedded data returns audited SWIEPH positions with reproducible provenance", async () => {
  const swe = new SwissEph();
  await swe.initSwissEph();
  const jd = swe.julday(2026, 8, 5, 18);
  const result = calcUtAudited(swe, jd, swe.SE_SUN, swe.SEFLG_SWIEPH | swe.SEFLG_SPEED);
  assert.equal(result.returnFlags & 7, swe.SEFLG_SWIEPH);
  assert.ok(Math.abs(result.values[0] - 133.334750961) < 0.000001);

  const provenance = await runtimeProvenance(swe);
  assert.equal(provenance.engine, "Swiss Ephemeris");
  assert.equal(provenance.ephemeris_mode, "SWIEPH");
  assert.equal(provenance.binding, "swisseph-wasm@0.0.5");
  assert.match(provenance.engine_version, /^2\.10/);
  assert.equal(
    provenance.engine_data_sha256,
    "39b43fd0bcaa1a6dbea2d66845efac0b0ad4ba76ec81cff830c11aaed81cc112",
  );
});
