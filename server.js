require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const API_BASE_URL = process.env.API_BASE_URL || 'https://api.ashcon.app/mojang/v2/user/';
const HIDE_IP = process.env.HIDE_IP === 'true';
const TIMEOUT = parseInt(process.env.DEFAULT_TIMEOUT) || 10000;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*'
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/templates', express.static(path.join(__dirname, 'templates')));

const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = parseInt(process.env.RATE_LIMIT_WINDOW) || 900000;
const RATE_LIMIT_MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100;

function rateLimitMiddleware(req, res, next) {
  if (process.env.CORS_ORIGIN === '*') return next();
  
  const ip = HIDE_IP ? (req.headers['x-forwarded-for'] || req.ip || req.connection.remoteAddress) : req.ip;
  const now = Date.now();
  
  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return next();
  }
  
  const userData = rateLimitMap.get(ip);
  if (now > userData.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return next();
  }
  
  if (userData.count >= RATE_LIMIT_MAX_REQUESTS) {
    return res.status(429).json({ 
      error: 'Too many requests',
      message: 'Please try again later',
      retryAfter: Math.ceil((userData.resetTime - now) / 1000)
    });
  }
  
  userData.count++;
  next();
}

app.use(rateLimitMiddleware);

async function checkMinecraftAccount(username) {
  try {
    const response = await axios.get(`${API_BASE_URL}${username}`, {
      timeout: TIMEOUT,
      headers: {
        'User-Agent': 'Minecraft-Checker-API/by-Rikixz'
      }
    });
    const data = response.data;
    if (data.error) {
      return { error: data.error || 'User not found', username: username, exists: false };
    }
    return { ...data, exists: true };
  } catch (error) {
    if (error.response) {
      if (error.response.status === 404) {
        return { error: 'User not found', username: username, exists: false };
      }
      return { error: error.response.data?.error || 'API error', code: error.response.status, exists: false };
    }
    return { error: 'Service unavailable', message: error.message, exists: false };
  }
}

