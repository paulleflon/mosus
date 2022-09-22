import { Snowflake } from 'discord.js';
import { AvailableLanguage } from './AvailableLanguages';

/**
 * Mosus settings of a Guild as saved in database.
 */
export default interface SavedGuild {
	/**
	 * The Discord id of the guild.
	 */
	id: Snowflake;
	/**
	 * The id of the ongoing game in the guild, if any.
	 */
	game?: number;
	/**
	 * The preferred language in the guild.
	 */
	language: AvailableLanguage;
	/**
	 * The mosus player role in the guild, if set.
	 */
	role?: Snowflake;
}