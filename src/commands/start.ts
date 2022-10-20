import { ChatInputCommandInteraction, Guild, SlashCommandBuilder } from 'discord.js';
import Client from '../base/Client';
import Command from '../base/Command';
import getWord from '../lib/getWord';
import { formatMessage, LocalizedSlashCommandBuilder } from '../lib/i18n';
import SavedGuild from '../types/SavedGuild';

const data = new LocalizedSlashCommandBuilder('start');
export default class extends Command {
	constructor(client: Client) {
		super(client, 'start', true, data.toJSON());
	}

	public async execute(interaction: ChatInputCommandInteraction, guild: Guild, save: SavedGuild) {
		// Only members with `Manage Messages` permission can start a game in a guild.
		if (!interaction.memberPermissions || !interaction.memberPermissions.has('ManageMessages'))
			return void interaction.reply({ content: formatMessage('ephemeral.missingPermission', 'fr'), ephemeral: true });
		// Not using just save.game as the id could be 0.
		if (typeof save.game === 'number')
			return void interaction.reply({
				content: formatMessage('ephemeral.alreadyInGame', interaction.locale),
				ephemeral: true
			});

		// The role is made sure to be defined in the interactionCreate event handler
		const role = (await guild.roles.fetch(save.role!))!;
		const word = await getWord(save.language);
		// We fetch to make sure all the players are well cached by discord.js and the count is correct.
		await guild.members.fetch();
		if (role.members.size < 3)
			return void interaction.reply({
				content: formatMessage('ephemeral.notEnoughPlayers', interaction.locale, { role }),
				ephemeral: true
			});
		if (role.members.size > 15)
			return void interaction.reply({
				content: formatMessage('ephemeral.tooManyPlayers', interaction.locale, { role }),
				ephemeral: true
			});
		// This reply is deferred as the process of sending DMs to every player can take some time.
		await interaction.deferReply();
		const sus = role.members.random()!.id;
		const settings = {
			guild: interaction.guild!.id,
			channel: interaction.channel!.id,
			host: interaction.user.id,
			word,
			sus,
			malus: false
		};
		// Messages are stored so that, if a DM fails to be sent and thus the game can't be started,
		// all the previously sent messages are edited to tell the player that the information they
		// received is not relevant anymore. 
		const messages = [];
		for (const { user } of role.members.toJSON()) {
			// This can fail if a user disables DMs from Server Members.
			try {
				if (user.id === sus)
					messages.push(await user.send(formatMessage('dm.sus', save.language, { word })));
				else
					messages.push(await user.send(formatMessage('dm.notSus', save.language)));
			} catch (_) {
				this.log.error(`Attempt to start a game in G${guild.id} failed. DM couldn't be sent to`, user.id);
				await interaction.editReply(formatMessage('ephemeral.dmError', save.language, { tag: user.tag }));
				for (const m of messages) {
					await m.edit(`**~~${m.content}~~**\n__${formatMessage('dm.cancelled', save.language)}__`);
				}
				return;
			}
		}
		const { id } = await this.client.db.createGame(settings);
		interaction.deleteReply();
		interaction.channel!.send({
			allowedMentions: { roles: [role.id] },
			content: formatMessage('announcements.gameLaunch', save.language, {
				mention: role,
				id
			})
		});
	}
}