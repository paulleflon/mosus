import { ChatInputCommandInteraction, Guild, SlashCommandBuilder } from 'discord.js';
import Client from '../base/Client';
import Command from '../base/Command';
import { formatMessage, LocalizedSlashCommandBuilder } from '../lib/i18n';
import SavedGuild from '../types/SavedGuild';

const data = new LocalizedSlashCommandBuilder('cancel')
	.setDMPermission(false);
export default class extends Command {
	constructor(client: Client) {
		super(client, 'cancel', false, data.toJSON());
	}

	public async execute(interaction: ChatInputCommandInteraction, guild: Guild, save: SavedGuild): Promise<void> {
		if (!save.game)
			return void interaction.reply({
				content: formatMessage('ephemeral.notInGame', interaction.locale),
				ephemeral: true
			});
		const game = (await this.client.db.getGame(save.game))!;
		if (interaction.user.id !== game.host)
			return void interaction.reply({
				content: formatMessage('ephemeral.notHost', interaction.locale),
				ephemeral: true
			});
		this.client.db.setGameStatus(game.id, 'cancelled');
		this.client.db.setGuildGame(guild.id, null);
		interaction.reply({
			allowedMentions: { roles: [save.role!] },
			content: formatMessage('announcements.gameCancelled', save.language, { mention: `<@&${save.role}>` })
		});
	}

}