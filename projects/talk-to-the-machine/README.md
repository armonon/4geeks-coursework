# Talk to the Machine

An observable AI chat proof of concept built with Next.js, React, and the Groq Chat Completions API. It uses Meta's Llama 3.1 8B model and makes conversation usage visible in real time.

## Features

- Real Groq API requests proxied through a server-only Next.js route
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
   GROQ_API_KEY=gsk_your_real_key
   ```

6. Start the app:

   ```bash
   npm run dev
   ```

Then open [http://localhost:3000](http://localhost:3000).

## Implementation notes

The browser sends chat messages only to the local `/api/chat` route. That
server-side route reads `GROQ_API_KEY` and forwards the request to Groq, so the
secret is never included in the browser bundle or exposed in network request
headers sent by the client.

The active model is `llama-3.1-8b-instant`, a production Llama 3 family model currently supported by Groq.

## API request

The server-side route sends each request to:

```text
https://api.groq.com/openai/v1/chat/completions
```

Only the server route sends the authorization header:

```text
Authorization: Bearer <your_key>
Content-Type: application/json
```

No Groq SDK or third-party API wrapper is used. The client calls `/api/chat`
with conversation history and never receives the API key.

## Assignment checklist — 28/28 complete

### Account and setup

- [x] Create a free Groq account
- [x] Generate an API key and store it in an environment file
- [x] Configure a server-side fetch call to Groq with Bearer authentication

### Chat interface

- [x] Create and export the initial Next.js interface
- [x] Build a message input and send button
- [x] Display visually distinct user and AI messages
- [x] Manage messages and input with `useState`
- [x] Send the full conversation history with every request

### Promises and async flow

- [x] Handle the fetch promise with `async/await`
- [x] Show a thinking state while the request is in progress
- [x] Catch non-2xx and network errors and show readable feedback

### Token usage and metrics

- [x] Read the `usage` object after every response
- [x] Accumulate prompt tokens across the session
- [x] Accumulate completion tokens across the session
- [x] Display combined total tokens
- [x] Display model, response time, and tokens per second

### Session persistence

- [x] Load conversation history with `useEffect`
- [x] Save conversation and metrics to `localStorage`
- [x] Clear state and persisted data with one button

### Evaluation requirements

- [x] Call Groq from a server-only API route using both required headers
- [x] Send full conversation history on every API call
- [x] Use async/await and show loading state
- [x] Surface API errors without crashes or silent failures
- [x] Use `useState` for messages, loading, input, and metrics
- [x] Use `useEffect` to load and sync browser storage
- [x] Accumulate and display usage data accurately
- [x] Persist and manually clear the conversation
- [x] Show at least one metric beyond token counts
