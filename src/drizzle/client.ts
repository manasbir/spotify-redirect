import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

export function getDb(d1: D1Database) {
  return drizzle(d1, { schema });
}

export type Connection = typeof schema.connections.$inferSelect;
export type NewConnection = typeof schema.connections.$inferInsert;
