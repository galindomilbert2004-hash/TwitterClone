import { getDatabase } from './database';

export type UserProfile = {
  id: number;
  name: string;
  email: string;
  username: string | null;
  bio: string | null;
  avatar_uri: string | null;
};

export async function getProfile(userId: number): Promise<UserProfile | null> {
  const db = await getDatabase();

  return await db.getFirstAsync<UserProfile>(
    `SELECT id, name, email, username, bio, avatar_uri
     FROM users WHERE id = ?`,
    userId
  );
}

export async function updateProfile(
  userId: number,
  name: string,
  username: string,
  bio: string,
  avatarUri: string | null
) {
  const db = await getDatabase();

  await db.runAsync(
    `UPDATE users
     SET name = ?, username = ?, bio = ?, avatar_uri = ?
     WHERE id = ?`,
    name.trim(),
    username.trim() || null,
    bio.trim(),
    avatarUri,
    userId
  );
}
