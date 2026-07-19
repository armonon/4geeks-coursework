# HealthCore Public Website

Milestone 1 project for HealthCore's first professional public website.

## Files

- `index.html` - English landing page
- `index.es.html` - Spanish landing page
- `application.html` - English patient enquiry form
- `application.es.html` - Spanish patient enquiry form
- `validation.js` - shared bilingual form validation
- `CONTEXT.md` - project context, preserved from the provided brief

## Run Locally

From the repository root, run:

```bash
npx http-server . -p 3000 -a 0.0.0.0
```

Then open `http://localhost:3000`.

The site uses the Tailwind CSS browser CDN, so no custom CSS file is required.
