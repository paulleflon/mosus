import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandNumberOption, SlashCommandRoleOption } from 'discord.js';
import Client from '../base/Client';
import Command from '../base/Command';
import { getSusScore } from '../lib/endGame';
import { formatMessage, LocalizedSlashCommandBuilder } from '../lib/i18n';

const data = new LocalizedSlashCommandBuilder('games')
	.setDMPermission(false)
	.addLocalizedOption(
		'page',
		new SlashCommandNumberOption()
			.setMinValue(1)
	);
export default class extends Command {
	constructor(client: Client) {
		super(client, 'games', false, data.toJSON());
	}

	public async execute(interaction: ChatInputCommandInteraction): Promise<void> {
		const page = interaction.options.getNumber('page', true);
		const guild = interaction.guild!;
		const save = (await this.client.db.getGuild(guild.id))!;
		const [[count]] = await this.client.db.query('SELECT COUNT(*) FROM Games WHERE guild = ?', [guild.id]) as any[];
		const pages = Math.ceil(count / 10);
		const [games] = pages === 0 ? [] : await this.client.db.query('SELECT id, word FROM Games WHERE guild = ?', [guild.id]) as any[];
		let description = pages === 0 ? formatMessage('games.embed.noGame', save.language) : '';
		for (const [id, word] of games) {
			description += formatMessage('games.embed.descriptionRow', save.language, { id, word });
		}
		const embed = new EmbedBuilder()
			.setTitle(formatMessage('games.embed.title', save.language, { guild: guild.name }))
			.setDescription(description)
			.setFooter({ text: formatMessage('games.embed.footer', save.language, { count, page: page.toString() }) });
		interaction.reply({ embeds: [embed] });
	}
}