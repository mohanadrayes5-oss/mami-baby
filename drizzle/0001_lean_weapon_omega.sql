CREATE TABLE `children` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(120) NOT NULL,
	`birthStatus` enum('born','pregnant') NOT NULL DEFAULT 'born',
	`ageMonths` int,
	`weightKg` varchar(16),
	`gender` enum('girl','boy','unknown') NOT NULL DEFAULT 'unknown',
	`deliveryType` enum('natural','cesarean','unknown') NOT NULL DEFAULT 'unknown',
	`birthDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `children_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `diaper_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`childId` int NOT NULL,
	`diaperType` enum('pee','poop','mixed') NOT NULL,
	`peeColor` varchar(80),
	`poopColor` varchar(80),
	`poopTexture` varchar(80),
	`amount` int,
	`loggedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `diaper_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `feeding_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`childId` int NOT NULL,
	`feedingType` enum('breast','formula','mixed') NOT NULL,
	`breastSide` enum('right','left','both'),
	`formulaType` varchar(120),
	`amountMl` int,
	`durationMinutes` int,
	`note` varchar(255),
	`loggedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `feeding_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `medical_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`childId` int NOT NULL,
	`kind` enum('vaccine','doctor','emergency') NOT NULL,
	`title` varchar(160) NOT NULL,
	`eventDate` timestamp NOT NULL,
	`doctor` varchar(120),
	`clinic` varchar(160),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `medical_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mother_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`age` int,
	`childrenCount` int,
	`marriageYears` int,
	`weightKg` varchar(16),
	`healthStatus` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `mother_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `mother_profiles_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `stripeCustomerId` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `stripeSubscriptionId` varchar(255);