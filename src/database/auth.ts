
import * as Crypto from 'expo-crypto';
import { getDatabase } from './database';

type User = {
  id: number;
  name: string;
  email: string;
  username: string | null;
};

async function hashPassword(password: string, salt: string) {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${salt}:${password}`
  );
}

export async function registerUser(
  name: string,
  email: string,
  password: string
) {
  const db = await getDatabase();

  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = await db.getFirstAsync<{ id: number }>(
    'SELECT id FROM users WHERE email = ?',
    normalizedEmail
  );

  if (existingUser) {
    throw new Error('This email is already registered.');
  }

  const salt = Crypto.randomUUID();
  const hash = await hashPassword(password, salt);
  const passwordHash = `${salt}:${hash}`;

  const result = await db.runAsync(
    `INSERT INTO users (name, email, password_hash)
     VALUES (?, ?, ?)`,
    name.trim(),
    normalizedEmail,
    passwordHash
  );

  return result.lastInsertRowId;
}

export async function loginUser(
  email: string,
  password: string
): Promise<User | null> {
  const db = await getDatabase();

  const normalizedEmail = email.trim().toLowerCase();

  const user = await db.getFirstAsync<User & {
    password_hash: string;
  }>(
    `SELECT id, name, email, username, password_hash
     FROM users
     WHERE email = ?`,
    normalizedEmail
  );

  if (!user) {
    return null;
  }

  const [salt, storedHash] = user.password_hash.split(':');

  if (!salt || !storedHash) {
    return null;
  }

  const enteredHash = await hashPassword(password, salt);

  if (enteredHash !== storedHash) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    username: user.username,
  };
}

