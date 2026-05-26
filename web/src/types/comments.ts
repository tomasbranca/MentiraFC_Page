export const COMMENT_SORT_OPTIONS = ["newest", "oldest"] as const;

export type CommentSort = (typeof COMMENT_SORT_OPTIONS)[number];

export const COMMENT_REPORT_REASONS = [
  "spam",
  "harassment",
  "off_topic",
  "other",
] as const;

export type CommentReportReason = (typeof COMMENT_REPORT_REASONS)[number];

export const COMMENT_REPORT_STATUSES = [
  "open",
  "dismissed",
  "actioned",
] as const;

export type CommentReportStatus = (typeof COMMENT_REPORT_STATUSES)[number];

export type CommentAuthor = {
  id: string;
  firstName: string;
  lastName: string;
};

export type NewsComment = {
  id: string;
  newsId: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  editedAt: string | null;
  author: CommentAuthor;
  canEdit: boolean;
  canDelete: boolean;
  canModerateDelete: boolean;
  hasReported?: boolean;
};

export type NewsCommentsPage = {
  items: NewsComment[];
  nextCursor: string | null;
  sort: CommentSort;
};

export type CreateNewsCommentInput = {
  newsId: string;
  body: string;
};

export type UpdateNewsCommentInput = {
  body: string;
};

export type CreateCommentReportInput = {
  reason: CommentReportReason;
  details?: string;
};

export type CommentModerationItem = {
  comment: NewsComment;
  openReportCount: number;
  reports: Array<{
    id: string;
    reason: CommentReportReason;
    details: string | null;
    createdAt: string;
    status: CommentReportStatus;
  }>;
};

export type CommentModerationPage = {
  items: CommentModerationItem[];
  nextCursor: string | null;
};
