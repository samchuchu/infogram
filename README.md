# Infogram Mobile Studio v1

This first version is intentionally simple: one **mobile portrait web app** format. The user provides an infographic, the app fits it into a phone canvas, creates role-based tap zones, and previews the interaction plan.

- Upload one infographic image.
- Analyze it into starter role zones.
- Tap through grouped mobile steps.
- Preview hotspots and explanation cards.
- Export a standalone mobile HTML file.

Open `index.html` directly in a browser, or run a local server from this folder:

```powershell
python -m http.server 5173
```

Then visit `http://localhost:5173`.

## Role Rules Kept In V1

- Title: opening orientation, intro spotlight, calm motion.
- Statistic: count-up or comparison reveal.
- Content: grouped tabs or step reveal; connected A/B/C items must not be left out.
- Chart: chart reveal, drilldown tooltip, comparison state.
- Character: guide/callout role; later versions can generate pose/action states.
- Technical Graphic: physics, chemistry, process, or mechanism diagrams become connected hotspots.
- Button / Hotspot: explicit trigger for reveal layers and focused explanations.

## Next Version Hooks

OCR, AI content detection, image-to-image generated action assets, and Remotion video export can still plug into the same `layers`, `groups`, and `roles` model later.