app.get('/api/skin/:username', async (req, res) => {
  const { username } = req.params;
  
  try {
    const result = await checkMinecraftAccount(username);
    if (!result.exists || !result.textures?.skin?.url) {
      return res.status(404).json({ error: 'No skin found' });
    }
    
    const imgRes = await axios.get(result.textures.skin.url, {
      responseType: 'arraybuffer',
      timeout: TIMEOUT
    });
    
    res.set('Content-Type', imgRes.headers['content-type'] || 'image/png');
    res.send(imgRes.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch skin' });
  }
});

app.get('/api/check/:username', async (req, res) => {
  const { username } = req.params;
  
  if (!username || username.length < 1 || username.length > 16) {
    return res.status(400).json({ 
      error: 'Invalid username',
      message: 'Username must be between 1 and 16 characters'
    });
  }
  
  try {
    const result = await checkMinecraftAccount(username);
    
    if (!result || !result.exists) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        username: username,
        message: 'This Minecraft account does not exist'
      });
    }
    
    res.json({
      success: true,
      data: result,
      checkedAt: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

app.get('/api/info', (req, res) => {
  res.json({
    name: 'Minecraft Checker API',
    version: '1.0.0',
    author: 'Rikixz',
    endpoints: {
      check: '/api/check/:username',
      info: '/api/info',
      docs: '/api/docs'
    },
    example: {
      url: '/api/check/Obama_Snadwitch',
      response: {
        uuid: '6fa0b728-0989-4b91-9576-845aaca97222',
        username: 'Obama_Snadwitch',
        textures: {
          custom: true,
          slim: false
        }
      }
    }
  });
});

app.get('/api/docs', (req, res) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  res.json({
    title: 'Minecraft Checker API Documentation',
    author: 'Rikixz',
    version: '1.0.0',
    baseUrl: baseUrl,
    docsUrl: `${baseUrl}/docs`,
    endpoints: [
      {
        method: 'GET',
        path: '/api/check/:username',
        description: 'Check Minecraft account information',
        parameters: [
          { name: 'username', type: 'string', required: true, description: 'Minecraft username' }
        ],
        example: {
          request: `${baseUrl}/api/check/Obama_Snadwitch`,
          response: {
            success: true,
            data: {
              uuid: '6fa0b728-0989-4b91-9576-845aaca97222',
              username: 'Obama_Snadwitch',
              username_history: [{ username: 'Obama_Snadwitch' }],
              textures: { custom: true, slim: false }
            },
            checkedAt: '2024-01-01T00:00:00.000Z'
          }
        }
      },
      {
        method: 'GET',
        path: '/api/skin/:username',
        description: 'Download player skin image directly'
      },
      {
        method: 'GET',
        path: '/api/info',
        description: 'API information'
      },
      {
        method: 'GET',
        path: '/api/docs',
        description: 'Full API documentation JSON'
      },
      {
        method: 'GET',
        path: '/api',
        description: 'Complete API info with templates'
      }
    ],
    templates: {
      telegram: `${baseUrl}/templates/telegram-bot.js`,
      discord: `${baseUrl}/templates/discord-bot.js`,
      postman: `${baseUrl}/api/postman`,
      docs: `${baseUrl}/docs`
    }
  });
});

app.get('/api', (req, res) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  res.json({
    name: 'Minecraft Checker API',
    version: '1.0.0',
    author: 'Rikixz',
    baseUrl: baseUrl,
    website: baseUrl,
    docs: {
      html: `${baseUrl}/docs`,
      json: `${baseUrl}/api/docs`
    },
    endpoints: {
      check: { method: 'GET', path: '/api/check/:username', description: 'Check Minecraft account' },
      skin: { method: 'GET', path: '/api/skin/:username', description: 'Download skin image' },
      info: { method: 'GET', path: '/api/info', description: 'API info' },
      docs: { method: 'GET', path: '/api/docs', description: 'Documentation JSON' },
      api: { method: 'GET', path: '/api', description: 'This endpoint' },
      postman: { method: 'GET', path: '/api/postman', description: 'Postman collection' }
    },
    templates: {
      javascript: `${baseUrl}/templates/discord-bot.js`,
      telegram: `${baseUrl}/templates/telegram-bot.js`,
      python: `${baseUrl}/templates/discord.py`,
      php: `${baseUrl}/templates/php.php`,
      bash: `${baseUrl}/templates/bash.sh`,
      site: `${baseUrl}/templates/site.html`
    },
    examples: {
      javascript: `fetch('${baseUrl}/api/check/Obama_Snadwitch').then(r=>r.json()).then(console.log)`,
      curl: `curl ${baseUrl}/api/check/Obama_Snadwitch`
    },
    rateLimit: {
      requests: 100,
      window: '15 minutes'
    }
  });
});

app.get('/api/postman', (req, res) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  res.json({
    info: {
      name: 'Minecraft Checker API',
      description: 'Minecraft Account Checker by Rikixz',
      schema: 'https://schema.getpostman.com/json/collections/v2.1.0/collection.json'
    },
    variable: [{ key: 'baseUrl', value: baseUrl }],
    item: [{
      name: 'Check Account',
      request: {
        method: 'GET',
        header: [{ key: 'Content-Type', value: 'application/json' }],
        url: {
          raw: '{{baseUrl}}/api/check/{{username}}',
          host: ['{{baseUrl}}'],
          path: ['api', 'check', '{{username}}']
        }
      }
    }]
  });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/docs', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'docs.html'));
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found', message: 'Endpoint not found' });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

app.listen(PORT, HOST, () => {
  console.log(`╔═══════════════════════════════════════╗`);
  console.log(`║   Minecraft Checker API by Rikixz     ║`);
  console.log(`║   Server running on ${HOST}:${PORT}        ║`);
  console.log(`║   API Docs: http://localhost:${PORT}/api/docs ║`);
  console.log(`╚═══════════════════════════════════════╝`);
});

module.exports = app;