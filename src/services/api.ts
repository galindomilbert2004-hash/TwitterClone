
const USERS_API_URL =
  'https://6afbb552892984c4494a29f4.mockapi.io/users';

const POSTS_API_URL =
  'https://6af3f9fe55a1de7dcf03745a.mockapi.io/api/products/items';

export type ApiUser = {
  id: string;
  name: string;
  email: string;
  username: string;
  bio: string;
  avatar_uri: string;
};

export type ApiPost = {
  id: string;
  user_id: number;
  name: string;
  username: string;
  content: string;
  image_uri: string;
  created_at: string;
  description?: string;
  image?: string;
};

async function apiRequest<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `API Error: ${response.status} ${errorText}`
    );
  }

  const responseText = await response.text();

  return (
    responseText ? JSON.parse(responseText) : undefined
  ) as T;
}

// ========================
// USERS CRUD - OLD URL
// ========================

export function getUsers() {
  return apiRequest<ApiUser[]>(USERS_API_URL);
}

export function getUser(id: string) {
  return apiRequest<ApiUser>(`${USERS_API_URL}/${id}`);
}

export function createUser(user: Omit<ApiUser, 'id'>) {
  return apiRequest<ApiUser>(USERS_API_URL, {
    method: 'POST',
    body: JSON.stringify(user),
  });
}

export function updateUser(
  id: string,
  user: Partial<Omit<ApiUser, 'id'>>
) {
  return apiRequest<ApiUser>(`${USERS_API_URL}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(user),
  });
}

export function deleteUser(id: string) {
  return apiRequest<void>(`${USERS_API_URL}/${id}`, {
    method: 'DELETE',
  });
}

// ========================
// POSTS CRUD - NEW URL
// ========================

export function getPosts() {
  return apiRequest<ApiPost[]>(POSTS_API_URL);
}

export function getPost(id: string) {
  return apiRequest<ApiPost>(`${POSTS_API_URL}/${id}`);
}

export function createPost(post: Omit<ApiPost, 'id'>) {
  return apiRequest<ApiPost>(POSTS_API_URL, {
    method: 'POST',
    body: JSON.stringify({
      ...post,
      description: post.content,
      image: post.image_uri,
    }),
  });
}

export function updatePost(
  id: string,
  post: Partial<Omit<ApiPost, 'id'>>
) {
  return apiRequest<ApiPost>(`${POSTS_API_URL}/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      ...post,
      ...(post.content !== undefined
        ? { description: post.content }
        : {}),
      ...(post.image_uri !== undefined
        ? { image: post.image_uri }
        : {}),
    }),
  });
}

export function deletePost(id: string) {
  return apiRequest<void>(`${POSTS_API_URL}/${id}`, {
    method: 'DELETE',
  });
}


