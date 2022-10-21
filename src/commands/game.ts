import { ChatInputCommandInteraction, EmbedBuilder, Guild, SlashCommandNumberOption, SlashCommandRoleOption } from 'discord.js';
import Client from '../base/Client';
import Command from '../base/Command';
import { getSusScore } from '../lib/endGame';
import { formatMessage, LocalizedSlashCommandBuilder } from '../lib/i18n';
import SavedGuild from '../types/SavedGuild';

const data = new LocalizedSlashCommandBuilder('game')
	.addLocalizedOption(
		'game',
		new SlashCommandNumberOption()
			.setMinValue(0)
			.setRequired(true)
	);
export default class extends Command {
	constructor(client: Client) {
		super(client, 'game', false, data.toJSON());
	}

	public async execute(interaction: ChatInputCommandInteraction, guild: Guild, save: SavedGuild): Promise<void> {
		const id = interaction.options.getNumber('game', true);
		const game = await this.client.db.getGame(id);
		const { language } = save;
		if (!game)
			return void interaction.reply({
				content: formatMessage('ephemeral.unknownGame', interaction.locale),
				ephemeral: true
			});
		if (game.guild !== guild.id)
			return void interaction.reply({
				content: formatMessage('ephemeral.forbiddenGame', interaction.locale),
				ephemeral: true
			})
		if (!['cancelled', 'ended'].includes(game.status))
			return void interaction.reply({
				content: formatMessage('ephemeral.gameNotFinished', interaction.locale),
				ephemeral: true
			});

		const votes = await this.client.db.getVotes(game.id);
		let description = formatMessage('game.embed.descriptionTitle', language) + '\n';
		let w = 0;
		let l = 0;
		for (const [voter, { voted, word }] of Object.entries(votes)) {
			// As the point earnings per game are not stored, we have to recalculate them when getting the embed.
			// Thus, for the sus' earnings, we have to count again who caught them and who didn't for the getSusScore function.
			if (voter !== game.sus) {
				if (voted === game.sus) w++;
				else l++;
			}
			const earned = word && word.toLowerCase() === game.word ? 4 : voted === game.sus ? 2 : 0;
			const displayEarned = voter === game.sus ? '**(sus)**' : `**+${earned}**`;
			const displayWord = word ? `('${word}')` : '';
			description += `<@${voter}> -> <@${voted}> ${displayWord} ${displayEarned}\n`;
		}
		if (game.malus)
			l = 0;
		const susEarned = game.link ? getSusScore(w, l) : -8;
		const displaySusEarned = (susEarned >= 0 ? '+' : '') + susEarned.toString();
		// host and sus are fetched in order to get their avatars for the embed.
		let host;
		let sus;
		try {
			host = await this.client.users.fetch(game.host);
			sus = await this.client.users.fetch(game.sus);
		} catch (_) { /* This is fine. */ }
		const embed = new EmbedBuilder()
			.setAuthor(host ? {
				name: formatMessage('game.embed.host', language, { host: host.username }),
				iconURL: host.displayAvatarURL()
			} : null)
			.setThumbnail(sus ? sus.displayAvatarURL() : null)
			.setTitle(`${formatMessage('game.embed.title', language, { id: id.toString() })} ${game.status === 'cancelled' ? formatMessage('game.embed.cancelled', language) : ''}`)
			.setDescription(description)
			.addFields([
				{
					name: formatMessage('game.embed.sus', language),
					value: `<@${game.sus}> **${displaySusEarned}**`,
					inline: true
				},
				{
					name: formatMessage('game.embed.word', language),
					value: `**\`${game.word}\`**`,
					inline: true
				},
				{
					name: formatMessage('game.embed.placed', language),
					value: game.link ? formatMessage('game.embed.placedLocation', language, { link: game.link }) : formatMessage('game.embed.nowhere', language),
					inline: true
				}
			])
			.setColor('#2F3136');
		interaction.reply({
			embeds: [embed]
		});

	}
}