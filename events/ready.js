const fs = require('fs');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');

const refreshCommands = async (client) => {
    try {
          const commands = [];
          const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
  
          for (const file of commandFiles) {
              const command = require(`../commands/${file}`);
              commands.push(command.data.toJSON());
          }
  
          const rest = new REST({ version: '9' }).setToken(process.env.DISCORD_TOKEN);
  
          client.log(`[Discord]: Started refreshing application <${client.user.id}> (/) commands.`);
  
          await rest.put(
              Routes.applicationCommands(client.user.id),
              { body: commands },
          );
  
          client.log('[Discord]: Successfully reloaded application (/) commands.');
    } catch (error) {
          client.error(error);
    }
}

module.exports = {
	name: 'ready',
	once: true,
	execute(args) {
        const [ client ] = args;
        client.log(`[Discord]: Logged in as <${client.user.id}> ${client.user.tag}`);

        if(client.config.refreshCommands)
            refreshCommands(client)
	},
};
