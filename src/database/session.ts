import { getDatabase } from './database';

export type CurrentUser = {
  id: number;
  name: string;
  email: string;
  username: string | null;
};

async function prepareSessionTable() {
  const db = await getDatabase();

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS app_session (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      user_id INTEGER NOT NULL,
      FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
    );
  `);

  return db;
}

export async function saveCurrentUser(userId: number) {
  const db = await prepareSessionTable();

  await db.runAsync(
    `INSERT OR REPLACE INTO app_session (id, user_id)
     VALUES (1, ?)`,
    userId
  );
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const db = await prepareSessionTable();

  const user = await db.getFirstAsync<CurrentUser>(
    `SELECT users.id, users.name, users.email, users.username
     FROM users
     INNER JOIN app_session
       ON users.id = app_session.user_id
     WHERE app_session.id = 1`
  );

  return user ?? null;
}

export async function clearCurrentUser() {
  const db = await prepareSessionTable();
  await db.runAsync('DELETE FROM app_session WHERE id = 1');
}
