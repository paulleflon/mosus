import { Interaction } from 'discord.js';
import Client from '../base/Client';
import Event from '../base/Event';
import { formatMessage } from '../lib/i18n';

export default class extends Event {
	constructor(client: Client) {
		super(client, 'interactionCreate');
	}

	async execute(interaction: Interaction) {
		// If for one reason or another, the guild was not sucessfully registered in database earlier
		// (as it should be done in the guildCreate event handler), we make sure it is done before any action
		// is performed.
		if (interaction.guild && !(await this.client.db.getGuild(interaction.guild.id))) {
			this.log.warn('Guild', interaction.guild, 'was not registered in the database.');
			await this.client.db.addGuild(interaction.guild.id);
		}
		// So far, the bot only uses Chat Input commands.
		if (!interaction.isChatInputCommand()) {
			this.log.warn(
				'Received an non Chat Input interaction',
				`(ID: ${interaction.id}, T: ${interaction.type} U: ${interaction.user})`
			);
			return;
		}

		const command = this.client.commands.get(interaction.commandName);
		// This could happen if the command was deleted from the bot but was still
		// persisting in the Discord UI.
		if (!command) {
			this.log.error(
				'Received an unsupported chat command:',
				interaction.commandName,
				`(ID: ${interaction.id}; G: ${interaction.guild?.id}; U: ${interaction.user.id})`
			);
			return void interaction.reply({ content: 'An error occured.', ephemeral: true });
		}
		// Most of the commands require the player role to be set. 
		// We take care of checking if it is defined and still exists in Discord here
		// instead of doing it in each command.
		if (command.requiresRole && interaction.guild) {
			// Checking if the role is set in the database.
			const guild = await this.client.db.getGuild(interaction.guild?.id);
			if (!guild?.role)
				return void interaction.reply({
					content: formatMessage('ephemeral.missingRole', interaction.locale),
					ephemeral: true
				});
			// Checking if the role still exists in Discord.
			const role = await interaction.guild.roles.fetch(guild.role);
			if (!role)
				return void interaction.reply({
					content: formatMessage('ephemeral.deletedRole', interaction.locale),
					ephemeral: true
				});
		}
		command.execute(interaction);
	}
}