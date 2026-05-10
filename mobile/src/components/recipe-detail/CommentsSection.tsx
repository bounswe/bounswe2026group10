import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, fonts, fontSizes, spacing } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import {
  Comment,
  createComment,
  deleteComment,
  listComments,
  updateComment,
} from '../../api/comments';
import { ApiError } from '../../api/client';

interface CommentsSectionProps {
  recipeId: string;
  creatorUsername?: string;
  onCommentSubmitted?: () => void;
}

const PAGE_SIZE = 20;

export function CommentsSection({
  recipeId,
  creatorUsername,
  onCommentSubmitted,
}: CommentsSectionProps) {
  const { t } = useTranslation('common');
  const { authState } = useAuth();
  const isAuthenticated = authState.status === 'authenticated';
  const currentUsername = isAuthenticated ? authState.user.username : null;
  const isCreator = currentUsername != null && currentUsername === creatorUsername;

  const [comments, setComments] = useState<Comment[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const [draftBody, setDraftBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingBody, setEditingBody] = useState('');
  const [editError, setEditError] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const myComment = useMemo(
    () =>
      currentUsername != null
        ? comments.find((c) => c.username === currentUsername) ?? null
        : null,
    [comments, currentUsername]
  );

  const loadFirstPage = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await listComments(recipeId, 1, PAGE_SIZE);
      setComments(res.comments);
      setTotal(res.pagination.total);
      setPage(1);
    } catch {
      setLoadError(t('recipeDetail.comments.loadError'));
    } finally {
      setLoading(false);
    }
  }, [recipeId, t]);

  useEffect(() => {
    loadFirstPage();
  }, [loadFirstPage]);

  const handleLoadMore = async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    try {
      const next = page + 1;
      const res = await listComments(recipeId, next, PAGE_SIZE);
      setComments((prev) => [...prev, ...res.comments]);
      setTotal(res.pagination.total);
      setPage(next);
    } catch {
      // Surface as a one-time alert; keep existing list intact.
      Alert.alert(t('recipeDetail.comments.title'), t('recipeDetail.comments.loadError'));
    } finally {
      setLoadingMore(false);
    }
  };

  const handleSubmit = async () => {
    const body = draftBody.trim();
    if (!body || submitting) return;
    setSubmitting(true);
    setFormError(null);
    try {
      await createComment(recipeId, body);
      setDraftBody('');
      await loadFirstPage();
      onCommentSubmitted?.();
    } catch (err) {
      if (err instanceof ApiError && err.code === 'RATING_REQUIRED') {
        Alert.alert(
          t('recipeDetail.comments.ratingRequiredTitle'),
          t('recipeDetail.comments.ratingRequired')
        );
      } else if (err instanceof ApiError && err.code === 'COMMENT_ALREADY_EXISTS') {
        setFormError(t('recipeDetail.comments.alreadyCommented'));
      } else {
        setFormError(t('recipeDetail.comments.submitError'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const startEditing = (c: Comment) => {
    setEditingId(c.id);
    setEditingBody(c.body);
    setEditError(null);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingBody('');
    setEditError(null);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const body = editingBody.trim();
    if (!body || savingEdit) return;
    setSavingEdit(true);
    setEditError(null);
    try {
      const updated = await updateComment(editingId, body);
      setComments((prev) =>
        prev.map((c) => (c.id === editingId ? { ...c, body: updated.body, updatedAt: updated.updatedAt } : c))
      );
      cancelEditing();
    } catch {
      setEditError(t('recipeDetail.comments.updateError'));
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = (commentId: string) => {
    Alert.alert(
      t('recipeDetail.comments.confirmDeleteTitle'),
      t('recipeDetail.comments.confirmDeleteMessage'),
      [
        { text: t('recipeDetail.comments.cancel'), style: 'cancel' },
        {
          text: t('recipeDetail.comments.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteComment(commentId);
              setComments((prev) => prev.filter((c) => c.id !== commentId));
              setTotal((prev) => Math.max(0, prev - 1));
              onCommentSubmitted?.();
            } catch {
              Alert.alert(
                t('recipeDetail.comments.title'),
                t('recipeDetail.comments.deleteError')
              );
            }
          },
        },
      ]
    );
  };

  const showComposer =
    isAuthenticated && !isCreator && myComment == null;

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>{t('recipeDetail.comments.title')}</Text>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={styles.spinner} />
      ) : loadError ? (
        <Text style={styles.errorText}>{loadError}</Text>
      ) : comments.length === 0 ? (
        <Text style={styles.emptyText}>{t('recipeDetail.comments.empty')}</Text>
      ) : (
        <View style={styles.list}>
          {comments.map((c) => {
            const isMine = currentUsername != null && c.username === currentUsername;
            const isEditing = editingId === c.id;
            return (
              <View key={c.id} style={styles.commentRow}>
                <View style={styles.commentHeader}>
                  <Text style={styles.username}>{c.username ?? ''}</Text>
                  {c.score != null ? <ScoreBadge score={c.score} /> : null}
                </View>

                {isEditing ? (
                  <>
                    <TextInput
                      value={editingBody}
                      onChangeText={setEditingBody}
                      multiline
                      maxLength={2000}
                      style={styles.editInput}
                      editable={!savingEdit}
                    />
                    {editError ? <Text style={styles.errorText}>{editError}</Text> : null}
                    <View style={styles.editActions}>
                      <TouchableOpacity
                        onPress={cancelEditing}
                        disabled={savingEdit}
                        style={[styles.secondaryButton]}
                      >
                        <Text style={styles.secondaryButtonText}>
                          {t('recipeDetail.comments.cancel')}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={saveEdit}
                        disabled={savingEdit || editingBody.trim().length === 0}
                        style={[
                          styles.primaryButton,
                          (savingEdit || editingBody.trim().length === 0) && styles.disabledButton,
                        ]}
                      >
                        <Text style={styles.primaryButtonText}>
                          {savingEdit
                            ? t('recipeDetail.comments.submitting')
                            : t('recipeDetail.comments.save')}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  <>
                    <Text style={styles.body}>{c.body}</Text>
                    {isMine ? (
                      <View style={styles.rowActions}>
                        <TouchableOpacity onPress={() => startEditing(c)}>
                          <Text style={styles.linkAction}>
                            {t('recipeDetail.comments.edit')}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDelete(c.id)}>
                          <Text style={[styles.linkAction, styles.destructiveAction]}>
                            {t('recipeDetail.comments.delete')}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    ) : null}
                  </>
                )}
              </View>
            );
          })}

          {comments.length < total ? (
            <TouchableOpacity
              onPress={handleLoadMore}
              disabled={loadingMore}
              style={styles.loadMoreButton}
            >
              <Text style={styles.loadMoreText}>
                {loadingMore ? '…' : t('recipeDetail.comments.loadMore')}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      )}

      {!isAuthenticated ? (
        <Text style={styles.loginPrompt}>{t('recipeDetail.comments.loginPrompt')}</Text>
      ) : null}

      {showComposer ? (
        <View style={styles.composer}>
          <TextInput
            value={draftBody}
            onChangeText={setDraftBody}
            placeholder={t('recipeDetail.comments.placeholder')}
            placeholderTextColor={colors.onSurfaceVariant}
            multiline
            maxLength={2000}
            style={styles.composerInput}
            editable={!submitting}
          />
          {formError ? <Text style={styles.errorText}>{formError}</Text> : null}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={submitting || draftBody.trim().length === 0}
            style={[
              styles.primaryButton,
              (submitting || draftBody.trim().length === 0) && styles.disabledButton,
            ]}
          >
            <Text style={styles.primaryButtonText}>
              {submitting
                ? t('recipeDetail.comments.submitting')
                : t('recipeDetail.comments.submit')}
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

function ScoreBadge({ score }: { score: number }) {
  return (
    <View style={styles.scoreBadge}>
      <MaterialCommunityIcons name="star" size={12} color={colors.starYellow} />
      <Text style={styles.scoreBadgeText}>{score}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing['3xl'],
  },
  heading: {
    fontFamily: fonts.serifBold,
    fontSize: fontSizes['2xl'],
    color: colors.onSurface,
    marginBottom: spacing.lg,
  },
  spinner: {
    paddingVertical: spacing.lg,
  },
  emptyText: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.md,
    color: colors.onSurfaceVariant,
    paddingVertical: spacing.md,
  },
  errorText: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.sm,
    color: colors.negative,
    marginTop: spacing.xs,
  },
  list: {
    gap: spacing.lg,
  },
  commentRow: {
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.outline,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  username: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSizes.md,
    color: colors.onSurface,
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: colors.surfaceContainer,
  },
  scoreBadgeText: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSizes.xs,
    color: colors.onSurface,
  },
  body: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.md,
    color: colors.onSurface,
    lineHeight: 20,
  },
  rowActions: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.xs,
  },
  linkAction: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSizes.sm,
    color: colors.primary,
  },
  destructiveAction: {
    color: colors.negative,
  },
  editInput: {
    minHeight: 64,
    borderWidth: 1,
    borderColor: colors.outline,
    borderRadius: 8,
    padding: spacing.sm,
    fontFamily: fonts.sans,
    fontSize: fontSizes.md,
    color: colors.onSurface,
    backgroundColor: colors.white,
    textAlignVertical: 'top',
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  loadMoreButton: {
    alignSelf: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  loadMoreText: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSizes.md,
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  loginPrompt: {
    marginTop: spacing.lg,
    fontFamily: fonts.sans,
    fontSize: fontSizes.md,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
  composer: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  composerInput: {
    minHeight: 96,
    borderWidth: 1,
    borderColor: colors.outline,
    borderRadius: 12,
    padding: spacing.md,
    fontFamily: fonts.sans,
    fontSize: fontSizes.md,
    color: colors.onSurface,
    backgroundColor: colors.white,
    textAlignVertical: 'top',
  },
  primaryButton: {
    backgroundColor: colors.secondary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSizes.md,
    color: colors.white,
  },
  disabledButton: {
    opacity: 0.5,
  },
  secondaryButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  secondaryButtonText: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSizes.md,
    color: colors.onSurface,
  },
});
