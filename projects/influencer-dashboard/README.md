# Influencer Ads Dashboard

Static dashboard project for the 4Geeks Academy challenge. It consolidates sample social media performance data for an influencer promoting three products.

This repository uses the official 4Geeks Academy `html-hello` template environment, including `server.py`, `learn.json`, multilingual README files, and `.vscode` settings/assets.

## Tech requirements

- HTML only
- Tailwind CSS v4 via the official browser CDN: `https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4`
- No React, Vue, Bootstrap, or Tailwind v3 CDN snippets

## Project structure

- `index.html`: semantic dashboard structure with top KPIs, middle drivers, and bottom operational details.
- `styles.css`: small support stylesheet for accessibility and print behavior. Responsive layout is handled with Tailwind CSS v4 utility classes.
- `server.py`: 4Geeks Flask preview server.
- `learn.json`: 4Geeks project metadata.

## Responsive design

The layout is mobile-first and uses Tailwind breakpoints such as `sm:`, `md:`, `lg:`, and `xl:` for phone, tablet, desktop, and large desktop widths.

## Run locally

```bash
pip3 install flask
python3 server.py
```

Then open the local server URL shown in the terminal.
