import "./style.css";
import {
  computePositions,
  initSwissEph,
  isReady,
  juldayFromUtc,
  toApiPayload,
} from "./ephemeris.js";

const app = document.getElementById("app");

function utcNowLocalInput() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}

function parseUtcInput(value) {
  const [datePart, timePart] = value.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = (timePart || "00:00").split(":").map(Number);
  return { year, month, day, hour, minute, second: 0 };
}

function renderShell({ status, statusClass, rows, jd, utcIso, json }) {
  const tableRows =
    rows?.length > 0
      ? rows
          .map(
            (r) => `
      <tr>
        <td>${r.label}</td>
        <td class="mono">${r.lonFormatted}</td>
        <td class="sign">${r.zodiac.formatted}</td>
        <td class="mono">${r.speedLon.toFixed(4)}°/d</td>
      </tr>`,
          )
          .join("")
      : `<tr><td colspan="4" class="mono">—</td></tr>`;

  app.innerHTML = `
    <header>
      <h1>Castalia Ephemeris</h1>
      <p>Swiss Ephemeris in the browser (WebAssembly). Tropical geocentric ecliptic longitudes.</p>
    </header>

    <section class="panel">
      <h2>Time (UTC)</h2>
      <div class="controls">
        <label>
          Instant
          <input type="datetime-local" id="utc-input" value="${utcNowLocalInput()}" />
        </label>
        <div class="actions">
          <button type="button" class="primary" id="btn-calc" ${statusClass === "loading" ? "disabled" : ""}>Calculate</button>
          <button type="button" id="btn-now">Now (UTC)</button>
          <button type="button" id="btn-copy" ${json ? "" : "disabled"}>Copy JSON</button>
        </div>
        <p class="status ${statusClass}" id="status">${status}</p>
      </div>
    </section>

    <section class="panel">
      <h2>Positions</h2>
      <table>
        <thead>
          <tr>
            <th>Body</th>
            <th>λ (tropical)</th>
            <th>Sign</th>
            <th>Speed</th>
          </tr>
        </thead>
        <tbody>${tableRows}</tbody>
      </table>
      ${jd != null ? `<p class="meta">JD (UT) ${jd.toFixed(6)} · ${utcIso ?? ""}</p>` : ""}
      ${json ? `<pre class="json-block" id="json-out">${json}</pre>` : ""}
    </section>

    <footer>
      <p>
        Powered by
        <a href="https://www.astro.com/swisseph/" target="_blank" rel="noopener">Swiss Ephemeris</a>
        via <a href="https://github.com/prolaxu/swisseph-wasm" target="_blank" rel="noopener">swisseph-wasm</a>.
        GPL for non-commercial use; commercial license from Astrodienst required for proprietary products.
      </p>
    </footer>
  `;

  document.getElementById("btn-calc")?.addEventListener("click", runCalculation);
  document.getElementById("btn-now")?.addEventListener("click", () => {
    document.getElementById("utc-input").value = utcNowLocalInput();
    runCalculation();
  });
  document.getElementById("btn-copy")?.addEventListener("click", async () => {
    if (json) await navigator.clipboard.writeText(json);
  });
}

let lastState = { status: "Loading Swiss Ephemeris WASM…", statusClass: "loading" };

function paint() {
  renderShell(lastState);
}

async function runCalculation() {
  if (!isReady()) return;

  const input = document.getElementById("utc-input");
  const parts = parseUtcInput(input.value);
  const utc = new Date(Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute));

  try {
    const jd = juldayFromUtc(parts);
    const rows = computePositions(jd);
    const payload = toApiPayload(utc, rows);
    const json = JSON.stringify(payload, null, 2);
    lastState = {
      status: "Ready",
      statusClass: "ready",
      rows,
      jd,
      utcIso: utc.toISOString(),
      json,
    };
  } catch (err) {
    lastState = {
      ...lastState,
      status: `Error: ${err.message}`,
      statusClass: "error",
    };
  }
  paint();
}

async function boot() {
  paint();
  try {
    await initSwissEph();
    lastState = {
      status: "WASM loaded — choose a time and calculate",
      statusClass: "ready",
    };
    paint();
    await runCalculation();
  } catch (err) {
    lastState = {
      status: `Failed to load WASM: ${err.message}`,
      statusClass: "error",
    };
    paint();
  }
}

boot();
