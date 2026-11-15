import { getDatabase } from './database';

export type Post = {
  id: number;
  user_id: number;
  name: string;
  username: string | null;
  avatar_uri: string | null;
  content: string;
  image_uri: string | null;
  created_at: string;
  likes_count: number;
  is_liked: number;
  comments_count: number;
};

export type PostComment = {
  id: number;
  post_id: number;
  user_id: number;
  username: string | null;
  avatar_uri: string | null;
  content: string;
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

export async function getPosts(currentUserId: number): Promise<Post[]> {
  const db = await getDatabase();

  return db.getAllAsync<Post>(
    `SELECT
       posts.id,
       posts.user_id,
       users.name,
       users.username,
       users.avatar_uri,
       posts.content,
       posts.image_uri,
       posts.created_at,
       COUNT(DISTINCT post_likes.id) AS likes_count,
       MAX(CASE WHEN post_likes.user_id = ? THEN 1 ELSE 0 END) AS is_liked,
       (SELECT COUNT(*) FROM post_comments WHERE post_comments.post_id = posts.id) AS comments_count
     FROM posts
     INNER JOIN users ON posts.user_id = users.id
     LEFT JOIN post_likes ON post_likes.post_id = posts.id
     GROUP BY posts.id
     ORDER BY posts.id DESC`,
    currentUserId
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


export async function togglePostLike(postId: number, userId: number): Promise<boolean> {
  const db = await getDatabase();
  const existing = await db.getFirstAsync<{ id: number }>(
    'SELECT id FROM post_likes WHERE post_id = ? AND user_id = ?',
    postId, userId
  );

  if (existing) {
    await db.runAsync('DELETE FROM post_likes WHERE post_id = ? AND user_id = ?', postId, userId);
    return false;
  }

  await db.runAsync('INSERT OR IGNORE INTO post_likes (post_id, user_id) VALUES (?, ?)', postId, userId);
  return true;
}


export async function getPostComments(postId: number): Promise<PostComment[]> {
  const db = await getDatabase();
  return db.getAllAsync<PostComment>(
    `SELECT post_comments.id, post_comments.post_id, post_comments.user_id,
            users.username, users.avatar_uri, post_comments.content, post_comments.created_at
     FROM post_comments
     INNER JOIN users ON users.id = post_comments.user_id
     WHERE post_comments.post_id = ?
     ORDER BY post_comments.id ASC`,
    postId
  );
}

export async function createPostComment(postId: number, userId: number, content: string) {
  const cleanContent = content.trim();
  if (!cleanContent) throw new Error('Comment cannot be empty.');
  const db = await getDatabase();
  await db.runAsync(
    'INSERT INTO post_comments (post_id, user_id, content) VALUES (?, ?, ?)',
    postId, userId, cleanContent
  );
}
