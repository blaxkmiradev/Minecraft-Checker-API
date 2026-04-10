# Minecraft Checker API

Minecraft account checker web service by Rikixz.

## Features

- Check Minecraft account info by username
- Clean white design
- Hidden real IP (proxy support)
- Built with Express.js
- REST API with endpoints
- Telegram & Discord bot templates
- Postman collection support

## Quick Start

```bash
npm install
npm start
```

Server runs at `http://localhost:3000`

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/check/:username` | Check account |
| GET | `/api/info` | API info |
| GET | `/api/docs` | Documentation |
| GET | `/api/postman` | Postman collection |

## Environment Variables

Edit `.env`:

```
# API Configuration by Rikixz
# Server Configuration
PORT=3000
HOST=0.0.0.0

# Hide real IP - Enable proxy
HIDE_IP=true

# API Settings
API_BASE_URL=https://api.ashcon.app/mojang/v2/user/
DEFAULT_TIMEOUT=10000

# CORS Settings (comma separated origins or * for all)
CORS_ORIGIN=*

# Rate Limiting
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Templates

- `templates/telegram-bot.js` - Telegram bot
- `templates/discord-bot.js` - Discord bot

## License

MIT
