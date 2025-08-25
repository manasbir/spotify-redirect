import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const connections = sqliteTable('connections', {
  id: text('id').primaryKey(),
  sessionId: text('session_id').unique(),
  spotifyRefreshToken: text('spotify_refresh_token'),
  spotifyAccessToken: text('spotify_access_token'),
  spotifyExpiresAt: integer('spotify_expires_at', {
    mode: 'timestamp_ms',
  }),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .$default(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .notNull()
    .$default(() => new Date()),
  // jsonb, curr only used for state
  metadata: text('metadata'),
});
