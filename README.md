# 💘 FlirtKey — AI Dating Assistant

> Your AI wingman for better conversations. Smart, witty message suggestions tailored to each connection.

[![Expo](https://img.shields.io/badge/Expo-SDK_54-000020?logo=expo)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React_Native-0.81-61DAFB?logo=react)](https://reactnative.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## ✨ Features

### Core AI Features

- 🎯 **Smart Suggestions** — 3 response options per message: Safe / Balanced / Bold
- 📸 **Screenshot Analysis** — Upload chat screenshots for deep AI context analysis
- 🧠 **Sound Like Me** — AI learns your texting style and generates replies that match your voice
- 🌍 **Culture-Aware Prompts** — Uzbek, Russian, Western, Asian, and Universal communication styles

### Dual API Mode

- 🔒 **Server Proxy (Default)** — Backend proxy handles OpenAI calls; users don't need their own API key
- 🔑 **BYOK Fallback** — Bring Your Own Key mode for users who prefer direct OpenAI access

### Contacts & Profiles

- 👤 **Contact Profiles** — Store interests, personality traits, inside jokes, and communication style
- 📈 **Relationship Stage Tracking** — From "Just Met" to "Serious" with stage-appropriate suggestions
- 💡 **Pro Tips** — Psychology-backed flirting insights for each stage

### History & Favorites

- 📜 **Conversation History** — Full log of all generated suggestions with timestamps
- ⭐ **Favorites** — Save and quickly access your best replies
- 📋 **Copy to Clipboard** — One-tap copy with haptic feedback
- 🔢 **Usage Count Badges** — Track how often you use each quick action

### Quick Actions (Home Screen)

- ⚡ **Quick Reply** — Generate instant responses without full context
- 💬 **Conversation Starters** — AI-powered openers for new conversations
- 🎉 **Date Ideas** — Creative, personalized date suggestions
- 🚫 **What to Avoid** — AI warns you about conversation pitfalls
- 📊 **Interest Level Analysis** — Gauge how interested they are based on messages

### Quality & UX

- 🌙 **Dark/Light Theme** — System-aware with manual override
- ♿ **Accessibility** — Reduce motion, high contrast, large text, screen reader support
- 📴 **Offline-First** — Requests queue when offline, replay on reconnect
- 💾 **Response Caching** — 24h TTL to reduce redundant API calls
- 📳 **Haptic Feedback** — Tactile response on copy, favorite, and interactions

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────┐
│              FlirtKey Mobile App (Expo / React Native)        │
├──────────────────────────────────────────────────────────────┤
│  Screens (14+)          │  Components (50+)                  │
│  ├── Onboarding Flow    │  ├── Form (TextInput, Pickers)     │
│  ├── Home + Quick Acts  │  ├── Chat (Bubble, Suggestions)    │
│  ├── Contact Profiles   │  ├── Display (Avatar, Badge)       │
│  ├── History + Favs     │  ├── Loading / Error / Empty       │
│  ├── Screenshot OCR     │  └── Accessibility wrappers        │
│  └── Settings           │                                     │
├──────────────────────────────────────────────────────────────┤
│  Services               │  Hooks (15+)                       │
│  ├── ai.ts (OpenAI)     │  useContact, useContacts           │
│  ├── styleAnalyzer.ts   │  useHistory, useForm               │
│  ├── historyService.ts  │  useNetworkStatus, useDebounce     │
│  ├── apiClient.ts       │  useAppState, useOrientation       │
│  ├── responseCache.ts   │  useAsyncState                     │
│  ├── offlineQueue.ts    │                                     │
│  ├── ocr.ts             │                                     │
│  └── humanizer.ts       │                                     │
├──────────────────────────────────────────────────────────────┤
│  State: Zustand + persist → AsyncStorage                     │
│  ├── useStore (contacts, conversations, cache)               │
│  ├── useSettingsStore (theme, prefs, a11y)                   │
│  └── subscriptionStore (tier, usage tracking)                │
├──────────────────────────────────────────────────────────────┤
│             Backend API Proxy (Express.js)                    │
│  ├── Device-token auth (no accounts needed)                  │
│  ├── Per-user usage tracking + rate limits                   │
│  ├── Free tier: 5 req/day │ Premium: unlimited               │
│  └── Proxies to OpenAI API (gpt-4o-mini)                    │
└──────────────────────────────────────────────────────────────┘
```

### Key Patterns

- **Zustand selectors** — `useStore((s) => s.field)` prevents full re-renders
- **Offline-first** — Requests queue when offline, auto-replay on reconnect
- **Response caching** — 24h TTL reduces API calls for similar prompts
- **Error boundaries** — Per-screen error recovery
- **Culture-aware prompts** — Different styles for different cultural contexts
- **Dual API mode** — Server proxy by default, BYOK as fallback

---

## 📁 Project Structure

```
flirtkey-app/
├── src/
│   ├── components/          # 50+ reusable UI components
│   ├── screens/             # 14+ app screens
│   ├── services/            # AI, OCR, caching, history, offline queue
│   ├── stores/              # Zustand stores (contacts, settings, subscription)
│   ├── hooks/               # 15+ custom React hooks
│   ├── contexts/            # ThemeContext
│   ├── types/               # TypeScript definitions
│   ├── utils/               # Validation, haptics, formatting, a11y
│   └── constants/           # Theme, config, navigation, prompts
├── backend/                 # Express.js API proxy server
│   ├── server.js            # Proxy server with auth + rate limiting
│   ├── __tests__/           # Jest test suite
│   ├── ecosystem.config.js  # PM2 configuration
│   └── package.json
├── assets/                  # App icons, splash screen
├── eas.json                 # EAS Build configuration
└── package.json
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm
- Expo CLI: `npm install -g expo-cli`
- iOS Simulator (Mac) or Android Emulator

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/flirtkey-app.git
cd flirtkey-app

# Install app dependencies
npm install

# Install backend dependencies
cd backend && npm install && cd ..

# Start development server
npm start
```

### Running the Backend Proxy

```bash
cd backend

# Set environment variables
export OPENAI_API_KEY=sk-your-key-here
export AUTH_SECRET=your-secret-key
export PORT=4060

# Start the server
npm start          # Production
npm run dev        # Development (auto-reload)
```

### Running the App

```bash
npm run ios        # iOS Simulator
npm run android    # Android Emulator
npm run web        # Web (limited features)
```

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)

| Variable         | Required | Default  | Description                         |
| ---------------- | -------- | -------- | ----------------------------------- |
| `OPENAI_API_KEY` | ✅       | —        | OpenAI API key for proxied requests |
| `AUTH_SECRET`    | ✅       | —        | Secret for device token signing     |
| `PORT`           | —        | `4060`   | Server port                         |
| `DATA_DIR`       | —        | `./data` | Directory for user data persistence |

### App (`.env`)

| Variable             | Required | Default       | Description                     |
| -------------------- | -------- | ------------- | ------------------------------- |
| `APP_ENV`            | —        | `development` | Environment mode                |
| `API_TIMEOUT_MS`     | —        | `30000`       | API request timeout             |
| `MAX_RETRY_ATTEMPTS` | —        | `3`           | Max retries for failed requests |
| `ENABLE_ANALYTICS`   | —        | `false`       | Enable analytics tracking       |
| `DEBUG_MODE`         | —        | `true`        | Enable debug logging            |

---

## 🛠️ Development

### Scripts

| Command                 | Description                |
| ----------------------- | -------------------------- |
| `npm start`             | Start Expo dev server      |
| `npm run ios`           | Run on iOS Simulator       |
| `npm run android`       | Run on Android Emulator    |
| `npm run lint`          | Run ESLint                 |
| `npm run lint:fix`      | Auto-fix lint issues       |
| `npm run format`        | Format with Prettier       |
| `npm run typecheck`     | TypeScript type check      |
| `npm test`              | Run Jest tests             |
| `npm run test:coverage` | Tests with coverage report |

### Code Quality

- **ESLint** + **Prettier** — Enforced via Husky pre-commit hooks
- **TypeScript** — Strict mode, full type coverage
- **Jest** — Unit and integration tests

---

## 📦 Building for Production

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Build for stores
eas build --profile production --platform ios
eas build --profile production --platform android

# Submit to stores
eas submit --platform all
```

---

## 🔐 Security

- **API keys** stored in `expo-secure-store` (device-level Keychain/Keystore encryption)
- **Backend proxy** keeps the OpenAI key server-side — never exposed to clients
- **Device-token auth** for backend with HMAC signing
- **All profile data** stored locally on device
- **No analytics/tracking** by default
- **Helmet.js** security headers on backend

---

## 🧪 Testing

```bash
# App tests
npm test
npm run test:coverage

# Backend tests
cd backend && npm test
```

---

## 📖 Documentation

- [DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md) — Full development roadmap
- [STORE_ASSETS.md](./STORE_ASSETS.md) — App store listing assets
- [CONTRIBUTING.md](./CONTRIBUTING.md) — Contribution guidelines
- [backend/README.md](./backend/README.md) — Backend proxy documentation

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

**Made with 💘 by the FlirtKey Team**
