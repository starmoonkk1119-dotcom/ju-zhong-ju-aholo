# 今天也要回答得体

Aholo Global 3D AI Hackathon entry: a first-person, cartoon-style interactive story about the socially acceptable answers expected at an ordinary family dinner.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite.

## Enable DeepSeek responses

Copy `.env.example` to `.env`, add your own DeepSeek API key, then start the AI proxy:

```bash
cp .env.example .env
npm run server
```

Keep `.env` private. The browser calls `/api/respond`; the API key stays in the local Node server. If the key is missing or the model request fails, the experience uses the built-in fallback dialogue logic.

## Deploy the public demo

The project includes Vercel serverless routes under `api/` so the public demo can keep using DeepSeek without exposing the API key in the browser.

1. Import this GitHub repository into Vercel.
2. Add `DEEPSEEK_API_KEY` as a Vercel environment variable.
3. Add `DEEPSEEK_MODEL` with `deepseek-chat`.
4. Add `DEEPSEEK_BASE_URL` with `https://api.deepseek.com`.
5. Deploy and test `/api/health` before sharing the public demo URL.

## Current vertical slice

- First-person 3D dining-room scene
- Three topics: food, work, and marriage
- Free-text player answers
- Responses from relatives, gossip bubbles, and small object changes
- Two short ending tones: temporarily safe or visibly pressured

The current scene uses procedural Three.js geometry so the interaction loop can be tested before the final Aholo Lux3D assets are selected. Selected cartoon-style `.glb` files will be added under `public/assets/aholo/` and documented in `docs/AHOLO_ASSET_LOG.md`.

## Project structure

```text
src/                         Three.js scene and interaction state
docs/                        Brief, submission checklist, asset log
public/assets/aholo/         Selected Aholo Lux3D assets
public/capture/              Process screenshots and final demo capture
```

## Submission evidence

The report should show:

1. Aholo input or reference image
2. Prompt and generation result
3. First-pass asset
4. Iteration change and reason
5. Final asset inside the scene
6. A working demo or video link
