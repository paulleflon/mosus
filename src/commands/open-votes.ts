import { CacheType, CommandInteraction, Guild, SlashCommandBuilder } from 'discord.js';
import Client from '../base/Client';
import Command from '../base/Command';
import { formatMessage, LocalizedSlashCommandBuilder } from '../lib/i18n';
import SavedGuild from '../types/SavedGuild';

const data = new LocalizedSlashCommandBuilder('open-votes')
	.setDMPermission(false);
export default class extends Command {
	constructor(client: Client) {
		super(client, 'open-votes', true, data.toJSON());
	}

	public async execute(interaction: CommandInteraction<CacheType>, guild: Guild, save: SavedGuild): Promise<void> {
		const game = await this.client.db.getGame(save.game || -1);
		if (!game)
			return void interaction.reply({
				content: formatMessage('ephemeral.notInGame', interaction.locale),
				ephemeral: true
			});
		if (game.status === 'voting')
			return void interaction.reply({
				content: formatMessage('ephemeral.alreadyInVote', interaction.locale),
				ephemeral: true
			});
		if (game.host !== interaction.user.id)
			return void interaction.reply({
				content: formatMessage('ephemeral.notHost', interaction.locale),
				ephemeral: true
			});
		// If there is no game link, the sus didn't place their word, so we give them the malus.
		if (!game.link) {
			this.client.db.enableMalus(game.id);
			const sus = await this.client.users.fetch(game.sus);
			sus.send(formatMessage('dm.placeDuringVote', save.language));
		}
		this.client.db.setGameStatus(game.id, 'voting');
		interaction.reply({
			allowedMentions: { roles: [save.role!] },
			content: formatMessage('announcements.voteOpen', save.language, { mention: `<@&${save.role}>` })
		});
	}
}