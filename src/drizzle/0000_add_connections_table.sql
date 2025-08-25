CREATE TABLE `connections` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text,
	`spotify_refresh_token` text,
	`spotify_access_token` text,
	`spotify_expires_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`metadata` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `connections_session_id_unique` ON `connections` (`session_id`);