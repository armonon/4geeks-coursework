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

Build the production Tailwind CSS file and prepare the HTML pages:

```bash
npm run build
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

The site uses a small inline critical CSS block for first paint, then loads the generated Tailwind CSS file asynchronously so it can be cached. Form validation JavaScript is loaded only when the form is used.
