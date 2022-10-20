import { ChatInputCommandInteraction, EmbedBuilder, Guild } from 'discord.js';
import Client from '../base/Client';
import Command from '../base/Command';
import { formatMessage, LocalizedSlashCommandBuilder } from '../lib/i18n';
import SavedGuild from '../types/SavedGuild';

const data = new LocalizedSlashCommandBuilder('scoreboard')
	.setDMPermission(false);
export default class extends Command {
	constructor(client: Client) {
		super(client, 'scoreboard', false, data.toJSON());
	}

	public async execute(interaction: ChatInputCommandInteraction, guild: Guild, save: SavedGuild) {
		const scores = await this.client.db.getScores(save.id);
		if (Object.keys(scores).length === 0)
			return void interaction.reply({
				ephemeral: true,
				content: formatMessage('ephemeral.noScores', save.language)
			});
		let entries = Object.entries(scores);
		entries.sort((a, b) => b[1] - a[1]);
		let scoreString = '';
		let rank = 1;
		for (const [id, score] of entries) {
			scoreString += `${formatMessage('scoreboard.row', save.language, {
				rank: rank++,
				user: `<@${id}>`,
				points: score
			})}\n`;
		}
		const embed = new EmbedBuilder()
			.setTitle(formatMessage('scoreboard.title', save.language))
			.setColor('#2F3136')
			.setDescription(scoreString);
		interaction.reply({ embeds: [embed] });
	}
}