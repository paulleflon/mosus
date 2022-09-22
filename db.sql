USE `mosus`;

CREATE TABLE `Guilds`(
	/* The Discord id of the guild. */
	`id` VARCHAR(20) NOT NULL,
	/* The Discord id of the mosus players' role for the guild. */
	`role` VARCHAR(20),
	/* The ISO 639-1 string of the preferred language in the guild. */
	`language` CHAR(2) NOT NULL DEFAULT 'en',
	/* The id of the game the guild is playing, if any. */
	`game` INT,
	PRIMARY KEY (`id`)
);

CREATE TABLE `Games`(
	/* The id of the game */
	`id` INT NOT NULL AUTO_INCREMENT,
	/* The status of the game, pretty self-explanatory */
	`status` ENUM('playing', 'voting', 'ended', 'cancelled') NOT NULL DEFAULT 'playing',
	/* The Discord id of the guild in which this game takes places */
	`guild` VARCHAR(20) NOT NULL,
	/* The Discord id of the user who started the game. */
	`host` VARCHAR(20) NOT NULL,
	/* The Discord id of the channel in which the announcements are made for the game. */
	`channel` VARCHAR(20) NOT NULL,
	/* The Discord id of the user who has to place a word */
	`sus` VARCHAR(20) NOT NULL,
	/* The word that has to be placed */
	`word` VARCHAR(100) NOT NULL,
	/* The link to the message the sus has first placed the word, if they have. 
	So this column can also be used to check if the sus player has placed their word or not. */
	`link` VARCHAR(150),
	/* Whether the sus placed their word during the voting phase, thus they shall received a malus. */
	`malus` BOOLEAN NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`),
	FOREIGN KEY (`guild`) REFERENCES `Guilds`(`id`)
);

CREATE TABLE `Votes`(
	/* The id of the game this vote is from */
	`game` INT NOT NULL,
	/* The Discord id of the user who submitted the vote */
	`voter` VARCHAR(20) NOT NULL,
	/* The Discord id of the user against whom the voter has voted */
	`voted` VARCHAR(20) NOT NULL,
	/* The word that the voter thinks the voted had to place */
	`word` VARCHAR(100),
    PRIMARY KEY (`game`, `voter`),
	FOREIGN KEY (`game`) REFERENCES `Games`(`id`)
);

CREATE TABLE `Scores`(
	/* The guild in which the score belongs */
	`guild` VARCHAR(20) NOT NULL,
	/* The Discord id of the user */
	`user` VARCHAR(20) NOT NULL,
	/* The score of the user */
	`score` INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (`guild`, `user`),
	FOREIGN KEY (`guild`) REFERENCES `Guilds`(`id`)
);