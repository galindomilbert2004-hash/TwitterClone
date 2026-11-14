import { getDatabase } from './database';

export type Post = {
  id: number;
  user_id: number;
  name: string;
  username: string | null;
  content: string;
  image_uri: string | null;
  created_at: string;
};

export async function createPost(userId: number, content: string) {
  const db = await getDatabase();
  const cleanContent = content.trim();

  if (!cleanContent) {
    throw new Error('Post cannot be empty.');
  }

  const result = await db.runAsync(
    `INSERT INTO posts (user_id, content) VALUES (?, ?)`,
    userId,
    cleanContent
  );

  return result.lastInsertRowId;
}

export async function getPosts(): Promise<Post[]> {
  const db = await getDatabase();

  return db.getAllAsync<Post>(
    `SELECT
       posts.id,
       posts.user_id,
       users.name,
       users.username,
       posts.content,
       posts.image_uri,
       posts.created_at
     FROM posts
     INNER JOIN users ON posts.user_id = users.id
     ORDER BY posts.id DESC`
  );
}

export async function updatePost(
  postId: number,
  userId: number,
  content: string
) {
  const db = await getDatabase();
  const cleanContent = content.trim();

  if (!cleanContent) {
    throw new Error('Post cannot be empty.');
  }

  const result = await db.runAsync(
    `UPDATE posts
     SET content = ?
     WHERE id = ? AND user_id = ?`,
    cleanContent,
    postId,
    userId
  );

  if (result.changes === 0) {
    throw new Error('Post not found or you cannot edit this post.');
  }
}

export async function deletePost(postId: number, userId: number) {
  const db = await getDatabase();

  const result = await db.runAsync(
    `DELETE FROM posts
     WHERE id = ? AND user_id = ?`,
    postId,
    userId
  );

  if (result.changes === 0) {
    throw new Error('Post not found or you cannot delete this post.');
  }
}
