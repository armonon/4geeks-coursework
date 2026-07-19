# HealthCore Public Website

Milestone 1 project for HealthCore's first professional public website.

## Files

- `index.html` - English landing page
- `index.es.html` - Spanish landing page
- `application.html` - English patient enquiry form
- `application.es.html` - Spanish patient enquiry form
- `validation.js` - shared bilingual form validation
- `assets/tailwind.css` - generated Tailwind stylesheet for faster page loads
- `CONTEXT.md` - project context, preserved from the provided brief

## Build Styles

Install dependencies once:

```bash
npm install
```

Build the production Tailwind CSS file:

```bash
npm run build:css
```

## Run Locally

From the repository root, run:

```bash
npm run serve
```

You can also use the assignment-compatible command directly:

```bash
npx http-server . -p 3000 -a 0.0.0.0
```

Then open `http://localhost:3000`.

The site uses a generated Tailwind CSS file instead of the Tailwind browser compiler for better performance.
