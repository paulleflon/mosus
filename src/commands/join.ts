import { ChatInputCommandInteraction, Guild, SlashCommandRoleOption, GuildMember } from 'discord.js';
import Client from '../base/Client';
import Command from '../base/Command';
import { formatMessage, LocalizedSlashCommandBuilder } from '../lib/i18n';
import SavedGuild from '../types/SavedGuild';

const data = new LocalizedSlashCommandBuilder('join');
export default class extends Command {
	constructor(client: Client) {
		super(client, 'join', true, data.toJSON());
	}
public async execute(interaction: ChatInputCommandInteraction, guild: Guild, save: SavedGuild): Promise<void> {
		const role = save.role!;
		const member = interaction.member! as GuildMember;
		await member.fetch();
		if (member.roles.cache.has(role))
			return void interaction.reply({ content: formatMessage('ephemeral.alreadyHasRole', interaction.locale), ephemeral: true });
		try {
			await member.roles.add(role);
		} catch (_) {
			return void interaction.reply({ content: formatMessage('ephemeral.couldntGiveRole', interaction.locale), ephemeral: true });
		}
		interaction.reply({ content: formatMessage('ephemeral.addedRole', interaction.locale, {role: `<@&${role}>`}), ephemeral: true});
	}
}

