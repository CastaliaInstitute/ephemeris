# Ephemeris project status

Updated: 2026-07-29  
Repository: `CastaliaInstitute/ephemeris`  
Public URL: https://ephemeris.castalia.institute/

## Current state

- **Readiness:** Deployable static WASM demo and data service for Castalia devices.
- **Evidence:** Swiss Ephemeris WASM browser app, generated 15-minute planet data, Human Design daily data, bright-star catalog, CI generation, and firmware consumer documentation are present.
- **Visual policy:** The data and celestial face are the project’s real visual substance; no synthetic hero is needed.

## Release gates

- Regenerate a bounded date range in CI and compare representative values.
- Verify the Pages custom domain and data URLs without a service worker masking stale files.
- Keep Swiss Ephemeris GPL/commercial licensing boundary explicit for proprietary firmware.
