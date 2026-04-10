const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

async function checkMinecraftAccount(username) {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/check/${username}`);
    return response.data;
  } catch (error) {
    return { success: false, error: error.message };
  }
}

module.exports = (bot) => {
  bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const username = msg.text;

    if (!username || username.startsWith('/')) return;

    bot.sendMessage(chatId, `🔍 Checking: ${username}...`);

    const result = await checkMinecraftAccount(username);

    if (result.success) {
      const player = result.data;
      const message = `✅ *Account Found!*

╔ Username: ${player.username}
║ UUID: \`${player.uuid}\`
║ Custom Skin: ${player.textures?.custom ? 'Yes' : 'No'}
║ Skin Type: ${player.textures?.slim ? 'Slim' : 'Classic'}
╚ History: ${player.username_history?.length || 1} name(s)`;

      bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    } else {
      bot.sendMessage(chatId, `❌ Account not found: ${username}`);
    }
  });
};

module.exports.checkMinecraftAccount = checkMinecraftAccount;