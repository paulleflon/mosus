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
		const host = await guild.members.fetch(game.host);
		const sus = await guild.members.fetch(game.sus);
		let w = 0;
		let l = 0;
		let description = '**Votes**\n';
		for (const [voter, { voted, word }] of Object.entries(votes)) {
			if (voted === game.sus) w++;
			else l++;
			const earned = word && word.toLowerCase() === game.word ? 4 : voted === game.sus ? 2 : 0;
			const displayEarned = voter === game.sus ? '**(sus)**' : `**+${earned}**`;
			const displayWord = word ? `('${word}')` : '';
			description += `<@${voter}> -> <@${voted}> ${displayWord} ${displayEarned}\n`;
		}
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
					value: `<@${game.sus}>`,
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
			]);
		interaction.reply({
			embeds: [embed]
		});

	}
}