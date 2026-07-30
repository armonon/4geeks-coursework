# Wanderlust Explorer

A responsive, multi-page experience discovery app built with Next.js, React,
TypeScript, and Tailwind CSS. Browse 100 curated experiences, combine search
with category and destination filters, share filtered URLs, and save favorites
across client-side navigation.

## Features

- Five routes using the Next.js App Router
- 100 typed experience records in a local dataset
- Case-insensitive regex title search
- Stackable category and destination filters
- URL query parameters that pre-fill filters on page load
- Shared favorites state using React `useState`
- Responsive card grid and mobile navigation
- Custom `useExperiences` filtering hook

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Design References

- [Airbnb Experiences](https://www.airbnb.com/s/experiences) — card hierarchy,
  destination-led discovery, and approachable filtering patterns.
- [Much Better Adventures](https://www.muchbetteradventures.com/) — editorial
  travel photography, bold destination storytelling, and strong action cues.
- [Mr & Mrs Smith](https://www.mrandmrssmith.com/) — refined typography,
  restrained color, and an aspirational editorial voice.

The final visual direction combines an editorial serif with a calm, earthy
palette, generous image-led cards, and compact top filters. The interface is
original and does not copy any reference page.

## Tech

Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · ESLint

## Assignment constraints

Favorites intentionally use in-memory React state only. No external state
management library or browser persistence is used.
