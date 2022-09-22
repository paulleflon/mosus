import fs from 'fs';
import { join } from 'path';

/**
 * Utility class for logging functions.
 */
export default class Logger {
	/**
	 * The name of this logger.
	 */
	name: string;
	constructor(name: string) {
		this.name = name;
	}

	/**
	 * Formats a log message and writes in the console and in a log file.
	 * @param type The type of the log message
	 * @param content The content of the message
	 */
	private write(type: 'INFO' | 'WARN' | 'ERROR', ...content: any[]): void {
		let message = '';
		const now = new Date();
		message += now.toISOString();
		message += ` (${this.name})`;
		message += ` [${type}]`;
		message += ` ${content.map(v => `${v}`).join(' ')}`;
		const file = now.toLocaleDateString('fr') // ouais ouais ouais rpz
			// Converts the date string to ISO 8601, with - separators.
			// e.g. 11/02/2004 (French Locale Date) -> 2004-02-11 (ISO 8601 Date)
			.split('/')
			.reverse()
			.join('-') + '.log';
		if (type === 'ERROR')
			console.error(message);
		else
			console.log(message);

		if (!fs.existsSync('logs'))
			fs.mkdirSync('logs');
		fs.appendFileSync(join('logs', file), message + '\n');
	}

	/**
	 * Writes an info log.
	 * @param content The content of the log message.
	 */
	info(...content: any[]) { this.write('INFO', ...content); }
	/**
	 * Writes a warning log.
	 * @param content The content of the log message. 
	 */
	warn(...content: any[]) { this.write('WARN', ...content); }
	/**
	 * Writes an error log.
	 * @param content The content of the log message.
	 */
	error(...content: any[]) { this.write('ERROR', ...content); }

}
