import Client from './base/Client';
import Database from './base/Database';
require('dotenv').config();

const db = new Database({
	database: process.env.DB_NAME!,
	host: process.env.DB_HOST!,
	user: process.env.DB_USER!,
	password: process.env.DB_PASSWORD!
});

db.connect().then(() => {
	const client = new Client(db, process.env.APPLICATION_ID!, process.env.BOT_TOKEN!);
	client.start();
});