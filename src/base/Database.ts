import { Snowflake } from 'discord.js';
import { Connection, createConnection } from 'mysql2/promise';
import { AvailableLanguage } from '../types/AvailableLanguages';
import DatabaseParams from '../types/DatabaseParams';
import SavedGame from '../types/SavedGame';
import SavedGuild from '../types/SavedGuild';
import SavedVote, { CachedVotes, GameVotes } from '../types/SavedVotes';
import Logger from './Logger';

export default class Database implements DatabaseParams {
	database: string;
	host: string;
	password: string;
	user: string;
	/**
	 * Logger for any log message related to the Database.
	 */
	log: Logger;
	/**
	 * The MySQL connection. 
	 */
	#connection!: Connection;
	// We cache fetched database data to reduce database calls as much as possible.
	/**
	 * Cached Guild settings.
	 */
	#guildCache: Map<string, SavedGuild>;
	/**
	 * Cached Game data.
	 */
	#gameCache: Map<number, SavedGame>;
	/**
	 * Cached game votes.
	 */
	#votesCache: CachedVotes;
	/**
	 * Cached scores for every guild. `(Map<GuildId, Record<UserId, UserScoreInThisGuild>>)`
	 */
	#scoresCache: Map<Snowflake, Record<Snowflake, number>>;
	constructor({ database, host, password, user }: DatabaseParams) {
		this.database = database;
		this.host = host;
		this.password = password;
		this.user = user;
		this.log = new Logger('Database');
		this.#guildCache = new Map();
		this.#gameCache = new Map();
		this.#votesCache = new Map();
		this.#scoresCache = new Map();
	}

