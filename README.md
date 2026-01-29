# 💘 FlirtKey - AI Dating Assistant

> Your AI wingman for better conversations. Smart, witty message suggestions tailored to each connection.

[![Expo](https://img.shields.io/badge/Expo-SDK_54-000020?logo=expo)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React_Native-0.81-61DAFB?logo=react)](https://reactnative.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## ✨ Features

| Feature                    | Description                                                       |
| -------------------------- | ----------------------------------------------------------------- |
| 👩 **Girl Profiles**       | Store everything about her - interests, personality, inside jokes |
| 🎯 **Smart Suggestions**   | 3 options for every message: Safe / Balanced / Bold               |
| 📸 **Screenshot Analysis** | Upload chat screenshots for deep AI analysis                      |
| 🌍 **Culture-Aware**       | Uzbek, Russian, Western, Asian, and more communication styles     |
| 📈 **Stage Tracking**      | From "Just Met" to "Serious" - track relationship progress        |
| 💡 **Pro Tips**            | Learn the psychology behind great flirting                        |
| 🔒 **Privacy First**       | All data stays on YOUR device                                     |

---

## 📱 Screenshots

_Coming soon..._

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ ([install](https://nodejs.org))
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- iOS Simulator (Mac only) or Android Emulator
- OpenAI API key ([get one](https://platform.openai.com))

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/flirtkey-app.git
cd flirtkey-app

# Install dependencies
npm install

# Start development server
npm start
```

### Running the App

```bash
# iOS (requires Mac with Xcode)
npm run ios

# Android (requires Android Studio/emulator)
npm run android

# Web (limited features)
npm run web
```

### Using the App

1. Complete the quick onboarding
2. Add your OpenAI API key in Settings
3. Create a profile for someone you're texting
4. Enter their message and generate suggestions!

---

## 🏗️ Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────┐
│  App.tsx (GestureHandler → ErrorBoundary     │
│  → ThemeProvider → ToastProvider → Navigator) │
├─────────────────────────────────────────────┤
│  Screens (14)        Components (50+)        │
│  ├─ Onboarding Flow  ├─ Form (TextInput…)   │
│  ├─ Home / Chat      ├─ Display (Avatar…)   │
│  ├─ Profiles         ├─ Chat (Bubble…)      │
│  ├─ Screenshot       ├─ Suggestions          │
│  └─ Settings         └─ Loading / Error      │
├─────────────────────────────────────────────┤
│  Hooks (15)     │  Services (7)             │
│  useAI          │  ai (OpenAI GPT)          │
│  useForm        │  ocr                      │
│  useImagePicker │  offlineQueue             │
│  useDebounce    │  responseCache            │
│  useOrientation │  storage (SecureStore)    │
│  …              │  feedback                 │
├─────────────────────────────────────────────┤
│  Stores (Zustand + persist → AsyncStorage)   │
│  ├─ useStore (girls, conversations, cache)   │
│  └─ useSettingsStore (theme, prefs, a11y)    │
└─────────────────────────────────────────────┘
```

### Key Patterns

- **Zustand selectors** — all store access uses `useStore((s) => s.field)` to avoid full re-renders
- **Offline-first** — requests queue when offline, replay on reconnect
- **Response caching** — 24h TTL on suggestion cache to reduce API calls
- **Error boundaries** — per-screen error recovery with `ErrorBoundary`
- **Accessibility** — reduce motion, high contrast, haptic feedback, large text
- **Culture-aware prompts** — Uzbek, Russian, Western, Asian, Universal styles

### Project Structure

```
flirtkey-app/
├── src/
│   ├── components/      # 50+ reusable UI components
│   ├── screens/         # 14 app screens
│   ├── services/        # AI, OCR, caching, offline queue
│   ├── stores/          # Zustand state (useStore, useSettingsStore)
│   ├── hooks/           # 15 custom hooks
│   ├── contexts/        # ThemeContext
│   ├── types/           # TypeScript definitions
│   ├── utils/           # Validation, a11y, haptics, formatting
│   └── constants/       # Theme, config, navigation, prompts
├── assets/              # App icons and splash
├── eas.json             # EAS Build configuration
└── package.json
```

---

## 🛠️ Development

### Scripts

| Command                 | Description                   |
| ----------------------- | ----------------------------- |
| `npm start`             | Start Expo development server |
| `npm run ios`           | Run on iOS simulator          |
| `npm run android`       | Run on Android emulator       |
| `npm run lint`          | Run ESLint                    |
| `npm run lint:fix`      | Fix ESLint issues             |
| `npm run format`        | Format code with Prettier     |
| `npm run typecheck`     | Check TypeScript types        |
| `npm test`              | Run tests                     |
| `npm run test:coverage` | Run tests with coverage       |

### Code Quality

This project uses:

- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Husky** - Git hooks for pre-commit checks
- **TypeScript** - Static type checking

Pre-commit hooks automatically run linting and formatting.

### Environment Variables

Create a `.env` file based on `.env.example`:

```bash
# App Environment
APP_ENV=development

# Feature Flags
ENABLE_ANALYTICS=false
ENABLE_CRASH_REPORTING=false

# API Configuration
API_TIMEOUT_MS=30000
MAX_RETRY_ATTEMPTS=3

# Debug
DEBUG_MODE=true
LOG_LEVEL=debug
```

---

## 📦 Building for Production

### Prerequisites

1. Install EAS CLI:

   ```bash
   npm install -g eas-cli
   ```

2. Login to Expo:

   ```bash
   eas login
   ```

3. Initialize EAS (first time only):
   ```bash
   eas init
   ```
   This will create/update your `eas.json` and add the project ID to `app.config.js`.

### Build Commands

```bash
# Development build (with dev client)
eas build --profile development --platform ios
eas build --profile development --platform android

# Preview build (internal testing)
eas build --profile preview --platform all

# Production build (for app stores)
eas build --profile production --platform ios
eas build --profile production --platform android

# Build for all platforms
eas build --profile production --platform all
```

### iOS-Specific Setup

1. **Apple Developer Account** required ($99/year)
2. EAS handles provisioning profiles automatically
3. For manual setup:
   ```bash
   eas credentials
   ```

### Android-Specific Setup

1. EAS generates a keystore automatically for first build
2. For existing keystore:
   ```bash
   eas credentials
   # Select Android → Keystore → Upload
   ```

### Submitting to Stores

```bash
# Submit to App Store
eas submit --platform ios

# Submit to Play Store
eas submit --platform android

# Submit to both
eas submit --platform all
```

---

## 🔐 Security

### API Key Storage

- OpenAI API keys are stored in `expo-secure-store`
- Uses device-level encryption (Keychain on iOS, Keystore on Android)
- Keys are never sent to any server except OpenAI

### Data Privacy

- All profile data stored locally in `AsyncStorage`
- No analytics or tracking by default
- Optional crash reporting (disabled by default)
- See [STORE_ASSETS.md](./STORE_ASSETS.md) for full privacy policy

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Test Structure

```
__tests__/
├── components/    # Component tests
├── hooks/         # Hook tests
├── services/      # Service tests
├── stores/        # Store tests
└── utils/         # Utility tests
```

---

## 📖 Documentation

- [DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md) - Full development roadmap
- [STORE_ASSETS.md](./STORE_ASSETS.md) - App store assets and copy
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Contribution guidelines

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

Quick start:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `npm test`
5. Commit: `git commit -m 'Add amazing feature'`
6. Push: `git push origin feature/amazing-feature`
7. Open a Pull Request

---

## 🐛 Troubleshooting

### Common Issues

#### "Cannot find module" errors

```bash
# Clear caches and reinstall
rm -rf node_modules
npm cache clean --force
npm install
```

#### Metro bundler issues

```bash
# Reset Metro cache
npx expo start --clear
```

#### iOS build fails

```bash
# Reinstall pods
cd ios && pod install && cd ..
```

#### Android build fails

```bash
# Clean Gradle cache
cd android && ./gradlew clean && cd ..
```

#### API key not saving

- Ensure you're testing on a physical device or properly configured emulator
- Check that expo-secure-store is properly installed
- Try reinstalling the app

#### Screenshots not loading

- Check photo library permissions in device settings
- Restart the app after granting permissions

### Getting Help

1. Check [Issues](https://github.com/yourusername/flirtkey-app/issues)
2. Create a new issue with:
   - Device/emulator info
   - React Native version
   - Steps to reproduce
   - Error messages/logs

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [OpenAI](https://openai.com) - GPT-4 API powering suggestions
- [Expo](https://expo.dev) - React Native tooling
- [Zustand](https://github.com/pmndrs/zustand) - State management

---

## 📬 Contact

- **Support:** support@flirtkey.app
- **Privacy:** privacy@flirtkey.app
- **Twitter:** [@FlirtKeyApp](https://twitter.com/FlirtKeyApp)

---

**Made with 💘 by the FlirtKey Team**
