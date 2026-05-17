# Castalia Ephemeris

Browser demo and reference client for **Swiss Ephemeris** calculations, built for Castalia devices (e.g. [Astrolabe](https://github.com/CastaliaInstitute/astrolabe)) and future edge APIs.

**Live site:** https://ephemeris.castalia.institute/ (also https://castaliainstitute.github.io/ephemeris/)

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

Production build:

```bash
npm run build
npm run preview
```

## DNS

Cloudflare zone **castalia.institute**:

| Type  | Name       | Content                      | Proxy   |
|-------|------------|------------------------------|---------|
| CNAME | `ephemeris` | `castaliainstitute.github.io` | DNS only |

GitHub Pages reads `public/CNAME` (`ephemeris.castalia.institute`). After DNS propagates, enable HTTPS in repo Pages settings (certificate may take a few minutes).

## HTTP API (devices)

Swiss Ephemeris positions for firmware and tools:

```http
GET https://ephemeris.castalia.institute/api/v1/positions?epoch=1715860800
```

`epoch` — Unix seconds (UTC). Response cached ~60s at the edge.

Deploy the Cloudflare Worker (route `ephemeris.castalia.institute/api/*`):

```bash
cd worker && npm install && npm run deploy
```

Requires Cloudflare API token with Workers + DNS for zone `castalia.institute` (see Castalia `castalia.institute/.env`).

## JSON shape

Aligned with Astrolabe `PmEphemBody` bodies (Sun–Saturn):

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
