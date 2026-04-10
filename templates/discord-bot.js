const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const axios = require('axios');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const PREFIX = process.env.PREFIX || '!';

async function checkMinecraftAccount(username) {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/check/${username}`);
    return response.data;
  } catch (error) {
    return { success: false, error: error.message };
  }
}

client.on('messageCreate', async (message) => {
  if (!message.content.startsWith(PREFIX) || message.author.bot) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === 'check' || command === 'mc') {
    const username = args[0];
    if (!username) {
      message.reply('Usage: `!check <username>`');
      return;
    }

    const loadingMsg = await message.reply('🔍 Checking...');

    const result = await checkMinecraftAccount(username);

    if (result.success) {
      const player = result.data;
      const embed = new EmbedBuilder()
        .setColor(0x00d97e)
        .setTitle(`✅ ${player.username}`)
        .setDescription('Account Found')
        .addFields(
          { name: 'UUID', value: `\`${player.uuid}\``, inline: true },
          { name: 'Custom Skin', value: player.textures?.custom ? 'Yes' : 'No', inline: true },
          { name: 'Skin Type', value: player.textures?.slim ? 'Slim' : 'Classic', inline: true },
          { name: 'Name History', value: `${player.username_history?.length || 1} name(s)`, inline: true }
        )
        .setTimestamp();

      if (player.textures?.skin?.url) {
        embed.setThumbnail(player.textures.skin.url);
      }

      loadingMsg.edit({ content: null, embeds: [embed] });
    } else {
      loadingMsg.edit(`❌ Account not found: ${username}`);
    }
  }

  if (command === 'help') {
    const embed = new EmbedBuilder()
      .setColor(0x1a1a1a)
      .setTitle('Minecraft Checker Commands')
      .addFields(
        { name: '!check <username>', value: 'Check Minecraft account' },
        { name: '!mc <username>', value: 'Alias for check' },
        { name: '!help', value: 'Show this help' }
      );
    message.reply({ embeds: [embed] });
  }
});

client.on('ready', () => {
  console.log(`🤖 Discord bot logged in as ${client.user.tag}`);
});

if (DISCORD_TOKEN) {
  client.login(DISCORD_TOKEN);
}

module.exports = { client, checkMinecraftAccount };