import { Snowflake, TextChannel } from 'discord.js';
import Client from '../base/Client';
import SavedGame from '../types/SavedGame';
import SavedGuild from '../types/SavedGuild';
import { GameVotes } from '../types/SavedVotes';
import { formatMessage } from './i18n';

/**
 * Calculates the sus' earned points for a game.
 * @param w The number of players who caught the sus.
 * @param l The number of players who didn't catch the sus.
 * @returns The amounf of points the sus will earn.
 */
export function getSusScore(w: number, l: number): number {
	if (w === l)
		return 0;
	const maxValue = 5;
	// This represents the winrate of the sus
	const ratio = l/(l+w);
	// Returns a value between -maxValue and +maxValue based on the winrate quotient
	return Math.round((maxValue*2)*ratio)-maxValue;
}

/**
 * Ends a mosus game, attributing new scores and announcing it.
 * @param client The client handling the game.
 * @param guild The saved data about the guild in which the game takes place.
 * @param game The game's save.
 * @param votes The votes of the game.
 * @param channel The channel in which the announcements are done.
 */
export default async function endGame(client: Client, guild: SavedGuild, game: SavedGame, votes: GameVotes, channel: TextChannel): Promise<void> {
	let w = 0; // Number of winners (who caught the sus)
	let l = 0; // Number of losers (who didn't catch the sus)
	const earnings: Record<Snowflake, number> = {}; // Points earned by every player in this game

	// The sus didn't place so they earn a great -8 points while every other player earns 1 point.
	if (!game.link) {
		for (const voter of Object.keys(votes)) {
			earnings[voter] = 1;
			await client.db.incrementScore(guild.id, voter, 1);
		}
		earnings[game.sus] = -8; // BOOM
	} else {
		for (const vote of Object.values(votes)) {
			// The sus' vote is only done to fool the other players but is not to be used anywhere.
			if (vote.voter === game.sus) continue;
			if (vote.voted === game.sus) {
				// If a user spots the sus, they earn 2 points.
				// If they also get what word had to be placed, they earn 4 points.
				let s = (vote.word && vote.word.toLowerCase() === game.word)
					? 4
					: 2;
				w++;
				earnings[vote.voter] = s;
				await client.db.incrementScore(guild.id, vote.voter, s);
			} else {
				// Player didn't catch the sus, they earn no point.
				l++;
				earnings[vote.voter] = 0;
			}
		}
		if (game.malus)
			// Malus activated, the sus isn't allowed to earn any point from this game.
			// Best case scenario: They get 0 because nobody caught it during the voting phase.
			// Else, they just get -5.
			earnings[game.sus] = getSusScore(w, 0);
		else
			earnings[game.sus] = getSusScore(w, l);
	}
	await client.db.incrementScore(game.guild, game.sus, earnings[game.sus]);
	await client.db.setGameStatus(game.id, 'ended');
	await client.db.setGuildGame(guild.id, null);
	// Points earnings sorted in decreasing order.
	let entries = Object.entries(earnings);
	entries.sort((a, b) => b[1] - a[1]);
	let earningsMessage = '';
	for (const [id, amount] of entries) {
		earningsMessage += formatMessage('announcements.pointsEarned', guild.language, {
			mention: `<@${id}>`,
			amount
		}) + '\n';
	}
	await channel.send(formatMessage('announcements.voteEnd', guild.language, { mention: `<@&${guild.role!}>` }));
	const revealType = !game.link ? 'notPlaced' : game.malus ? 'malus' : 'normal';
	await channel.send(formatMessage('announcements.reveal.' + revealType, guild.language, {
		sus: `<@${game.sus}>`,
		word: game.word,
		link: game.link || ''
	}));
	await channel.send(earningsMessage);
}
