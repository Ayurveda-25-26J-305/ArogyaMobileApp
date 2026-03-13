# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Arogya** is a cross-platform Ayurvedic health mobile app (iOS, Android, Web) built with React Native + Expo. Core features: user authentication, Prakriti (dosha constitution) assessment, disease prediction from symptoms, personalized medicine and diet recommendations, and an Ayurveda Q&A chatbot.

## Commands

```bash
# Install dependencies
npm install

# Start development server (choose platform in terminal)
npx expo start

# Run on specific platform
npm run android
npm run ios
npm run web

# Lint
npm run lint
```

There is no test suite configured.

## Architecture

### Routing
Uses Expo Router (file-based routing). `app/_layout.tsx` is the root layout — it monitors Supabase auth state and redirects unauthenticated users to `/login` or authenticated users to `/(tabs)`.

### Backend Services (two separate backends)
1. **Supabase** (`services/supabase.ts`): PostgreSQL + Auth. All CRUD for users, predictions, medicines, diet plans, Q&A history. RLS enabled — queries are scoped by `auth.uid()`.
2. **Python QA Server** (`services/api.ts`, `config.ts`): A Python backend exposed via ngrok during development. Handles the Q&A chatbot (`/api/ask`), Prakriti assessment (`/api/prakriti/assess`), and knowledge base stats. The ngrok URL in `config.ts` must be updated whenever the Colab/dev server restarts.

### Key Data Flow
- **Prakriti assessment** (`prakriti.tsx`): Quiz → calculates vata/pitta/kapha % → saves to Supabase `users` table → used as context in disease prediction and Q&A
- **Disease prediction** (`prediction.tsx`): Symptoms + dosha scores → external prediction API → result displayed and saved to `predictions` table
- **Q&A** (`(tabs)/qa.tsx`): User question + dosha/season context → ngrok Python backend → response stored in `qa_history` table

### Styling
NativeWind (Tailwind CSS for React Native). Custom Ayurveda color palette defined in `tailwind.config.js`:
- `ayurveda-primary/secondary/tertiary`: greens
- `ayurveda-vata`: blue, `ayurveda-pitta`: red/orange, `ayurveda-kapha`: light green

### Path Aliases
`@/` maps to the project root (configured in `tsconfig.json`).

### Constants
`utils/constants.ts` contains all domain data: symptom lists, Prakriti quiz questions, disease info (Sanskrit names, descriptions, dosha associations), dosha-symptom mappings, and `STORAGE_KEYS` for AsyncStorage.

## Important Notes

- The ngrok URL in `config.ts` changes every time the Python backend (Google Colab or local) restarts — update it before running the Q&A or Prakriti assessment features.
- Supabase credentials are hardcoded in `services/supabase.ts` (publishable anon key — this is the intended Supabase pattern, but move to env vars before production).
- `newArchEnabled: true` in `app.json` — React Native New Architecture is active; be cautious with third-party libraries that don't support it.
