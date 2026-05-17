# Castalia Ephemeris

Browser demo and reference client for **Swiss Ephemeris** calculations, built for Castalia devices (e.g. [Astrolabe](https://github.com/CastaliaInstitute/astrolabe)) and future edge APIs.

**Live site:** https://castaliainstitute.github.io/ephemeris/

## Stack

- [Vite](https://vitejs.dev/) static site
- [swisseph-wasm](https://github.com/prolaxu/swisseph-wasm) — Swiss Ephemeris compiled to WebAssembly
- GitHub Actions → GitHub Pages

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:5173/

Production build (served under `/ephemeris/` on Pages):

```bash
npm run build
npm run preview
```

## API shape (draft)

The demo exports JSON aligned with Astrolabe `PmEphemBody` bodies (Sun–Saturn):

```json
{
  "source": "swisseph-wasm",
  "coordinate": "tropical-ecliptic",
  "epoch": "2026-05-16T12:00:00.000Z",
  "bodies": {
    "sun": { "lon": 55.12, "speed": 0.98, "sign": "Taurus" },
    "moon": { "lon": 123.45, "speed": 13.2, "sign": "Leo" }
  }
}
```

A future **Castalia ephemeris server** can mirror this contract over HTTPS (JWT, caching) while firmware falls back to simplified `pm_transit` math when offline.

## Licensing

- This repository: **GPL-3.0-or-later** (see [LICENSE](LICENSE)).
- **Swiss Ephemeris**: GPL for open-source / non-commercial use; [commercial license](https://www.astro.com/swisseph/) from Astrodienst AG required for closed-source or commercial products.

## Related

- [astrolabe](https://github.com/CastaliaInstitute/astrolabe) — on-device approximations in `pm_transit.cpp`; backlog item for Castalia ephemeris service integration.
