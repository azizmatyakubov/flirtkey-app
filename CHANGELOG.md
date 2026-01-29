# Changelog

All notable changes to FlirtKey are documented here.

## [Unreleased]

### Added

- **History Button** — Quick access to conversation history from HomeScreen header
- **Home Screen Quick Actions** — Usage count badges on quick action buttons
- **Copy to Clipboard** — One-tap copy with haptic feedback on all AI screens, auto-records to history
- **Conversation History** — Full history service with History screen and dedicated Favorites tab
- **Backend Tests** — Comprehensive Jest test suite for the proxy server
- **Sound Like Me** — Style analyzer integrated into core reply generation for personalized responses
- **Dual API Mode** — Server proxy (default) with BYOK (Bring Your Own Key) fallback
- **Backend API Proxy** — Express.js proxy server for OpenAI with device-token auth and rate limiting

### Fixed

- TypeScript compilation errors in source and test files
- Gender-exclusive terminology replaced with gender-neutral "Contact"
- AddGirlScreen free tier `maxGirls` limit enforcement
- ChatScreen missing subscription limit check and usage recording
- PaywallScreen double-tap on subscribe/trial buttons
- ChatScreen pull-to-refresh duplicate API call while loading
- Race condition in `recordSuggestionUse` allowing daily limit bypass
- QuickReplyScreen subscription limit bypass
- AnalyticsScreen infinite re-render loop from unstable `getConversationsForGirl` ref

### Changed

- Comprehensive upgrade and feature audit report added
- Five rounds of polish and optimization applied across the codebase
