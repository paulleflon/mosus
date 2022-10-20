import { ChatInputCommandInteraction, EmbedBuilder, Guild, SlashCommandNumberOption, SlashCommandRoleOption } from 'discord.js';
import Client from '../base/Client';
import Command from '../base/Command';
import { getSusScore } from '../lib/endGame';
import { formatMessage, LocalizedSlashCommandBuilder } from '../lib/i18n';
import SavedGuild from '../types/SavedGuild';

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

	public async execute(interaction: ChatInputCommandInteraction, guild: Guild, save: SavedGuild): Promise<void> {
		let page = interaction.options.getNumber('page', false) || 1;
		const [[rows]] = await this.client.db.query('SELECT COUNT(*) FROM Games WHERE guild = ?', [guild.id]) as any[];
		const count = rows['COUNT(*)'];
		const pages = Math.ceil(count / 10);
		if (page > pages)
			page = 1;
		const query = 'SELECT id, word, status FROM Games WHERE guild = ? AND status = \'ended\' OR  status = \'cancelled\' ORDER BY id DESC ';
		const limit = `LIMIT ${(page - 1) * 10}, 10`;
		const [games] = count === 0 ? [] : await this.client.db.query(query + limit, [guild.id]) as any[];

		let description = count === 0 ? formatMessage('games.embed.noGame', save.language) : '';
		for (const { id, word } of games) {
			description += formatMessage('games.embed.descriptionRow', save.language, { id, word }) + '\n';
		}
		const embed = new EmbedBuilder()
			.setTitle(formatMessage('games.embed.title', save.language, { guild: guild.name }))
			.setDescription(description)
			.setColor('#2F3136')
			.setFooter({ text: formatMessage('games.embed.footer', save.language, { pages, page }) });
		interaction.reply({ embeds: [embed] });
	}
}