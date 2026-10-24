# Ignoto website

Plain HTML/CSS/JS, no build step. Videos come from the channel's YouTube feed.

- `index.html`, `styles.css`, `main.js`: the site
- `data/videos.js`: generated video list (don't edit by hand)
- `scripts/fetch-videos.mjs`: refreshes `data/videos.js`; topic rules are at the top of this file
- `.github/workflows/update-and-deploy.yml`: runs the script every 6 hours and publishes to GitHub Pages

## Run locally

```bash
python -m http.server 5173
```

Then open http://localhost:5173. To pull new videos: `node scripts/fetch-videos.mjs`.

## Go live (one time)

1. Create a GitHub repo and push this folder to its `main` branch.
2. In the repo: Settings → Pages → Source: **GitHub Actions**.
3. New uploads then appear on the site within 6 hours on their own (or run the workflow from the Actions tab).
