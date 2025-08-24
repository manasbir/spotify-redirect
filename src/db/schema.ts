import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const connections = sqliteTable("connections", {
    // diff session id and id just in case
    id: integer("id").primaryKey({ autoIncrement: true }),
    sessionId: text("session_id").notNull().unique(),
    spotifyRefreshToken: text("spotify_refresh_token").notNull(),
    spotifyAccessToken: text("spotify_access_token").notNull(),
    spotifyExpiresAt: integer("spotify_expires_at", {
        mode: "timestamp_ms",
    }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
        .notNull()
        .default(sql`(unixepoch() * 1000)`),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
        .notNull()
        .default(sql`(unixepoch() * 1000)`),
});
