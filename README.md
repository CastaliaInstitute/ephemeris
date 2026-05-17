# Castalia Ephemeris

Swiss Ephemeris for Castalia devices and the browser — **static GitHub Pages only** (no Cloudflare Worker).

**Live site:** https://ephemeris.castalia.institute/

## What ships here

| Asset | Path | Used by |
|-------|------|---------|
| Browser demo (WASM) | `/` | Humans — live Swiss Ephemeris in the tab |
| **Precomputed planets** | `/data/ephem/YYYY-MM.json` | Astrolabe / PocketMynah astrology face |
| **Bright star catalog** | `/data/stars/bright-stars.json` | Reference (firmware embeds the same list) |

Planet files hold **geocentric tropical ecliptic longitudes** (Sun–Saturn) every **15 minutes**, generated with `swisseph-wasm` in CI.

## Regenerate data

```bash
npm install
npm run generate-data   # writes public/data/ephem/*.json
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

Firmware: `GET https://ephemeris.castalia.institute/data/ephem/2026-05.json`, index by `(epoch - t0) / step`, fall back to local `pm_transit` if offline.

Configure base URL in astrolabe `MYNAH_EPHEMERIS_DATA_BASE` (`pm_config.h`).

## DNS

CNAME `ephemeris` → `castaliainstitute.github.io` (DNS only on Cloudflare). `public/CNAME` sets the custom host for Pages.

## Licensing

- This repository: **GPL-3.0-or-later**
- **Swiss Ephemeris**: GPL for open source; [commercial license](https://www.astro.com/swisseph/) from Astrodienst for proprietary products

## Related

- [astrolabe](https://github.com/CastaliaInstitute/astrolabe) — `pm_ephemeris` (static fetch), `pm_stars` + **Celestial** clock face
