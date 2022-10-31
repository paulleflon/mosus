import { ChatInputCommandInteraction, Guild, SlashCommandRoleOption, Role } from 'discord.js';
import Client from '../base/Client';
import Command from '../base/Command';
import { formatMessage, LocalizedSlashCommandBuilder } from '../lib/i18n';
import SavedGuild from '../types/SavedGuild';

const data = new LocalizedSlashCommandBuilder('set-role')
	.addLocalizedOption(
		'role',
		new SlashCommandRoleOption()
			.setRequired(true)
	);
export default class extends Command {
	constructor(client: Client) {
		super(client, 'set-role', false, data.toJSON());
	}

	public execute(interaction: ChatInputCommandInteraction, guild: Guild, save: SavedGuild): void {
		// Only members with the `Manage Messages` permission can change the mosus settings in a guild.
		if (!interaction.memberPermissions || !interaction.memberPermissions.has('ManageMessages'))
			return void interaction.reply({ content: formatMessage('ephemeral.missingPermission', interaction.locale), ephemeral: true });
		const role = interaction.options.getRole('role', true) as Role;
		if (!role.editable)
			return void interaction.reply({ content: formatMessage('ephemeral.cantEditRole', interaction.locale), ephemeral: true });
		this.client.db.setGuildRole(guild.id, role.id);
		interaction.reply({
			content: formatMessage('ephemeral.roleSet', interaction.locale, { role }),
			ephemeral: true
		});
	}
}
