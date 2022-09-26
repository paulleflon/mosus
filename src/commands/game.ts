import { CacheType, CommandInteraction, CommandInteractionOptionResolver, SlashCommandBuilder } from 'discord.js';
import Client from '../base/Client';
import Command from '../base/Command';
import { formatMessage, LocalizedSlashCommandBuilder } from '../lib/i18n';

const data = new LocalizedSlashCommandBuilder('game')
	.setDMPermission(false);
export default class extends Command {
	constructor(client: Client) {
		super(client, 'game', true, data.toJSON());
	}

	public async execute(interaction: CommandInteraction<CacheType>): Promise<void> {
		const guild = interaction.guild!;
		const gameId = (interaction.options as CommandInteractionOptionResolver).getNumber('id', true);
		
	}
}