	/**
	 * Creates the connection to the database.
	 */
	async connect() {
		this.#connection = await createConnection({
			database: this.database,
			host: this.host,
			password: this.password,
			user: this.user,
			waitForConnections: true
		});
		this.#connection.resume
		this.log.info('Sucessfully connected to Database');
	}

	/**
	 * Makes a query to the database making sure the connection is not closed.
	 * @param sql The sql query string.
	 * @param values The values to safely put into the sql query string.
	 * @returns The result of the SQL query.
	 */
	async query(sql: string, values: any[]): Promise<any[]> {
		try {
			return await this.#connection.query(sql, values);
		} catch (err) {
			// This error may be thrown because the connection is in closed state.
			// Therefore, we can retry to send the query after reconnecting to the database.
			// If it still fails for whatever reason then the error is thrown as usual.
			await this.connect();
			return this.#connection.query(sql, values);
		}
	}

	//#region GUILDS OPERATIONS
	/**
	 * Adds a guild to the database.
	 * @param id The id of the guild.
	 */
	async addGuild(id: Snowflake): Promise<void> {
		this.query('INSERT INTO Guilds (id) VALUES (?)', [id]);
		this.log.info('Added Guild', id);
		this.#guildCache.set(id, { id, language: 'en' });
	}
	/**
	 * Sets the mosus player role in a Guild.
	 * @param guild The id of the guild.
	 * @param role The id of the role.
	 */
	async setGuildRole(guild: Snowflake, role: Snowflake) {
		this.query('UPDATE Guilds SET role = ? WHERE id = ?', [role, guild]);
		this.log.info(`G${guild} - Set role to`, role);
		if (this.#guildCache.has(guild))
			this.#guildCache.get(guild)!.role = role;
	}
	/**
	 * Sets the preferred language in a Guild.
	 * @param guild The id of the guild.
	 * @param language The ISO 639-1 string of the selected language.
	 */
	async setGuildLang(guild: Snowflake, language: AvailableLanguage) {
		this.query('UPDATE Guilds SET language = ? WHERE id = ?', [language, guild]);
		this.log.info(`G${guild} - Set lang to`, language);
		if (this.#guildCache.has(guild))
			this.#guildCache.get(guild)!.language = language;
	}
	/**
	 * Sets the ongoing game of a Guild.
	 * @param guild The id of the guild.
	 * @param game The id of the game, or null if the ongoing game in the guild is finished.
	 */
	async setGuildGame(guild: Snowflake, game: number | null) {
		this.query('UPDATE Guilds SET game = ? WHERE id = ?', [game, guild]);
		this.log.info(`G${guild} - Set game to`, game);
		if (this.#guildCache.has(guild))
			this.#guildCache.get(guild)!.game = game || undefined;
	}
	/**
	 * Gets saved data about a guild.
	 * @param id The id of the guild
	 * @returns The saved data about the guild if it is found.
	 */
	async getGuild(id: Snowflake): Promise<SavedGuild | null> {
		if (this.#guildCache.has(id))
			return this.#guildCache.get(id)!;
		const [rows] = await this.query('SELECT * FROM Guilds WHERE id = ?', [id]) as any[];
		if (!rows.length)
			return null;
		const guild = rows[0] as SavedGuild;
		this.#guildCache.set(id, guild);
		return guild;
	}
	//#endregion
	//#region GAMES OPERATIONS
	/**
	 * Starts a game in a Guild.
	 * @param game The base data of the game. 
	 * @returns The created game, including its freshly assigned id.
	 */
	async createGame(game: Omit<SavedGame, 'id' | 'status'>): Promise<SavedGame> {
		const [result] = await this.query(
			'INSERT INTO Games (guild, host, channel, sus, word) VALUES (?, ?, ?, ?, ?)',
			[game.guild, game.host, game.channel, game.sus, game.word]
		) as any[];
		const id = result.insertId;
		this.log.info(`#${id} created`);
		await this.setGuildGame(game.guild, id);
		const cached = { ...game, id, status: 'playing' } as SavedGame;
		return cached;
	}

	/**
	 * Gets a game by id.
	 * @param id the id of the game
	 * @returns The fetched game or null if it doesn't exist.
	 */
	async getGame(id: number): Promise<SavedGame | null> {
		if (this.#gameCache.has(id))
			return this.#gameCache.get(id)!;
		const [rows] = await this.query('SELECT * FROM Games WHERE id = ?', [id]) as any[];
		if (!rows.length)
			return null;
		const game = rows[0] as SavedGame;
		this.#gameCache.set(id, game);
		return game;
	}
	/**
	 * Sets the link to the placed word in a game.
	 * @param id The id of the game.
	 * @param link The link to the message in which the word was placed.
	 */
	async setGameLink(id: number, link: string): Promise<void> {
		await this.query('UPDATE Games SET link = ? WHERE id = ?', [link, id]);
		this.log.info(`#${id} - Set link to`, link);
		if (this.#gameCache.has(id))
			this.#gameCache.get(id)!.link = link;
	}
	/**
	 * Changes the status of a game.
	 * @param id The id of the game.
	 * @param status The new status of the game. 
	 * 
	 * `playing` is not accepted because we never go back to `playing` after leaving it,
	 * and it is the default status, so there is no need to ever explictly set a game's 
	 * status to `playing`.
	 */
	async setGameStatus(id: number, status: 'voting' | 'ended' | 'cancelled'): Promise<void> {
		await this.query('UPDATE Games SET status = ? WHERE id = ?', [status, id]);
		this.log.info(`#${id} - Set status to`, status);
		if (this.#gameCache.has(id))
			this.#gameCache.get(id)!.status = status;
	}
	/**
	 * Gives a malus to the sus player of a game.
	 * @param id The id of the game. 
	 */
	async enableMalus(id: number): Promise<void> {
		await this.query('UPDATE Games SET malus = 1 WHERE id = ?', [id]);
		this.log.info(`#${id} - Malus enabled`);
		if (this.#gameCache.has(id))
			this.#gameCache.get(id)!.malus = true;
	}

	//#endregion
	//#region VOTES OPERATIONS

	/**
	 * Gets all the votes for a game.
	 * @param game The id of the game.
	 * @returns The votes mapped by voter id, or an empty object.
	 */
	async getVotes(game: number): Promise<GameVotes> {
		if (this.#votesCache.has(game))
			return this.#votesCache.get(game)!;
		const [rows] = await this.query('SELECT * FROM Votes WHERE game = ?', [game]) as any[];
		const votes: GameVotes = {};
		for (const row of rows) {
			votes[row.voter] = row;
		}
		this.#votesCache.set(game, votes);
		return votes;
	}
	/**
	 * Submits a vote for a game.
	 * @param vote The vote to submit.
	 */
	async setVote(vote: SavedVote): Promise<void> {
		await this.query('INSERT INTO Votes VALUES (?, ?, ?, ?)', [vote.game, vote.voter, vote.voted, vote.word || null]);
		this.log.info(`#${vote.game} - New vote:`, vote.voter, '->', vote.voted, vote.word ? `('${vote.word}')` : '');
		if (this.#votesCache.has(vote.game))
			this.#votesCache.get(vote.game)![vote.voter] = vote;
	}
	//#endregion
	//#region SCORES OPERATIONS
	/**
	 * Gets the mosus scores of a guild.
	 * @param guild The guild of which the scores will be fetched.
	 * @returns The saved scores mapped by user id. If a player has never scored any point, their score is not in the record.
	 */
	async getScores(guild: Snowflake): Promise<Record<Snowflake, number>> {
		if (this.#scoresCache.has(guild))
			return this.#scoresCache.get(guild)!;
		const [rows] = await this.query('SELECT * FROM Scores WHERE guild = ?', [guild]) as any[];
		const scores: Record<Snowflake, number> = {};
		for (const row of rows) {
			scores[row.user] = row.score;
		}
		this.#scoresCache.set(guild, scores);
		return scores;
	}
	/**
	 * Sets the score of a user in a guild.
	 * @param guild The guild to which the score belongs to.
	 * @param user The user to whom the score belongs to.
	 * @param score The score to set.
	 */
	async setScore(guild: Snowflake, user: Snowflake, score: number): Promise<void> {
		try {
			await this.query('INSERT INTO Scores VALUES (?, ?, ?)', [guild, user, score]);
			// This throws an error if the user's score in the guild is already set.
		} catch (_) {
			await this.query('UPDATE Scores SET score = ? WHERE guild = ? AND user = ?', [score, guild, user]);
		}
		this.log.info('New score for', user, 'in', guild, '->', score);
		if (this.#scoresCache.has(guild))
			this.#scoresCache.get(guild)![user] = score;
	}
	/**
	 * Adds points to a user's score.
	 * @param guild The guild to which the score belongs to.
	 * @param user The user th whom the score belongs to.
	 * @param points The number of points to add. Can be any integer, positive and negative.
	 */
	async incrementScore(guild: Snowflake, user: Snowflake, points: number): Promise<void> {
		const [rows] = await this.query('SELECT score FROM Scores WHERE guild = ? AND user = ?', [guild, user]) as any[];
		let score = rows[0] ? rows[0].score : 0;
		score += points;
		await this.setScore(guild, user, score);
	}
	//#endregion
}