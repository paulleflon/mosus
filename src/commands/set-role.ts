import { ChatInputCommandInteraction, SlashCommandRoleOption } from 'discord.js';
import Client from '../base/Client';
import Command from '../base/Command';
import { formatMessage, LocalizedSlashCommandBuilder } from '../lib/i18n';

const data = new LocalizedSlashCommandBuilder('set-role')
	.setDMPermission(false)
	.addLocalizedOption(
		'role',
		new SlashCommandRoleOption()
			.setRequired(true)
	);
export default class extends Command {
	constructor(client: Client) {
		super(client, 'set-role', false, data.toJSON());
	}

	public execute(interaction: ChatInputCommandInteraction): void {
		// Only members with the `Manage Messages` permission can change the mosus settings in a guild.
		if (!interaction.memberPermissions || !interaction.memberPermissions.has('ManageMessages'))
			return void interaction.reply({ content: formatMessage('ephemeral.missingPermission', 'fr'), ephemeral: true });
		const role = interaction.options.getRole('role', true);
		this.client.db.setGuildRole(interaction.guild!.id, role.id);
		interaction.reply({
			content: formatMessage('ephemeral.roleSet', interaction.locale, { role: `${role}` }),
			ephemeral: true
		});
	}
}