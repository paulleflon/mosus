import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandNumberOption, SlashCommandRoleOption } from 'discord.js';
import Client from '../base/Client';
import Command from '../base/Command';
import { getSusScore } from '../lib/endGame';
import { formatMessage, LocalizedSlashCommandBuilder } from '../lib/i18n';

const data = new LocalizedSlashCommandBuilder('game')
	.setDMPermission(false)
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

	public async execute(interaction: ChatInputCommandInteraction): Promise<void> {
		const id = interaction.options.getNumber('game', true);
		const game = await this.client.db.getGame(id);
		const guild = interaction.guild!;
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
		let description = '**Votes**\n';
		let w = 0;
		let l = 0;
		for (const [voter, { voted, word }] of Object.entries(votes)) {
			// As the point earnings per game are not stored, we have to recalculate them when getting the embed.
			// Thus, for the sus' earnings, we have to count again who caught them and who didn't for the getSusScore function.
			if (voted === game.sus) w++;
			else l++;
			const earned = word && word.toLowerCase() === game.word ? 4 : voted === game.sus ? 2 : 0;
			const displayEarned = voter === game.sus ? '**(sus)**' : `**+${earned}**`;
			const displayWord = word ? `('${word}')` : '';
			description += `<@${voter}> -> <@${voted}> ${displayWord} ${displayEarned}\n`;
		}
		const susEarned = getSusScore(w, l);
		const displaySusEarned = (susEarned >= 0 ? '+' : '') + susEarned.toString();
		// host and sus are fetched in order to get their avatars for the embed.
		const host = await guild.members.fetch(game.host);
		const sus = await guild.members.fetch(game.sus);
		const embed = new EmbedBuilder()
			.setAuthor(host ? {
				name: `Hosted by ${host.user.username}`,
				iconURL: host.displayAvatarURL()
			} : null)
			.setThumbnail(sus ? sus.displayAvatarURL() : null)
			.setTitle(`Game #${game.id} ${game.status === 'cancelled' ? '[CANCELLED]' : ''}`)
			.setDescription(description)
			.addFields([
				{
					name: 'Sus',
					value: `<@${game.sus}> **${displaySusEarned}**`,
					inline: true
				},
				{
					name: 'Word',
					value: `**\`${game.word}\`**`,
					inline: true
				},
				{
					name: 'Placed',
					value: game.link ? `[here](${game.link})` : '*Nowhere*',
					inline: true
				}
			])
			.setColor('#2F3136');
		interaction.reply({
			embeds: [embed]
		});

	}
}