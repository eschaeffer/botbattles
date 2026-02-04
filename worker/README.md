# Teacher Help Chatbot (Cloudflare Worker)

This Worker proxies chat requests to DeepSeek without exposing the API key in the browser.

## Required secrets / env vars
Set these in your Worker environment:
- `DEEPSEEK_API_KEY`
- `TEACHER_PASSPHRASE`

Optional:
- `DEEPSEEK_BASE_URL` (default: https://api.deepseek.com)
- `DEEPSEEK_MODEL` (default: deepseek-chat)
- `ALLOWED_HOSTS` (comma-separated hostnames, e.g. eschaeffer.github.io)
- `RATE_LIMIT_PER_MINUTE` (default: 20)

## Durable Object binding (rate limiting)
This Worker expects a Durable Object binding named `RATE_LIMITER`.
When deploying, bind it to the `RateLimiter` class in `teacher-help-worker.js`.

## Routes
- `POST /chat`

## Notes
- The frontend expects JSON: `{ passphrase, message }`.
- Responses are JSON: `{ reply }` or `{ error }`.
