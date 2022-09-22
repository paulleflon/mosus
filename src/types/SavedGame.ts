import { Snowflake } from 'discord.js';
/**
 * Data of a mosus Game as saved in database.
 */
export default interface SavedGame {
	/**
	 * The Discord id of the channel in which the announcements are made for the game.
	 */
	channel: Snowflake;
	/**
	 * The Discord id of the guild in which this game takes places.
	 */
	guild: Snowflake;
	/**
	 * The Discord id of the user who started the game.
	 */
	host: Snowflake;
	/* 
	 * The id of the game.
	 */
	id: number;
	/**
	 * The link to the message the sus has first placed the word, if they have.
	 */
	link?: string;
	malus: boolean;
	/**
	 * The status of the game, pretty self-explanatory.
	 */
	status: 'playing' | 'voting' | 'ended' | 'cancelled';
	/**
	 * The Discord id of the user who has to place a word.
	 */
	sus: Snowflake;
	/**
	 * The word that has to be placed.
	 */
	word: string;
}