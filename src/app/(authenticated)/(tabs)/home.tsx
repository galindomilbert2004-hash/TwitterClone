import { FontAwesome } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Share,
  Animated,
  Image,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import {
  createPost,
  deletePost,
  getPosts,
  updatePost,
  togglePostLike,
  getPostComments,
  createPostComment,
  PostComment,
  Post,
} from '@/database/posts';

import { getCurrentUser, CurrentUser } from '@/database/session';


function AnimatedLikeButton({
  isLiked,
  count,
  onPress,
}: {
  isLiked: boolean;
  count: number;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 1.38, useNativeDriver: true, speed: 35, bounciness: 8 }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 22, bounciness: 10 }),
    ]).start();
    onPress();
  };

  return (
    <Pressable
      style={styles.likeButton}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={isLiked ? 'Unlike post' : 'Like post'}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <FontAwesome
          name={isLiked ? 'heart' : 'heart-o'}
          size={19}
          color={isLiked ? '#FF7417' : '#929292'}
        />
      </Animated.View>
      <Text style={[styles.likeCount, isLiked ? styles.likedCount : null]}>
        {count}
      </Text>
    </Pressable>
  );
}

export default function HomeScreen() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [content, setContent] = useState('');
  const [search, setSearch] = useState('');
  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [commentsPost, setCommentsPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [commentDraft, setCommentDraft] = useState('');
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentSaving, setCommentSaving] = useState(false);
  const bellRotation = useRef(new Animated.Value(0)).current;
  const publishScale = useRef(new Animated.Value(1)).current;

  const animatePress = (value: Animated.Value, toValue: number) => {
    Animated.spring(value, { toValue, useNativeDriver: true, speed: 30, bounciness: 5 }).start();
  };

  const animateBell = () => {
    bellRotation.setValue(0);
    Animated.sequence([
      Animated.timing(bellRotation, { toValue: 1, duration: 90, useNativeDriver: true }),
      Animated.timing(bellRotation, { toValue: -1, duration: 90, useNativeDriver: true }),
      Animated.timing(bellRotation, { toValue: 0.7, duration: 90, useNativeDriver: true }),
      Animated.timing(bellRotation, { toValue: 0, duration: 90, useNativeDriver: true }),
    ]).start();
  };

  const bellRotate = bellRotation.interpolate({ inputRange: [-1, 1], outputRange: ['-18deg', '18deg'] });

  const loadFeed = useCallback(async () => {
    try {
      const user = await getCurrentUser();

      if (!user) {
        router.replace('/(unauthenticated)/login');
        return;
      }

      setCurrentUser(user);

      const savedPosts = await getPosts(user.id);
      setPosts(savedPosts);
    } catch (error) {
      console.error('Feed loading error:', error);
      Alert.alert('Error', 'Unable to load your Home Feed.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  const filteredPosts = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return posts;

    return posts.filter((post) => {
      const name = (post.name || '').toLowerCase();
      const username = (post.username || '').toLowerCase();
      const message = (post.content || '').toLowerCase();

      return (
        name.includes(keyword) ||
        username.includes(keyword) ||
        message.includes(keyword)
      );
    });
  }, [posts, search]);

  const handlePublish = async () => {
    if (!currentUser) return;

    if (!content.trim()) {
      Alert.alert('Empty post', 'Please write something first.');
      return;
    }

    try {
      setSaving(true);

      if (editingPostId !== null) {
        await updatePost(editingPostId, currentUser.id, content);
        Alert.alert('Success', 'Your post has been updated.');
      } else {
        await createPost(currentUser.id, content);
      }

      setContent('');
      setEditingPostId(null);
      await loadFeed();
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Something went wrong.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (post: Post) => {
    setEditingPostId(post.id);
    setContent(post.content);
  };

  const handleCancelEdit = () => {
    setEditingPostId(null);
    setContent('');
  };

  const handleDelete = (post: Post) => {
    Alert.alert(
      'Delete post',
      'Are you sure you want to delete this post?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!currentUser) return;

            try {
              await deletePost(post.id, currentUser.id);
              await loadFeed();
            } catch (error) {
              Alert.alert(
                'Error',
                error instanceof Error
                  ? error.message
                  : 'Unable to delete post.'
              );
            }
          },
        },
      ]
    );
  };

  const handleLike = async (post: Post) => {
    if (!currentUser) return;
    try {
      await togglePostLike(post.id, currentUser.id);
      await loadFeed();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Unable to update like.');
    }
  };

  const handleNotifications = () => {
    Alert.alert('Notifications', 'You have no notifications yet.');
  };

  const openComments = async (post: Post) => {
    setCommentsPost(post);
    setCommentDraft('');
    setCommentsLoading(true);
    try {
      setComments(await getPostComments(post.id));
    } catch (error) {
      Alert.alert('Error', 'Unable to load comments.');
    } finally {
      setCommentsLoading(false);
    }
  };

  const submitComment = async () => {
    if (!currentUser || !commentsPost || !commentDraft.trim()) return;
    try {
      setCommentSaving(true);
      await createPostComment(commentsPost.id, currentUser.id, commentDraft);
      setCommentDraft('');
      setComments(await getPostComments(commentsPost.id));
      await loadFeed();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Unable to add comment.');
    } finally {
      setCommentSaving(false);
    }
  };

  const sharePost = async (post: Post) => {
    try {
      await Share.share({
        message: `@${(post.username || 'user').replace(/^@/, '')} on X_App:\n\n${post.content}`,
      });
    } catch (error) {
      Alert.alert('Share failed', 'Unable to share this post right now.');
    }
  };

  const renderPost = ({ item }: { item: Post }) => {
    const isOwner = currentUser?.id === item.user_id;

    return (
      <View style={styles.postCard}>
        <View style={styles.avatar}>
          {item.avatar_uri ? (
            <Image source={{ uri: item.avatar_uri }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarText}>
              {(item.username || 'user').replace(/^@/, '').charAt(0).toUpperCase()}
            </Text>
          )}
        </View>

        <View style={styles.postBody}>
          <View style={styles.postHeader}>
            <View style={styles.authorInfo}>
              <Text style={styles.username}>
                @{(item.username || 'user').replace(/^@/, '')}
              </Text>
            </View>

            <Text style={styles.postDate}>
              {new Date(
                item.created_at.replace(' ', 'T') + 'Z'
              ).toLocaleDateString()}
            </Text>
          </View>

          <Text style={styles.postContent}>{item.content}</Text>

          <View style={styles.postInteractionRow}>
            <AnimatedLikeButton
              isLiked={!!item.is_liked}
              count={item.likes_count || 0}
              onPress={() => handleLike(item)}
            />
            <Pressable style={styles.postActionButton} onPress={() => openComments(item)} accessibilityRole="button" accessibilityLabel="View comments">
              <FontAwesome name="comment-o" size={19} color="#929292" />
              <Text style={styles.postActionCount}>{item.comments_count || 0}</Text>
            </Pressable>
            <Pressable style={styles.postActionButton} onPress={() => sharePost(item)} accessibilityRole="button" accessibilityLabel="Share post">
              <FontAwesome name="share" size={18} color="#929292" />
              <Text style={styles.postActionLabel}>Share</Text>
            </Pressable>
          </View>

          {isOwner && (
            <View style={styles.actions}>
              <Pressable
                style={styles.editButton}
                onPress={() => handleEdit(item)}
              >
                <Text style={styles.editText}>Edit</Text>
              </Pressable>

              <Pressable
                style={styles.deleteButton}
                onPress={() => handleDelete(item)}
              >
                <Text style={styles.deleteText}>Delete</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF7417" />
        <Text style={styles.loadingText}>Loading X_App...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <FontAwesome name="twitter" size={25} color="#FF7417" />
            <Text style={styles.logo}>
              <Text style={styles.logoAccent}>X_</Text>
              <Text style={styles.logoText}>App</Text>
            </Text>
          </View>

          <Pressable
            onPress={() => { animateBell(); handleNotifications(); }}
            style={styles.notificationButton}
            accessibilityLabel="Notifications"
          >
            <Animated.View style={{ transform: [{ rotate: bellRotate }] }}>
              <FontAwesome name="bell" size={21} color="#FF7417" />
            </Animated.View>
          </Pressable>
        </View>

        {/* SEARCH BAR */}
        <View style={styles.searchRow}>
          <View style={[styles.searchBox, searchFocused && styles.searchBoxFocused]}>
            <Text style={styles.searchIcon}>⌕</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search posts..."
              placeholderTextColor="#777777"
              value={search}
              onChangeText={setSearch}
              returnKeyType="search"
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            />

            {search.length > 0 && (
              <Pressable onPress={() => setSearch('')}>
                <Text style={styles.clearSearch}>✕</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* HOME FEED */}
        <FlatList
          data={filteredPosts}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderPost}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadFeed();
              }}
              tintColor="#FF7417"
            />
          }
          ListHeaderComponent={
            <View style={styles.composer}>
              <Text style={styles.composerTitle}>
                {editingPostId !== null
                  ? 'Edit your post'
                  : "What's happening?"}
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Share your thoughts..."
                placeholderTextColor="#777777"
                multiline
                maxLength={280}
                value={content}
                onChangeText={setContent}
                editable={!saving}
              />

              <View style={styles.composerFooter}>
                <Text style={styles.characterCount}>
                  {content.length}/280
                </Text>

                <View style={styles.composerActions}>
                  {editingPostId !== null && (
                    <Pressable
                      style={styles.cancelButton}
                      onPress={handleCancelEdit}
                    >
                      <Text style={styles.cancelText}>Cancel</Text>
                    </Pressable>
                  )}

                  <Animated.View style={{ transform: [{ scale: publishScale }] }}>
                  <Pressable
                    style={[
                      styles.publishButton,
                      saving && styles.disabledButton,
                    ]}
                    onPress={handlePublish}
                    onPressIn={() => animatePress(publishScale, 0.96)}
                    onPressOut={() => animatePress(publishScale, 1)}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator color="#090909" />
                    ) : (
                      <Text style={styles.publishText}>
                        {editingPostId !== null ? 'Save' : 'Post'}
                      </Text>
                    )}
                  </Pressable>
                  </Animated.View>
                </View>
              </View>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>
                {search ? 'No matching posts' : 'No posts yet'}
              </Text>
              <Text style={styles.emptyText}>
                {search
                  ? 'Try another search.'
                  : 'Be the first to share something!'}
              </Text>
            </View>
          }
          contentContainerStyle={styles.feedContent}
        />
      </KeyboardAvoidingView>

      <Modal
        visible={!!commentsPost}
        animationType="slide"
        transparent
        onRequestClose={() => setCommentsPost(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.commentsSheet}>
            <View style={styles.commentsHeader}>
              <Text style={styles.commentsTitle}>Comments</Text>
              <Pressable onPress={() => setCommentsPost(null)} hitSlop={12}>
                <FontAwesome name="close" size={22} color="#F5F5F5" />
              </Pressable>
            </View>
            {commentsLoading ? (
              <ActivityIndicator color="#FF7417" style={{ marginTop: 28 }} />
            ) : (
              <FlatList
                data={comments}
                keyExtractor={(comment) => comment.id.toString()}
                style={styles.commentsList}
                ListEmptyComponent={<Text style={styles.noComments}>No comments yet. Be the first!</Text>}
                renderItem={({ item }) => (
                  <View style={styles.commentItem}>
                    <Text style={styles.commentUsername}>@{(item.username || 'user').replace(/^@/, '')}</Text>
                    <Text style={styles.commentContent}>{item.content}</Text>
                  </View>
                )}
              />
            )}
            <View style={styles.commentComposer}>
              <TextInput
                style={styles.commentInput}
                placeholder="Write a comment..."
                placeholderTextColor="#777777"
                value={commentDraft}
                onChangeText={setCommentDraft}
                maxLength={280}
                multiline
              />
              <Pressable
                style={[styles.commentSendButton, (!commentDraft.trim() || commentSaving) && styles.commentSendDisabled]}
                onPress={submitComment}
                disabled={!commentDraft.trim() || commentSaving}
              >
                {commentSaving ? <ActivityIndicator color="#090909" /> : <Text style={styles.commentSendText}>Send</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#090909',
  },
  container: {
    flex: 1,
    backgroundColor: '#090909',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#090909',
  },
  loadingText: {
    marginTop: 12,
    color: '#929292',
  },
  header: {
    height: 58,
    backgroundColor: '#090909',
    borderBottomWidth: 1,
    borderBottomColor: '#332014',
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: {
    color: '#FF7417',
    fontSize: 23,
    fontWeight: 'bold',
  },
  logoAccent: {
    color: '#FF7417',
    fontSize: 23,
    fontWeight: 'bold',
  },
  logoText: {
    color: '#F5F5F5',
    fontSize: 23,
    fontWeight: 'bold',
  },
  notificationButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#171717',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationIcon: {
    color: '#FF7417',
    fontSize: 25,
  },
  searchRow: {
    backgroundColor: '#090909',
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'flex-end',
  },
  searchBox: {
    width: '78%',
    height: 42,
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
  },
  searchBoxFocused: {
    borderColor: '#FF7417',
    shadowColor: '#FF7417',
    shadowOpacity: 0.28,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 3,
  },
  searchIcon: {
    color: '#929292',
    fontSize: 25,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#F5F5F5',
    fontSize: 14,
    paddingVertical: 0,
  },
  clearSearch: {
    color: '#929292',
    fontSize: 16,
    paddingLeft: 8,
  },
  feedContent: {
    paddingBottom: 30,
  },
  composer: {
    backgroundColor: '#090909',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#332014',
  },
  composerTitle: {
    color: '#F5F5F5',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  input: {
    minHeight: 100,
    maxHeight: 160,
    borderWidth: 1,
    borderColor: '#332014',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#F5F5F5',
    textAlignVertical: 'top',
  },
  composerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  characterCount: {
    color: '#777777',
    fontSize: 13,
  },
  composerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  publishButton: {
    backgroundColor: '#FF7417',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 22,
    minWidth: 76,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  publishText: {
    color: '#090909',
    fontWeight: 'bold',
    fontSize: 15,
  },
  cancelButton: {
    padding: 10,
  },
  cancelText: {
    color: '#929292',
    fontWeight: '600',
  },
  postCard: {
    backgroundColor: '#090909',
    padding: 16,
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#332014',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FF7417',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
  },
  avatarText: {
    color: '#090909',
    fontSize: 20,
    fontWeight: 'bold',
  },
  postBody: {
    flex: 1,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    flex: 1,
  },
  authorName: {
    color: '#F5F5F5',
    fontSize: 15,
    fontWeight: 'bold',
  },
  username: {
    color: '#F5F5F5',
    fontSize: 15,
    fontWeight: 'bold',
  },
  postDate: {
    color: '#777777',
    fontSize: 11,
  },
  postContent: {
    color: '#F5F5F5',
    fontSize: 15,
    lineHeight: 23,
    marginTop: 10,
  },
  postInteractionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingRight: 14,
    gap: 8,
  },
  likeCount: {
    color: '#929292',
    fontSize: 13,
    fontWeight: '600',
  },
  likedCount: {
    color: '#FF7417',
  },
  postActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    gap: 7,
  },
  postActionCount: {
    color: '#929292',
    fontSize: 13,
    fontWeight: '600',
  },
  postActionLabel: {
    color: '#929292',
    fontSize: 13,
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  commentsSheet: {
    height: '72%',
    backgroundColor: '#141414',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderTopWidth: 1,
    borderColor: '#6B310F',
    padding: 18,
  },
  commentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#332014',
  },
  commentsTitle: {
    color: '#F5F5F5',
    fontSize: 19,
    fontWeight: 'bold',
  },
  commentsList: { flex: 1, marginTop: 8 },
  noComments: { color: '#929292', textAlign: 'center', marginTop: 35 },
  commentItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#29201B' },
  commentUsername: { color: '#FF9A52', fontWeight: 'bold', marginBottom: 5 },
  commentContent: { color: '#F5F5F5', fontSize: 14, lineHeight: 20 },
  commentComposer: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingTop: 12 },
  commentInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    color: '#F5F5F5',
    backgroundColor: '#090909',
    borderWidth: 1,
    borderColor: '#49301F',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  commentSendButton: { backgroundColor: '#FF7417', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 13 },
  commentSendDisabled: { opacity: 0.5 },
  commentSendText: { color: '#090909', fontWeight: 'bold' },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 18,
    marginTop: 14,
  },
  editButton: {
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  editText: {
    color: '#FF7417',
    fontWeight: '600',
  },
  deleteButton: {
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  deleteText: {
    color: '#FF6B6B',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    color: '#F5F5F5',
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyText: {
    color: '#929292',
    marginTop: 8,
  },
});
