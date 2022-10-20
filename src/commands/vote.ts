import { ChatInputCommandInteraction, Guild, SlashCommandStringOption, SlashCommandUserOption, TextChannel } from 'discord.js';
import Client from '../base/Client';
import Command from '../base/Command';
import endGame from '../lib/endGame';
import { formatMessage, LocalizedSlashCommandBuilder } from '../lib/i18n';
import SavedGuild from '../types/SavedGuild';
import SavedVote from '../types/SavedVotes';

const data = new LocalizedSlashCommandBuilder('vote')
	.setDMPermission(false)
	.addLocalizedOption(
		'sus',
		new SlashCommandUserOption()
			.setRequired(true)
	)
	.addLocalizedOption('word', new SlashCommandStringOption());
export default class extends Command {
	constructor(client: Client) {
		super(client, 'vote', false, data.toJSON());
	}

	public async execute(interaction: ChatInputCommandInteraction, guild: Guild, save: SavedGuild): Promise<void> {
		const game = await this.client.db.getGame(save.game || -1);
		if (!game)
			return void interaction.reply({
				content: formatMessage('ephemeral.notInGame', interaction.locale),
				ephemeral: true
			});
		if (game.status !== 'voting')
			return void interaction.reply({
				content: formatMessage('ephemeral.notInVote', interaction.locale),
				ephemeral: true
			});
		const votes = await this.client.db.getVotes(game.id);
		if (interaction.user.id in votes)
			return void interaction.reply({
				content: formatMessage('ephemeral.alreadyVoted', interaction.locale, { voted: `<@${votes[interaction.user.id].voted}>` }),
				ephemeral: true
			});
		await interaction.deferReply({ ephemeral: true });
		// No check is made about the validiy of the vote (e.g. voting yourself or a non-player).
		// If one wants to vote shit it's their issue not mine.
		const voted = interaction.options.getUser('sus', true);
		const word = interaction.options.getString('word') || undefined;
		const vote: SavedVote = {
			game: game.id,
			voter: interaction.user.id,
			voted: voted.id,
			word
		}
		await this.client.db.setVote(vote);
		// The interaction reply and the announcement are made separately to prevent revealing the vote;
		// When the bot directly replies to the interaction and it is not ephemeral,
		// The content of the command sent by the user is displayed to everyone.
		// We don't want players to be able to see the votes of other players.
		await interaction.editReply({
			content: formatMessage('ephemeral.voteRegistered', interaction.locale)
		});
		const voteCount = Object.keys(votes).length;
		// This fetch ensures that all members are counted.
		await guild.members.fetch();
		const playerCount = (await guild.roles.fetch(save.role!))!.members.size;
		const channel = (await guild.channels.fetch(game.channel) || interaction.channel!) as TextChannel;
		channel.send(
			formatMessage('announcements.voted', save.language,
				{
					mention: interaction.user,
					voteCount, 
					playerCount
				}
			)
		);

		if (voteCount === playerCount)
			endGame(this.client, save, game, votes, channel);
	}
}