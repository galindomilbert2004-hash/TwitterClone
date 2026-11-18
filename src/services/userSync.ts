
import { createUser, getUsers, ApiUser } from './api';
import { getProfile } from '@/database/profile';
import { getDatabase } from '@/database/database';

export async function syncUserToMockAPI(
  localUserId: number
): Promise<ApiUser> {
  const profile = await getProfile(localUserId);

  if (!profile) {
    throw new Error('Local user profile not found.');
  }

  const users = await getUsers();

  const existingUser = users.find(
    (user) =>
      user.email.toLowerCase() === profile.email.toLowerCase()
  );

  const publicProfile = {
    name: profile.name,
    email: profile.email,
    username: profile.username || '',
    bio: profile.bio || '',
    avatar_uri: profile.avatar_uri || '',
  };

  const apiUser = existingUser
    ? existingUser
    : await createUser(publicProfile);

  // Save the MockAPI ID in the local SQLite user record.
  const db = await getDatabase();

  await db.runAsync(
    'UPDATE users SET api_user_id = ? WHERE id = ?',
    apiUser.id,
    localUserId
  );

  return apiUser;
}

