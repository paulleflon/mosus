import { ClientEvents } from 'discord.js';
import Client from './Client';
import Logger from './Logger';

/**
 * A Discord event.
 */
export default abstract class Event {
	/* 
	 * The client this event is fired in. 
	 */
	client: Client;
	/* 
	 * The name of the event. 
	 */
	name: keyof ClientEvents;
	/* 
	 * Whether this event must be fired only once.
	 */
	once: boolean;
	/**
	 * Logger for any log message related to this event.
	 */
	log: Logger;
	constructor(client: Client, name: keyof ClientEvents, once = false) {
		this.client = client;
		this.name = name;
		this.once = once;
		this.log = new Logger(name);
	}

	/**
	 * The function to execute when the event is fired.
	 * @param args The arguments provided by discord.js
	 */
	public abstract execute(...args: any[]): void;
}