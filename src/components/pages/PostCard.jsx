import React, { useState, useEffect } from "react";
import "../../css/PostCard.css";
import AnonymousCommentModal from "./modal/AnonymousCommentModal";
import { submitAnonymousComment, fetchPostComments } from "../../service/post";

const PostCard = ({ post, onDelete, isGuidanceStaff }) => {
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [comments, setComments] = useState([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isQuestionPost =
    post.category_name?.toLowerCase() === "questions" ||
    post.CATEGORY_NAME?.toLowerCase() === "questions";

  const isQuotePost =
    post.category_name?.toLowerCase() === "quote" ||
    post.CATEGORY_NAME?.toLowerCase() === "quote";

  const isAnnouncementPost =
    post.category_name?.toLowerCase() === "announcement" ||
    post.CATEGORY_NAME?.toLowerCase() === "announcement";

  const isEventPost =
    post.category_name?.toLowerCase() === "events" ||
    post.CATEGORY_NAME?.toLowerCase() === "events";

  useEffect(() => {
    if (isQuestionPost && post.post_id) {
      loadComments();
    }
  }, [post.post_id, post.category_name, post.CATEGORY_NAME]);

  const loadComments = async () => {
    setIsLoadingComments(true);
    try {
      const postId = post.post_id || post.POST_ID;
      const commentsData = await fetchPostComments(postId);
      setComments(Array.isArray(commentsData) ? commentsData : []);
    } catch (error) {
      console.error("Error loading comments:", error);
      setComments([]);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handleAddComment = async (commentText) => {
    setIsSubmittingComment(true);
    try {
      const postId = post.post_id || post.POST_ID;
      const result = await submitAnonymousComment(postId, commentText);

      if (result) {
        await loadComments();
        setShowCommentModal(false);
      }
    } catch (error) {
      console.error("Error submitting comment:", error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeletePost = async () => {
    setIsDeleting(true);
    try {
      await onDelete(post.post_id || post.POST_ID);
    } catch (error) {
      console.error("Error deleting post:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Unknown date";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getCategoryIcon = () => {
    if (isQuotePost) return "💬";
    if (isQuestionPost) return "❓";
    if (isAnnouncementPost) return "📢";
    if (isEventPost) return "📅";
    return "📝";
  };

  const getCategoryColor = () => {
    if (isQuotePost) return "quote";
    if (isQuestionPost) return "question";
    if (isAnnouncementPost) return "announcement";
    if (isEventPost) return "event";
    return "default";
  };

  return (
    <>
      <div className={`post-card post-${getCategoryColor()}`}>
        <div className="post-header">
          <div className="post-category">
            <span className="category-icon">{getCategoryIcon()}</span>
            <span className="category-name">
              {post.category_name || post.CATEGORY_NAME || "Post"}
            </span>
          </div>
          <button
            className="btn-delete"
            onClick={handleDeletePost}
            disabled={isDeleting}
            title="Delete this post"
          >
           {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>

        <div className="post-content">
          <p className="post-text">
            {post.post_content || post.POST_CONTENT || "No content"}
          </p>
        </div>

        <div className="post-metadata">
          <small>
             {formatDate(post.posted_date || post.POSTED_DATE)}
          </small>
          {post.section_name || post.SECTION_NAME ? (
            <small>
               {post.section_name || post.SECTION_NAME}
            </small>
          ) : null}
          {post.posted_by || post.POSTED_BY ? (
            <small>
               Posted by {post.posted_by || post.POSTED_BY}
            </small>
          ) : null}
        </div>

        {isQuestionPost && (
          <div className="post-interactions">
            <button
              className="btn-comment"
              onClick={() => setShowCommentModal(true)}
              disabled={isSubmittingComment}
            >
               Add Anonymous Comment ({comments.length})
            </button>

            {isLoadingComments && (
              <div className="comments-loading">
                <p>Loading comments...</p>
              </div>
            )}

            {!isLoadingComments && comments.length > 0 && (
              <div className="comments-section">
                <h4>Comments ({comments.length})</h4>
                <div className="comments-list">
                  {comments.map((comment) => (
                    <div key={comment.id || comment.response_id || Date.now()} className="comment">
                      <p className="comment-text">
                        {comment.text ||
                          comment.response_text ||
                          comment.responseText ||
                          "No text"}
                      </p>
                      <small className="comment-time">
                        {formatDate(
                          comment.timestamp ||
                            comment.response_date ||
                            comment.responseDate
                        )}
                      </small>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Anonymous Comment Modal */}
      {isQuestionPost && (
        <AnonymousCommentModal
          isOpen={showCommentModal}
          onClose={() => setShowCommentModal(false)}
          onSubmit={handleAddComment}
          isSubmitting={isSubmittingComment}
        />
      )}
    </>
  );
};

export default PostCard;