import { Guild } from 'discord.js';
import Client from '../base/Client';
import Event from '../base/Event';

export default class extends Event {
	constructor(client: Client) {
		super(client, 'guildCreate');
	}

	async execute(guild: Guild) {
		await this.client.db.addGuild(guild.id);
		this.log.info('Added Guild', guild.id);
	}
}