import discord
import aiohttp
import os

API_URL = os.getenv('API_URL', 'http://localhost:3000')

intents = discord.Intents.default()
intents.message_content = True

client = discord.Client(intents=intents)

async def check_player(username: str) -> dict:
    async with aiohttp.ClientSession() as session:
        async with session.get(f'{API_URL}/api/check/{username}') as resp:
            if resp.status == 200:
                return await resp.json()
            else:
                return {'error': f'HTTP {resp.status}', 'message': await resp.text()}

@client.event
async def on_ready():
    print(f'Logged in as {client.user}')

@client.event
async def on_message(message):
    if message.author == client.user:
        return

    if message.content.startswith('!check '):
        username = message.content[7:].strip()
        if not username:
            await message.reply('Usage: !check <username>')
            return

        await message.reply(f'Checking player: {username}...')

        result = await check_player(username)

        if 'error' in result:
            await message.reply(f'Error: {result["error"]}')
        else:
            embed = discord.Embed(title=f'Player: {username}', color=0x00ff00)
            for key, value in result.items():
                embed.add_field(name=key, value=str(value), inline=True)
            await message.reply(embed=embed)

if __name__ == '__main__':
    token = os.getenv('DISCORD_BOT_TOKEN')
    if not token:
        print('Error: DISCORD_BOT_TOKEN environment variable not set')
        exit(1)
    client.run(token)