
import {
  createPost as createApiPost,
  updatePost as updateApiPost,
  deletePost as deleteApiPost,
  ApiPost,
} from './api';

import { getDatabase } from '@/database/database';
import { syncUserToMockAPI } from './userSync';

type LocalPostForSync = {
  id: number;
  user_id: number;
  name: string;
  username: string | null;
  content: string;
  image_uri: string | null;
  created_at: string;
  api_post_id: string | null;
};

export async function syncPostToMockAPI(
  localPostId: number,
  localUserId: number
): Promise<ApiPost> {
  // Make sure the user already exists in MockAPI.
  const apiUser = await syncUserToMockAPI(localUserId);
  const remoteUserId = Number(apiUser.id);

  if (!Number.isFinite(remoteUserId)) {
    throw new Error('MockAPI user ID must be a valid number.');
  }

  const db = await getDatabase();

  const post = await db.getFirstAsync<LocalPostForSync>(
    `SELECT
       posts.id,
       posts.user_id,
       users.name,
       users.username,
       posts.content,
       posts.image_uri,
       posts.created_at,
       posts.api_post_id
     FROM posts
     INNER JOIN users ON users.id = posts.user_id
     WHERE posts.id = ? AND posts.user_id = ?`,
    localPostId,
    localUserId
  );

  if (!post) {
    throw new Error('Local post not found.');
  }

  const postData = {
    user_id: remoteUserId,
    name: post.name,
    username: post.username || '',
    content: post.content,
    image_uri: post.image_uri || '',
    created_at: post.created_at,
  };

  // Update the existing MockAPI post.
  if (post.api_post_id) {
    return await updateApiPost(post.api_post_id, postData);
  }

  // Create a new MockAPI post.
  const apiPost = await createApiPost(postData);

  // Save the MockAPI post ID in SQLite.
  await db.runAsync(
    `UPDATE posts
     SET api_post_id = ?
     WHERE id = ? AND user_id = ?`,
    apiPost.id,
    localPostId,
    localUserId
  );

  return apiPost;
}

// Get the MockAPI ID before deleting the local SQLite post.
export async function getMockApiPostId(
  localPostId: number,
  localUserId: number
): Promise<string | null> {
  const db = await getDatabase();

  const post = await db.getFirstAsync<{
    api_post_id: string | null;
  }>(
    `SELECT api_post_id
     FROM posts
     WHERE id = ? AND user_id = ?`,
    localPostId,
    localUserId
  );

  return post?.api_post_id ?? null;
}

// Delete a post from MockAPI using its remote ID.
export async function deleteMockApiPost(
  remotePostId: string
): Promise<void> {
  await deleteApiPost(remotePostId);
}

