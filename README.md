# Castalia Ephemeris

Swiss Ephemeris for Castalia devices and the browser — **static GitHub Pages only** (no Cloudflare Worker).

**Live site:** https://ephemeris.castalia.institute/

## What ships here

| Asset | Path | Used by |
|-------|------|---------|
| Browser demo (WASM) | `/` | Humans — live Swiss Ephemeris in the tab |
| **Precomputed planets** | `/data/ephem/YYYY-MM.json` | Astrolabe / PocketMynah astrology face |
| **Human Design daily ephemeris** | `/data/human-design/YYYY-MM-DD.json` | Astrolabe Human Design local cache |
| **Bright star catalog** | `/data/stars/bright-stars.json` | Celestial face (WiFi fetch + embedded fallback) |

Stars are **static J2000 data** (Stellarium-compatible catalog style). There is no live Stellarium server — see [`stellarium/README.md`](stellarium/README.md).

Planet files hold **geocentric tropical ecliptic longitudes** (Sun–Saturn) every **15 minutes**, generated with `swisseph-wasm` in CI. Clients derive lunar phase from Sun and Moon λ locally to keep the device monthly files under the Astrolabe firmware cache limit. Human Design daily files hold Sun–Saturn plus Uranus, Neptune, Pluto, true lunar node, and mean lunar node every 15 minutes. They are daily rather than monthly so devices can download only the historical birth/design window they need without loading a large full-body month into RAM.

## Regenerate data

```bash
npm install
npm run generate-data   # writes public/data/ephem/*.json
npm run generate-human-design -- --start 1972-05 --end 1972-05
npm run build           # generate-data + Vite → dist/
```

GitHub Actions runs `generate-data` before each Pages deploy.

## Device JSON shape (monthly file)

```json
{
  "step": 900,
  "t0": 1746057600,
  "t1": 1748736000,
  "source": "swisseph-wasm",
  "coordinate": "tropical-ecliptic",
  "bodies": {
    "sun": [55.12, 55.25, "..."],
    "moon": ["..."]
  }
}
```

Moon phase is intentionally not included in the monthly device feed; derive it from the Sun and Moon longitude arrays.

## Human Design JSON Shape

```json
{
  "version": 1,
  "step": 900,
  "t0": 73440000,
  "t1": 73526400,
  "source": "swisseph-wasm",
  "coordinate": "tropical-ecliptic",
  "purpose": "human-design-local-cache",
  "bodies": {
    "sun": [45.12, "..."],
    "moon": ["..."],
    "mercury": ["..."],
    "venus": ["..."],
    "mars": ["..."],
    "jupiter": ["..."],
    "saturn": ["..."],
    "uranus": ["..."],
    "neptune": ["..."],
    "pluto": ["..."],
    "true_node": ["..."],
    "mean_node": ["..."]
  }
}
```

Human Design generation includes 120 days before the requested `--start` month. That covers the design-time search for the prenatal Sun position roughly 88 degrees before birth.

Firmware: `GET https://ephemeris.castalia.institute/data/ephem/2026-05.json`, index by `(epoch - t0) / step`, fall back to local `pm_transit` if offline.

Configure base URL in astrolabe `MYNAH_EPHEMERIS_DATA_BASE` (`pm_config.h`).

## DNS

CNAME `ephemeris` → `castaliainstitute.github.io` (DNS only on Cloudflare). `public/CNAME` sets the custom host for Pages.

## Licensing

- This repository: **GPL-3.0-or-later**
- **Swiss Ephemeris**: GPL for open source; [commercial license](https://www.astro.com/swisseph/) from Astrodienst for proprietary products

## Related

- [astrolabe](https://github.com/CastaliaInstitute/astrolabe) — `pm_ephemeris` (static fetch), `pm_stars` + **Celestial** clock face
