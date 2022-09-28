import { Application, ApplicationCommand, ApplicationCommandOptionBase, ApplicationCommandOptionType, LocaleString, SharedSlashCommandOptions, SlashCommandAttachmentOption, SlashCommandBooleanOption, SlashCommandBuilder, SlashCommandChannelOption, SlashCommandIntegerOption, SlashCommandMentionableOption, SlashCommandNumberOption, SlashCommandRoleOption, SlashCommandStringOption, SlashCommandUserOption } from 'discord.js';
import { AvailableLanguage, AvailableLanguages } from '../types/AvailableLanguages';
/**
 * Formats a message to send to the user in their preferred language.
 * @param id The id of the sentence in the i18n json
 * @param locale The language to use
 * @param values The dynamic values to insert in the string
 * @returns The formatted message
 */
export function formatMessage(id: string, locale: LocaleString | 'en', values: Record<string, string> = {}): string {
	// In the bot, no difference is made between british and american english.
	// In case of unavailable locale from the user, we fallback to english.
	// That's why we need locale's type to accept 'en' as well.
	if (locale === 'en-GB' || locale === 'en-US' || !AvailableLanguages.includes(locale as AvailableLanguage))
		locale = 'en';
	let obj;
	try {
		obj = require(`../../i18n/general/${locale}.json`);
	} catch (_) {
		throw new Error(`Locale not found: ${locale}`);
	}
	// The provided `id` is split by `.`, to search through nested i18n strings.
	// ex: the `dm.sus` id searchs for the `sus` string in the `dm` object of the 
	// whole `obj` object, representing the whole locale file. 
	const path = id.split('.');
	let template = obj;
	// `template` is first the whole locale object and is being reduced to each scope
	// for each iteration of the loop. 
	// At the end of the loop, it must be a string. 
	for (const key of path) {
		template = template[key];
		if (!template)
			throw new Error(`Unknown i18n id: '${id}'`);
	}
	if (typeof template !== 'string')
		throw new Error(`Incorrect i18n id: '${id}', this seems to be a locale scope and not a locale string.`);
	// Matches any `{dynamicValueName}` pattern.
	const regex = /({(\w+)})/g;
	let match;
	while (match = regex.exec(template)) {
		const key = match[2];
		const value = values[key];
		// If this dynamic value is not provided in the function call, 
		// it is let as is in the returned string.
		if (value) {
			template = template.replace(match[1], values[key]);
			// As the matched pattern is being replaced in the string,
			// The regex index must be reset in order to keep matching
			// The next bracket values.
			regex.lastIndex = 0;
		}
	}
	return template;
}

/**
 * Any kind of SlashCommand Option.
 */
type SlashCommandOption = SlashCommandAttachmentOption | SlashCommandBooleanOption | SlashCommandChannelOption
	| SlashCommandIntegerOption | SlashCommandMentionableOption | SlashCommandNumberOption | SlashCommandRoleOption
	| SlashCommandStringOption | SlashCommandUserOption;

/**
 * Extended SlashCommandBuilder automatically taking care of localizations.
 */
export class LocalizedSlashCommandBuilder extends SlashCommandBuilder {
	constructor(name: string) {
		super();
		const en = require(`../../i18n/commands/en.json`)[name];
		this.setName(en.name);
		this.setDescription(en.description);
		for (const language of AvailableLanguages) {
			// English is the default language, this loop is only for the other languages.
			if (language === 'en') continue;
			try {
				const locale = require(`../../i18n/commands/${language}.json`)[name];
				this.setNameLocalization(language, locale.name)
					.setDescriptionLocalization(language, locale.description);
			} catch (_) {
				// Shit happened, we fallback to english.
				this.setNameLocalization(language, en.name)
					.setDescriptionLocalization(language, en.description);
			}
		}
	}

	/**
	 * Adds an option to this Slash Command and sets its localized names and descriptions.
	 * @param name The name of the option.
	 * @param builder A SlashCommand option.
	 */
	addLocalizedOption(name: string, builder: SlashCommandOption): this {
		const en = require('../../i18n/commands/en.json')[this.name].options[name];
		builder.setName(en.label).setDescription(en.description);
		for (const language of AvailableLanguages) {
			// English is the default language, this loop is only for the other languages.
			if (language === 'en') continue;
			try {
				const locale = require(`../../i18n/commands/${language}.json`)[this.name].options[name];
				builder.setNameLocalization(language, locale.label)
					.setDescriptionLocalization(language, locale.description);
			} catch (_) {
				// Shit happened, we fallback to english.
				builder.setNameLocalization(language, en.label)
					.setNameLocalization(language, en.description);
			}
		}
		switch (builder.type) {
			case ApplicationCommandOptionType.Attachment:
				this.addAttachmentOption(builder);
				break;
			case ApplicationCommandOptionType.Boolean:
				this.addBooleanOption(builder);
				break;
			case ApplicationCommandOptionType.Channel:
				this.addChannelOption(builder);
				break;
			case ApplicationCommandOptionType.Integer:
				this.addIntegerOption(builder);
				break;
			case ApplicationCommandOptionType.Mentionable:
				this.addMentionableOption(builder);
				break;
			case ApplicationCommandOptionType.Number:
				this.addNumberOption(builder);
				break;
			case ApplicationCommandOptionType.Role:
				this.addRoleOption(builder);
				break;
			case ApplicationCommandOptionType.String:
				this.addStringOption(builder);
				break;
			case ApplicationCommandOptionType.User:
				this.addUserOption(builder);
				break;
		}
		return this;
	}

}