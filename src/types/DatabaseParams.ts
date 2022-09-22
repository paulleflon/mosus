/**
 * Required parameters to open a connection to the database.
 */
export default interface DatabaseParams {
	/**
	 * The name of the database to connect to.
	 */
	database: string;
	/**
	 * The hostname of the database system.
	 */
	host: string;
	/**
	 * The user's password.
	 */
	password: string;
	/**
	 * The user connecting to the database.
	 */
	user: string;
}