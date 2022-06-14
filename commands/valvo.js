const { SlashCommandBuilder } = require('@discordjs/builders');
const Config = require('../config');
const { PermissionFlagsBits } = require('discord-api-types/v10');

const categories = Config.discCategories.map(c => { return { name: c.name, value: c.id } });

const commandConfig = {
  command: "valvo",
  commandAlts: [],
  description: "Lisää kategoria valvottujen listaan.",
  help: "valvo :kategoria* :kanava*",
}

module.exports = {
    commandConfig,
	data: new SlashCommandBuilder()
        .setName(commandConfig.command)
        .setDescription(commandConfig.description)
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        .addStringOption(option =>
            option.setName('kategoria')
                .setDescription('Kiekko kategoria')
                .setRequired(true)
                .addChoices(...categories)
            )
        .addChannelOption(option => 
            option.setName('kanava')
                .setDescription('Valitse kanava ilmoituksille')
                .setRequired(true)
            )
    ,async execute(client, interaction) {

        await interaction.deferReply();
        const category = interaction.options.get("kategoria");
        const channel = interaction.options.get("kanava"); 
        const user = (interaction.options.getUser('target'))? interaction.options.getUser('target') : interaction.user;


        try {

            const _category = await client.config.discCategories.find(c => c.id === category.value);

            if(channel.channel.type !== "GUILD_TEXT")
                return await interaction.editReply("Virhe: Kategorian valinta epäonnistui", { ephemeral: true });

            if(!_category)
                return await interaction.editReply("Virhe: Kategorian valinta epäonnistui", { ephemeral: true });

            const toggled = await client.db.toggleSubscriptionToCategory({
                channel: {
                    id: channel.channel.id,
                    name: channel.channel.name,
                    guild: {
                        id: channel.channel.guild.id,
                        name: channel.channel.guild.name,
                        owner: channel.channel.guild.ownerId,
                    }
                }, category: _category.id, user: { username: user.username, tag: user.tag, id: user.id }
            })

            const replyMessage = (toggled)?
                `Ilmoitetaan nyt uusista havainnoista kategoriassa **${_category.name}** kanavaan **${channel.name}**` : 
                `Ilmoitukset havainnoista kategoriassa **${_category.name}** on nyt poistettu käytöstä kanavassa **${channel.name}**`

            return await interaction.editReply(replyMessage);
        }catch(ex){
            client.error(ex.message)
            return await interaction.editReply("Tapahtui odottamaton virhe");
        }
	},
};
