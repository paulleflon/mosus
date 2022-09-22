import { Client as DJSClient, GatewayIntentBits, REST, RESTPostAPIApplicationCommandsJSONBody, Routes } from 'discord.js';
import fs from 'fs';
import Command from './Command';
import Database from './Database';
import Event from './Event';
import Logger from './Logger';

/**
 * Extended discord.js Client for mosus.
 */
export default class Client extends DJSClient {
	/** 
	 * The database connection. 
	 */
	db: Database;
	/** 
	 * The bot's Application id. 
	 */
	id: string;
	/** 
	 * The token of the bot. 
	 */
	#token: string;
	/** 
	 * The bot's slash commands, mapped by name. 
	 */
	commands: Map<string, Command>;
	/**
	 * Logger for any log message related to the Client.
	 */
	log: Logger;
	/**
	 * @param db A database connection.
	 * @param id The bot's application id.
	 * @param token The token of the bot.
	 */
	constructor(db: Database, id: string, token: string) {
		super({
			intents: [
				// We need this to identify all mosus players in each guild
				GatewayIntentBits.Guilds,
				GatewayIntentBits.GuildMembers,
				// We need this to detect when a sus player placed their word
				GatewayIntentBits.GuildMessages,
				GatewayIntentBits.MessageContent
			]
		});
		this.db = db;
		this.id = id;
		this.#token = token;
		this.commands = new Map();
		this.log = new Logger('Client');
	}

	/**
	 * Registers the Slash commands against Discord API. Makes sure to delete all the previously registered commands.
	 */
	async registerSlashCommands() {
		const files = fs.readdirSync('./build/commands');
		const rest = new REST({ version: '10' }).setToken(this.#token);
		const commands: RESTPostAPIApplicationCommandsJSONBody[] = [];
		for (const file of files) {
			if (!file.endsWith('.js')) // (Code is compiled to JS so when this is executed, command files are JS files.)
				continue;
			const construct = require(`../commands/${file}`).default;
			const command = new construct(this) as Command;
			commands.push(command.data);
		}
		// We delete all commands before registering commands again, so that
		// The commands displayed in Discord are always consistent with the 
		// commands that the bot actually supports.
		await rest.put(Routes.applicationCommands(this.id), { body: [] });
		await rest.put(Routes.applicationCommands(this.id), { body: commands });
		this.log.info('Registered', commands.length, 'commands');
	}
	/**
	 * Loads the commands into the client.
	 */
	loadCommands() {
		const files = fs.readdirSync('./build/commands');
		let i = 0;
		for (const file of files) {
			if (!file.endsWith('.js')) // (Code is compiled to JS so when this is executed, command files are JS files.)
				continue;
			const construct = require(`../commands/${file}`).default;
			const command = new construct(this) as Command;
			this.commands.set(command.name, command);
			i++;
		}
		this.log.info('Loaded', i, 'commands');
	}
	/**
	 * Loads the events into the client.
	 */
	loadEvents() {
		const files = fs.readdirSync('./build/events');
		let i = 0;
		for (const file of files) {
			if (!file.endsWith('.js')) // (Code is compiled to JS so when this is executed, event files are JS files.)
				continue;
			const construct = require(`../events/${file}`).default;
			const event = new construct(this) as Event;
			this[event.once ? 'once' : 'on'](event.name, event.execute.bind(event));
			i++;
		}
		this.log.info('Loaded', i, 'events');
	}

	/**
	 * Does everything necessary to get the bot ready and running.
	 */
	start() {
		this.loadEvents();
		this.loadCommands();
		this.login(this.#token);
	}

}