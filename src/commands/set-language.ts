import { ChatInputCommandInteraction, Guild, SlashCommandRoleOption, SlashCommandStringOption } from 'discord.js';
import Client from '../base/Client';
import Command from '../base/Command';
import { formatMessage, LocalizedSlashCommandBuilder } from '../lib/i18n';
import { AvailableLanguage } from '../types/AvailableLanguages';
import SavedGuild from '../types/SavedGuild';

const data = new LocalizedSlashCommandBuilder('set-language')
	.setDMPermission(false)
	.addLocalizedOption(
		'language',
		new SlashCommandStringOption()
			.addChoices(
				{ name: '🇫🇷 Français', value: 'fr' },
				{ name: '🇬🇧 English', value: 'en' },
				{ name: '🇰🇷 한국어', value: 'ko' }
			)
			.setRequired(true)
	);
export default class extends Command {
	constructor(client: Client) {
		super(client, 'set-language', false, data.toJSON());
	}

	public async execute(interaction: ChatInputCommandInteraction, guild: Guild, save: SavedGuild) {
		// Only members with the `Manage Messages` permission can change the mosus settings in a guild.
		if (!interaction.memberPermissions || !interaction.memberPermissions.has('ManageMessages'))
			return void interaction.reply({ content: formatMessage('ephemeral.missingPermission', save.language), ephemeral: true });
		const selectedLanguage = interaction.options.getString('language', true) as AvailableLanguage;
		this.client.db.setGuildLang(guild.id, selectedLanguage);
		interaction.reply({
			content: formatMessage('ephemeral.langSet', selectedLanguage),
			ephemeral: true
		});
	}
}