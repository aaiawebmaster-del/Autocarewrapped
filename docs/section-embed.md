# Section-only embed (Netlify only)

Open a single footer checkpoint of the Wrapped experience for one company.
This is for Netlify URLs only — do **not** use it on my.autocare.org.

## URL shape

```
https://autocareengagement.netlify.app/?record={recordNumber}&section={section}&embed=1
```

| `section` value | Checkpoint |
|-----------------|------------|
| `journey` | Your Journey |
| `hood` | Under the Hood (standards) |
| `standards` | alias for `hood` |
| `tires` | Kick the Tires |
| `diagnostics` | Full Diagnostics |
| `report` | alias for `diagnostics` |

## Examples

```
https://autocareengagement.netlify.app/?record=1101050&section=journey&embed=1
https://autocareengagement.netlify.app/?record=1101050&section=hood&embed=1
https://autocareengagement.netlify.app/?record=1101050&section=tires&embed=1
https://autocareengagement.netlify.app/?record=1101050&section=diagnostics&embed=1
```

## Behavior

- Skips landing and intro slides; jumps straight into the chosen section.
- Within-section Back/Next still work between slides or phases.
- On the last screen of most sections there is **Back only** (no Next into another checkpoint).
- Footer checkpoint navigation is hidden so users cannot jump to other sections.
- **Journey section embeds** omit the sky/road Lottie above the dashboard (dashboard only).
- **Journey section embeds** show the Driven By You **license plate on the left** (~65%) and gauge content on the right (~35%) in a fixed grid so the plate does not shift between slides (including community logos).
- **Journey section embeds** are capped at **300px** tall (HubSpot email header), hide Restart, and hide the PRNDL / top signal arrows. Recommended iframe: `height="300"` and width **≥ 480** (works down to ~360 with a slightly smaller plate/dial).
- **Journey counter slides only** (tenure → contacts → community → committee). The GPS/map slide is omitted.
- Per-slide message text boxes and CTAs are hidden; Back/Next remain.
  - **Mobile:** count readout sits between Back/Next; **See Full Report** is under the gauge.
  - **Desktop:** count under the gauge, then Back | **See Full Report** | Next.
- On **Committee Leadership**, Next opens the full experience at [https://my.autocare.org/drive](https://my.autocare.org/drive) in a new tab (iframe-safe). **See Full Report** uses the same URL.
- Invalid or missing `section` leaves the full multi-section experience unchanged.
- Company selection still uses `record` / `records` as usual.
