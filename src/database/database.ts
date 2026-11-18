
import * as SQLite from 'expo-sqlite';

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;
let initializationPromise: Promise<void> | null = null;

export function getDatabase() {
  if (!databasePromise) {
    databasePromise = SQLite.openDatabaseAsync('twitterclone.db');
  }

  return databasePromise;
}

export function initializeDatabase(): Promise<void> {
  if (!initializationPromise) {
    initializationPromise = initializeDatabaseOnce().catch((error) => {
      // Allow another initialization attempt if this one fails.
      initializationPromise = null;
      throw error;
    });
  }

  return initializationPromise;
}

async function initializeDatabaseOnce() {
  const db = await getDatabase();

  await db.execAsync(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL COLLATE NOCASE UNIQUE,
      password_hash TEXT NOT NULL,
      username TEXT UNIQUE,
      bio TEXT DEFAULT '',
      avatar_uri TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      image_uri TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_posts_user_id
    ON posts(user_id);

    CREATE TABLE IF NOT EXISTS post_likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(post_id, user_id),
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_post_likes_post_id
    ON post_likes(post_id);

    CREATE TABLE IF NOT EXISTS post_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_post_comments_post_id
    ON post_comments(post_id);
  `);

  // Read the current users table columns.
  const userColumns = await db.getAllAsync<{ name: string }>(
    'PRAGMA table_info(users)'
  );

  // Read the current posts table columns.
  const postColumns = await db.getAllAsync<{ name: string }>(
    'PRAGMA table_info(posts)'
  );

  // Add api_user_id only if it does not exist.
  if (!userColumns.some((column) => column.name === 'api_user_id')) {
    await db.execAsync(
      'ALTER TABLE users ADD COLUMN api_user_id TEXT'
    );
  }

  // Add api_post_id only if it does not exist.
  if (!postColumns.some((column) => column.name === 'api_post_id')) {
    await db.execAsync(
      'ALTER TABLE posts ADD COLUMN api_post_id TEXT'
    );
  }

  console.log('SQLite database initialized successfully!');
  console.log('MockAPI ID migration completed successfully!');
}

