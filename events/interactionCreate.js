module.exports = {
	name: 'interactionCreate',
	async execute(args) {
    const [client, interaction] = args;

    const user = (interaction.options.getUser('target'))? interaction.options.getUser('target') : interaction.user;

    if (!interaction.isCommand()) return;

  	const command = client.commands.get(interaction.commandName);

  	if (!command) return;

    client.log(`[Discord]: ${user.username}#${user.tag}[${user.id}] is executing command ${command.data.name}`)

  	try {
  		await command.execute(client, interaction);
  	} catch (error) {
  		client.error(error);
  		await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
  	}
	},
};
