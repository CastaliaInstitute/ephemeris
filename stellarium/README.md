# Stellarium and this repo

**You cannot run Stellarium as a static server on GitHub Pages.** Stellarium is a desktop planetarium; its [Remote Control](https://stellarium.org/doc/head/remoteControlApi.html) plugin expects a live process on port 8090.

## What we use instead (static)

| Need | Solution |
|------|----------|
| Bright stars on the watch | [`/data/stars/bright-stars.json`](../public/data/stars/bright-stars.json) on Pages |
| Planet longitudes | [`/data/ephem/YYYY-MM.json`](../public/data/ephem/) |
| Sky position on device | RA/Dec from JSON + local alt/az math (`pm_stars` in astrolabe) |

The star file uses **J2000 RA/Dec and V magnitude** — the same kind of catalog Stellarium plots. Regenerate with:

```bash
npm run generate-stars
```

## Optional: local Stellarium for comparison

To visually compare the Celestial face against Stellarium on a laptop:

1. Install [Stellarium](https://stellarium.org/) and enable **Remote control** (Configuration → plugins).
2. Set time and location to match the watch.
3. Compare named stars (Sirius, Vega, etc.) with the static catalog.

No Docker or always-on server is required for production; firmware may fetch the static JSON once over WiFi and otherwise uses an embedded copy of the same catalog.
