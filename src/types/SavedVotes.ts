import { Snowflake } from 'discord.js';

/**
 * A vote in a mosus game as saved in database.
 */
export default interface SavedVote {
	/**
	 * The id of the game this vote belongs to.
	 */
	game: number;
	/**
	 * The Discord id of the user sending this vote.
	 */
	voter: Snowflake;
	/**
	 * The Discord if of the user targetted by this vote.
	 */
	voted: Snowflake;
	/**
	 * The suspected word for this vote.
	 */
	word?: string;
}
/**
 * The Record containing all the votes of a Game, mapped by voter id.
 */
export type GameVotes = Record<Snowflake, SavedVote>;
/**
 * The Map containing all cached GameVotes, mapped by game id.
 */
export type CachedVotes = Map<number, GameVotes>;