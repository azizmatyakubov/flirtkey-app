# Contributing to FlirtKey

First off, thanks for taking the time to contribute! 🎉

This document provides guidelines for contributing to FlirtKey. These are guidelines, not rules. Use your best judgment, and feel free to propose changes to this document.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How Can I Contribute?](#how-can-i-contribute)
- [Style Guidelines](#style-guidelines)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)

---

## Code of Conduct

This project and everyone participating in it is governed by our commitment to a welcoming and inclusive community. By participating, you are expected to:

- **Be respectful** of differing viewpoints and experiences
- **Accept constructive criticism** gracefully
- **Focus on what's best** for the community
- **Show empathy** towards other community members

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Git
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac) or Android Emulator

### Fork & Clone

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/flirtkey-app.git
   cd flirtkey-app
   ```
3. Add the upstream remote:
   ```bash
   git remote add upstream https://github.com/original/flirtkey-app.git
   ```

---

## Development Setup

### Install Dependencies

```bash
npm install
```

### Start Development Server

```bash
npm start
```

### Running Tests

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

### Code Quality

```bash
# Lint code
npm run lint

# Fix lint issues
npm run lint:fix

# Format code
npm run format

# Type check
npm run typecheck
```

---

## How Can I Contribute?

### 🐛 Reporting Bugs

Before creating a bug report:

- Check the [existing issues](https://github.com/original/flirtkey-app/issues)
- Test with the latest version

When creating a bug report, include:

- **Device/Emulator:** (e.g., iPhone 15, Pixel 7, iOS Simulator)
- **OS Version:** (e.g., iOS 17.2, Android 14)
- **App Version:** (from Settings → About)
- **Steps to Reproduce:** Detailed steps
- **Expected Behavior:** What you expected
- **Actual Behavior:** What actually happened
- **Screenshots/Logs:** If applicable

### 💡 Suggesting Features

Feature suggestions are welcome! Please:

- Check if it's already suggested
- Explain the problem it solves
- Describe your proposed solution
- Consider edge cases

### 📝 Documentation

Help improve our docs:

- Fix typos or unclear explanations
- Add examples
- Translate documentation

### 🔧 Code Contributions

Good first issues are labeled `good first issue`. Look for:

- `bug` - Something isn't working
- `enhancement` - New feature or improvement
- `documentation` - Documentation updates
- `help wanted` - Extra attention needed

---

## Style Guidelines

### TypeScript

We use TypeScript with strict mode. Follow these conventions:

```typescript
// ✅ Good: Explicit types for function parameters
function greet(name: string): string {
  return `Hello, ${name}!`;
}

// ✅ Good: Interface for component props
interface ButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
}

// ✅ Good: Type for union types
type Tone = 'safe' | 'balanced' | 'bold';

// ❌ Avoid: any type
function process(data: any) { ... }

// ✅ Better: unknown with type guards
function process(data: unknown) {
  if (typeof data === 'string') { ... }
}
```

### React Native / Expo

```typescript
// ✅ Good: Functional components with TypeScript
const MyComponent: React.FC<Props> = ({ title, onPress }) => {
  return (
    <TouchableOpacity onPress={onPress}>
      <Text>{title}</Text>
    </TouchableOpacity>
  );
};

// ✅ Good: Use hooks appropriately
const [value, setValue] = useState<string>('');

// ✅ Good: Memoize expensive operations
const expensiveValue = useMemo(() => compute(data), [data]);
const handlePress = useCallback(() => { ... }, [dependency]);
```

### File Naming

```
src/
├── components/
│   ├── Button.tsx           # PascalCase for components
│   ├── Card/
│   │   ├── index.tsx        # Use index for folder components
│   │   ├── Card.styles.ts   # Styles in separate file
│   │   └── Card.test.tsx    # Tests next to component
│   └── index.ts             # Barrel export
├── hooks/
│   └── useDebounce.ts       # camelCase with "use" prefix
├── utils/
│   └── formatDate.ts        # camelCase for utilities
└── types/
    └── girl.ts              # lowercase for type files
```

### Imports

```typescript
// ✅ Good: Organized imports
// 1. React/React Native
import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

// 2. Third-party libraries
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

// 3. Local imports (with path aliases)
import { Button, Card } from '@/components';
import { useGirl } from '@/hooks';
import { formatDate } from '@/utils';
import { Girl } from '@/types';

// 4. Relative imports (if needed)
import { styles } from './styles';
```

### Styling

We use a combination of StyleSheet and Tailwind-like utilities via NativeWind:

```typescript
// For component-specific styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.md,
  },
});

// For theme values, use constants
import { colors, spacing, typography } from '@/constants/theme';
```

---

## Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

### Format

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### Types

| Type       | Description                               |
| ---------- | ----------------------------------------- |
| `feat`     | New feature                               |
| `fix`      | Bug fix                                   |
| `docs`     | Documentation only                        |
| `style`    | Code style (formatting, semicolons, etc.) |
| `refactor` | Code refactoring (no feature/bug change)  |
| `perf`     | Performance improvement                   |
| `test`     | Adding or fixing tests                    |
| `chore`    | Build process, dependencies, etc.         |

### Examples

```bash
# Feature
feat(chat): add suggestion favoriting

# Bug fix
fix(profile): prevent crash on empty interests

# Documentation
docs: add API key setup instructions

# Style
style(components): format Button component

# Refactor
refactor(hooks): simplify useDebounce implementation

# With scope and body
feat(ai): add GPT-4 Vision support for screenshots

Implemented screenshot analysis using GPT-4 Vision API.
Includes image compression and base64 encoding.

Closes #42
```

---

## Pull Request Process

### Before Submitting

1. **Sync with upstream:**

   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Run all checks:**

   ```bash
   npm run lint
   npm run typecheck
   npm test
   ```

3. **Update documentation** if needed

### PR Title

Follow the same format as commit messages:

```
feat(chat): add message editing before copy
```

### PR Description Template

```markdown
## Description

Brief description of what this PR does.

## Type of Change

- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## How Has This Been Tested?

- [ ] iOS Simulator
- [ ] Android Emulator
- [ ] Physical device

## Screenshots (if applicable)

## Checklist

- [ ] My code follows the style guidelines
- [ ] I have performed a self-review
- [ ] I have commented complex code
- [ ] I have updated documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests
- [ ] All tests pass locally
```

### Review Process

1. Automated checks must pass (lint, tests, typecheck)
2. At least one maintainer review required
3. All review comments must be addressed
4. Branch must be up-to-date with main

### After Merge

- Delete your feature branch
- Celebrate! 🎉

---

## Questions?

Feel free to:

- Open an issue with the `question` label
- Reach out to maintainers

---

**Thank you for contributing to FlirtKey! 💘**
