import { ActivityType } from 'discord.js';
import Client from '../base/Client';
import Event from '../base/Event';

export default class extends Event {
	constructor(client: Client) {
		super(client, 'ready', true);
	}

	execute() {
		this.log.info('Ready and connected as', this.client.user?.tag);
		this.client.user!.setPresence({
			activities: [
				{
					name: 'ratio',
					type: ActivityType.Playing
				}
			]
		});
	}
}