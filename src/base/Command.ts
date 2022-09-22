import { RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v10';
import { CommandInteraction } from 'discord.js';
import Client from './Client';
import Logger from './Logger';

/**
 * Holds data about a Slash Command and its Interaction response.
 */
export default abstract class Command {
	/**
	 * The client instanciating the command.
	 */
	client: Client;
	/**
	 * The name of the command.
	 */
	name: string;
	/**
	 * Whether this command requires a mosus role to be set in the Guild in order to be executed.
	 */
	requiresRole: boolean;
	/**
	 * The raw data of the command for the Discord API.
	 */
	data: RESTPostAPIApplicationCommandsJSONBody;
	/**
	 * Logger for any log message related to this command.
	 */
	log: Logger;
	constructor(client: Client, name: string, requiresRole: boolean, data: RESTPostAPIApplicationCommandsJSONBody) {
		this.client = client;
		this.name = name;
		this.data = data;
		this.requiresRole = requiresRole;
		this.log = new Logger(name);
	}
	/**
	 * The function to execute when the command is used.
	 * @param interaction The interaction that triggered the command.
	 */
	public abstract execute(interaction: CommandInteraction): void;
}