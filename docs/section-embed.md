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
- On the last screen of the section there is **Back only** (no Next into another checkpoint).
- Footer checkpoint navigation is hidden so users cannot jump to other sections.
- Invalid or missing `section` leaves the full multi-section experience unchanged.
- Company selection still uses `record` / `records` as usual.
