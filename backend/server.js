/**
 * FlirtKey API Proxy Server
 *
 * Proxies OpenAI API requests so mobile app users don't need their own key.
 * - Simple device-token auth (no full user accounts yet — Phase 1)
 * - Per-user usage tracking with rate limits
 * - Free tier: 5 requests/day, Premium: unlimited
 * - Persists usage data to a local JSON file (upgrade to DB later)
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// ==========================================
// Config
// ==========================================

const PORT = process.env.PORT || 4060;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const AUTH_SECRET = process.env.AUTH_SECRET || 'flirtkey-dev-secret-change-me';
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');

// Rate limits
const FREE_DAILY_LIMIT = 5;
const PREMIUM_DAILY_LIMIT = Infinity; // unlimited

// OpenAI proxy target
const OPENAI_BASE_URL = 'https://api.openai.com/v1';

// ==========================================
// Persistence (simple JSON file store)
// ==========================================

const USERS_FILE = path.join(DATA_DIR, 'users.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadUsers() {
  ensureDataDir();
  if (fs.existsSync(USERS_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
    } catch {
      return {};
    }
  }
  return {};
}

function saveUsers(users) {
  ensureDataDir();
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// In-memory user DB (loaded from disk on startup, flushed periodically)
let users = loadUsers();
let dirty = false;

// Flush to disk every 30 seconds if dirty
setInterval(() => {
  if (dirty) {
    saveUsers(users);
    dirty = false;
  }
}, 30_000);

// Also flush on exit
process.on('SIGTERM', () => { saveUsers(users); process.exit(0); });
process.on('SIGINT', () => { saveUsers(users); process.exit(0); });

// ==========================================
// User / Token helpers
// ==========================================

/**
 * Register or retrieve a user by device ID.
 * Returns { userId, token, tier, createdAt }
 */
function getOrCreateUser(deviceId) {
  if (!deviceId || typeof deviceId !== 'string' || deviceId.length < 8) {
    return null;
  }

  // Hash device ID for privacy
  const hashedDevice = crypto.createHmac('sha256', AUTH_SECRET).update(deviceId).digest('hex');

  if (users[hashedDevice]) {
    return users[hashedDevice];
  }

  const user = {
    userId: uuidv4(),
    token: crypto.randomBytes(32).toString('hex'),
    tier: 'free', // 'free' | 'premium'
    createdAt: new Date().toISOString(),
    usage: {}, // { 'YYYY-MM-DD': count }
  };

  users[hashedDevice] = user;
  dirty = true;
  return user;
}

/**
 * Find user by auth token.
 */
function getUserByToken(token) {
  if (!token) return null;
  return Object.values(users).find(u => u.token === token) || null;
}

/**
 * Get today's date string for usage tracking.
 */
function today() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get a user's request count for today.
 */
function getTodayUsage(user) {
  return user.usage?.[today()] || 0;
}

/**
 * Increment a user's daily usage.
 */
function incrementUsage(user) {
  const key = today();
  if (!user.usage) user.usage = {};
  user.usage[key] = (user.usage[key] || 0) + 1;
  dirty = true;

  // Clean up old usage data (keep last 30 days)
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  const cutoffStr = cutoff.toISOString().split('T')[0];
  for (const dateKey of Object.keys(user.usage)) {
    if (dateKey < cutoffStr) {
      delete user.usage[dateKey];
    }
  }
}

/**
 * Check if user has remaining requests.
 */
function hasRemainingRequests(user) {
  const limit = user.tier === 'premium' ? PREMIUM_DAILY_LIMIT : FREE_DAILY_LIMIT;
  return getTodayUsage(user) < limit;
}

/**
 * Get user's daily limit based on tier.
 */
function getDailyLimit(user) {
  return user.tier === 'premium' ? PREMIUM_DAILY_LIMIT : FREE_DAILY_LIMIT;
}

// ==========================================
// Express App
// ==========================================

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Large for base64 images

// ==========================================
// Auth middleware
// ==========================================

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.slice(7);
  const user = getUserByToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Invalid auth token' });
  }

  req.user = user;
  next();
}

// ==========================================
// Rate-limit middleware
// ==========================================

function requireQuota(req, res, next) {
  const user = req.user;
  if (!hasRemainingRequests(user)) {
    const limit = getDailyLimit(user);
    return res.status(429).json({
      error: 'Daily request limit reached',
      code: 'RATE_LIMIT_EXCEEDED',
      limit,
      used: getTodayUsage(user),
      tier: user.tier,
      resetsAt: new Date(new Date().setHours(24, 0, 0, 0)).toISOString(),
      upgradeMessage: user.tier === 'free'
        ? 'Upgrade to Premium for unlimited requests!'
        : undefined,
    });
  }
  next();
}

// ==========================================
// Routes
// ==========================================

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    hasApiKey: !!OPENAI_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

