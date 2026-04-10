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
PORT=3000
HIDE_IP=true
CORS_ORIGIN=*
```

## Templates

- `templates/telegram-bot.js` - Telegram bot
- `templates/discord-bot.js` - Discord bot

## License

MIT