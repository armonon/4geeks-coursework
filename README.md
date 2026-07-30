# Talk to the Machine

An observable AI chat proof of concept built with Next.js, React, and the Groq Chat Completions API. It uses Meta's Llama 3.1 8B model and makes conversation usage visible in real time.

## Features

- Real Groq API requests made with native `fetch`
- Full conversation history included with every request
- Clear loading and human-readable error states
- Prompt, completion, and total token tracking
- Model name, response time, and tokens-per-second metrics
- Conversation and metrics persisted in `localStorage`
- One-click conversation reset
- Responsive interface for desktop and mobile

## Run locally

1. Create a free account at [Groq Console](https://console.groq.com/).
2. Generate an API key.
3. Install dependencies:

   ```bash
   npm install
   ```

4. Copy the environment template:

   ```bash
   cp .env.example .env.local
   ```

5. Replace the placeholder in `.env.local` with your key:

   ```env
   NEXT_PUBLIC_GROQ_API_KEY=gsk_your_real_key
   ```

6. Start the app:

   ```bash
   npm run dev
   ```

Then open [http://localhost:3000](http://localhost:3000).

## Implementation notes

The assignment explicitly asks the browser to call Groq and suggests a `NEXT_PUBLIC_` environment variable, so this proof of concept follows that requirement. Public environment variables are included in the browser bundle. In a production application, keep `GROQ_API_KEY` server-side and proxy requests through a protected Next.js route.

The active model is `llama-3.1-8b-instant`, a production Llama 3 family model currently supported by Groq.

## API request

Every request is sent directly to:

```text
https://api.groq.com/openai/v1/chat/completions
```

The app manually sends both required headers:

```text
Authorization: Bearer <your_key>
Content-Type: application/json
```

No Groq SDK or third-party API wrapper is used.
