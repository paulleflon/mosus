import { CacheType, CommandInteraction, Guild, TextChannel } from 'discord.js';
import Client from '../base/Client';
import Command from '../base/Command';
import endGame from '../lib/endGame';
import { formatMessage, LocalizedSlashCommandBuilder } from '../lib/i18n';
import SavedGuild from '../types/SavedGuild';
const data = new LocalizedSlashCommandBuilder('close-votes');
export default class extends Command {
	constructor(client: Client) {
		super(client, 'close-votes', true, data.toJSON());
	}

	public async execute(interaction: CommandInteraction<CacheType>, guild: Guild, save: SavedGuild): Promise<void> {
		const game = await this.client.db.getGame(save.game || -1);
		if (!game)
			return void interaction.reply({
				content: formatMessage('ephemeral.notInGame', interaction.locale),
				ephemeral: true
			});
		if (game.status !== 'voting')
			return void interaction.reply({
				content: formatMessage('ephemeral.notInVote', interaction.locale),
				ephemeral: true
			});
		if (game.host !== interaction.user.id)
			return void interaction.reply({
				content: formatMessage('ephemeral.notHost', interaction.locale),
				ephemeral: true
			});
		this.client.db.setGameStatus(game.id, 'ended');
		const votes = await this.client.db.getVotes(game.id);
		endGame(this.client, save, game, votes, interaction.channel! as TextChannel);
		interaction.reply({
			ephemeral: true,
			content: '👍' // c'est bon j'ai trop la flemme de faire encore un string i18n
		});
	}
}
