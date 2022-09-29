import { Message } from 'discord.js';
import Client from '../base/Client';
import Event from '../base/Event';
import { formatMessage } from '../lib/i18n';

export default class extends Event {
	constructor(client: Client) {
		super(client, 'messageCreate');
	}

	public async execute(message: Message): Promise<void> {
		// DMs are not supported. 
		if (!message.guild)
			return;
		// No check is made anywhere about a bot having the player role or even placing the word.
		// If players want to play with bots I'm not here to judge.
		const guild = message.guild;
		const save = (await this.client.db.getGuild(guild.id))!;
		const game = await this.client.db.getGame(save.game || -1);
		if (!game)
			return;
		// The only scenario we're interested about is when the sus player places their word.
		// So we can ignore any message that is not sent by them.
		if (message.author.id !== game.sus)
			return;
		// Unfair fuckers scenarios
		const msg = message.content.toLocaleLowerCase()
			.replace(/https?:\/\/[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,10}[^\n ]+/g, '') // Avoid detecting the word in a link (especially in images alone that are embedded and do not show the links)
			.replace(/(```)(.+)(\n[^]*```)/g, '$1$3') // Avoid detecting the word in the language declaration of a markdown code which is hidden
			.replace(/<a?:\w+:\d{18,20}>/g, ''); // Avoid detecting the word in a custom emoji's name
		if (!game.link && msg.includes(game.word)) {
			await this.client.db.setGameLink(game.id, message.url);
			this.log.info(message.author.id, `placed their word for game #${game.id}`);
			message.author.send(formatMessage('dm.placed', save.language))
				.catch(_ => null); // This is fine
		}
	}
}