// Register / login — returns an auth token for the device
app.post('/auth/register', (req, res) => {
  const { deviceId } = req.body;
  if (!deviceId || typeof deviceId !== 'string' || deviceId.length < 8) {
    return res.status(400).json({ error: 'deviceId is required (min 8 chars)' });
  }

  const user = getOrCreateUser(deviceId);
  if (!user) {
    return res.status(500).json({ error: 'Could not create user' });
  }

  res.json({
    token: user.token,
    userId: user.userId,
    tier: user.tier,
    dailyLimit: getDailyLimit(user),
    usedToday: getTodayUsage(user),
    remainingToday: Math.max(0, getDailyLimit(user) - getTodayUsage(user)),
  });
});

// Get usage info
app.get('/usage', requireAuth, (req, res) => {
  const user = req.user;
  const limit = getDailyLimit(user);
  const used = getTodayUsage(user);

  res.json({
    tier: user.tier,
    dailyLimit: limit === Infinity ? null : limit,
    usedToday: used,
    remainingToday: limit === Infinity ? null : Math.max(0, limit - used),
    resetsAt: new Date(new Date().setHours(24, 0, 0, 0)).toISOString(),
  });
});

// ==========================================
// OpenAI proxy endpoint
// ==========================================

app.post('/proxy/chat/completions', requireAuth, requireQuota, async (req, res) => {
  if (!OPENAI_API_KEY) {
    return res.status(503).json({ error: 'Server API key not configured' });
  }

  const { model, messages, temperature, max_tokens } = req.body;

  // Validation
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array is required' });
  }

  // Restrict to allowed models
  const allowedModels = ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo'];
  const requestedModel = model || 'gpt-4o-mini';
  if (!allowedModels.includes(requestedModel)) {
    return res.status(400).json({ error: `Model not allowed. Use: ${allowedModels.join(', ')}` });
  }

  // Cap max_tokens to prevent abuse
  const cappedMaxTokens = Math.min(max_tokens || 1000, 2000);

  try {
    // Use native fetch (Node 18+)
    const openaiRes = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: requestedModel,
        messages,
        temperature: temperature ?? 0.8,
        max_tokens: cappedMaxTokens,
      }),
    });

    const data = await openaiRes.json();

    if (!openaiRes.ok) {
      // Forward OpenAI error status but don't leak our key
      const errorMsg = data?.error?.message || 'OpenAI API error';
      return res.status(openaiRes.status).json({
        error: errorMsg,
        code: data?.error?.code || 'OPENAI_ERROR',
      });
    }

    // Increment usage on success
    incrementUsage(req.user);

    // Return OpenAI response + usage metadata
    res.json({
      ...data,
      _flirtkey: {
        tier: req.user.tier,
        usedToday: getTodayUsage(req.user),
        dailyLimit: getDailyLimit(req.user) === Infinity ? null : getDailyLimit(req.user),
        remainingToday: hasRemainingRequests(req.user)
          ? (getDailyLimit(req.user) === Infinity ? null : getDailyLimit(req.user) - getTodayUsage(req.user))
          : 0,
      },
    });
  } catch (err) {
    console.error('[proxy] OpenAI request failed:', err.message);
    res.status(502).json({
      error: 'Failed to reach OpenAI API',
      code: 'PROXY_ERROR',
    });
  }
});

// ==========================================
// Admin routes (protected by admin secret)
// ==========================================

function requireAdmin(req, res, next) {
  const adminKey = req.headers['x-admin-key'];
  if (!adminKey || adminKey !== AUTH_SECRET) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
}

// Set a user's tier
app.post('/admin/set-tier', requireAdmin, (req, res) => {
  const { userId, tier } = req.body;
  if (!userId || !['free', 'premium'].includes(tier)) {
    return res.status(400).json({ error: 'userId and tier (free|premium) are required' });
  }

  const user = Object.values(users).find(u => u.userId === userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  user.tier = tier;
  dirty = true;

  res.json({ userId: user.userId, tier: user.tier });
});

// List all users (summary)
app.get('/admin/users', requireAdmin, (_req, res) => {
  const summary = Object.values(users).map(u => ({
    userId: u.userId,
    tier: u.tier,
    createdAt: u.createdAt,
    usedToday: getTodayUsage(u),
    totalUsage: Object.values(u.usage || {}).reduce((a, b) => a + b, 0),
  }));
  res.json({ count: summary.length, users: summary });
});

// ==========================================
// Start
// ==========================================

app.listen(PORT, () => {
  console.log(`🔑 FlirtKey API Proxy running on port ${PORT}`);
  console.log(`   OpenAI key: ${OPENAI_API_KEY ? '✅ configured' : '❌ MISSING — set OPENAI_API_KEY env var'}`);
  console.log(`   Free tier limit: ${FREE_DAILY_LIMIT} requests/day`);
  console.log(`   Data dir: ${DATA_DIR}`);
});

module.exports = app;
