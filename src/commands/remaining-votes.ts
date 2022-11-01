import { CacheType, CommandInteraction, Guild } from 'discord.js';
import Client from '../base/Client';
import Command from '../base/Command';
import { formatMessage, LocalizedSlashCommandBuilder } from '../lib/i18n';
import SavedGuild from '../types/SavedGuild';
const data = new LocalizedSlashCommandBuilder('remaining-votes');
export default class extends Command {
	constructor(client: Client) {
		super(client, 'remaining-votes', true, data.toJSON());
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
		const votes = await this.client.db.getVotes(game.id);
		const voters = Object.keys(votes);
		const role = guild.roles.resolve(save.role!);
		const remaining = role?.members.filter(m => !voters.includes(m.id));
		interaction.reply({
			content: remaining?.map(m => m.toString()).join(', ')
		});
	}
}
