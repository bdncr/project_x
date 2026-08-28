import { Icon } from "../Icon";
import { MAX_COMMENT_LENGTH, ProjectComment } from "../../lib/project-comments";
import { relativeDate } from "../../lib/format";

type CommentsSectionProps = {
  authorInitial: string;
  commentText: string;
  onCommentTextChange: (value: string) => void;
  onPostComment: () => void;
  comments: ProjectComment[];
  loading: boolean;
  posting: boolean;
  /** Set when the thread could not be read at all (missing table, network, policy). */
  error: string | null;
  /** The project author turned comments off in the editor's settings modal. */
  disabled: boolean;
  /** Null when nobody is signed in. Only used to decide which comments this visitor may
   * delete — posting is gated by the page, which in demo mode accepts a guest comment. */
  currentUserId: string | null;
  /** Owning the project allows moderating anyone's comment; otherwise only your own. */
  isProjectOwner: boolean;
  onDeleteComment: (comment: ProjectComment) => void;
};

export function CommentsSection({
  authorInitial, commentText, onCommentTextChange, onPostComment, comments,
  loading, posting, error, disabled, currentUserId, isProjectOwner, onDeleteComment,
}: CommentsSectionProps) {
  if (disabled) {
    return <section className="case-comments-block">
      <div className="case-comments-inner">
        <p className="case-comments-off"><Icon name="comment" />Энэ төсөлд сэтгэгдэл бичих боломжийг зохиогч хаасан байна.</p>
      </div>
    </section>;
  }

  const remaining = MAX_COMMENT_LENGTH - commentText.length;

  return <section className="case-comments-block">
    <div className="case-comments-inner">
      <h2 className="case-comments-title">Сэтгэгдэл {loading ? "" : `(${comments.length})`}</h2>

      {error && <p className="case-comments-error">Сэтгэгдлийг ачаалж чадсангүй: {error}</p>}

      <div className="case-comment-composer">
        <span className="account-avatar">{authorInitial}</span>
        <div>
          <textarea
            value={commentText}
            onChange={(event) => onCommentTextChange(event.target.value.slice(0, MAX_COMMENT_LENGTH))}
            rows={3}
            maxLength={MAX_COMMENT_LENGTH}
            placeholder="Энэ төслийн талаар та юу бодож байна?"
          />
          <div className="case-comment-actions">
            <button type="button" disabled={!commentText.trim() || posting} onClick={onPostComment}>
              {posting ? "Илгээж байна…" : "Сэтгэгдэл нэмэх"}
            </button>
            {/* Only worth showing as the limit gets close — a permanent counter is noise. */}
            {remaining <= 100 && <span className="case-comment-counter">{remaining}</span>}
          </div>
        </div>
      </div>

      {loading
        ? <ul className="case-comment-list" aria-hidden="true">
            {[0, 1].map((row) => <li key={row}>
              <span className="skeleton case-comment-avatar-skeleton" />
              <div className="case-comment-skeleton-lines">
                <span className="skeleton skeleton-line" style={{ width: "30%" }} />
                <span className="skeleton skeleton-line" style={{ width: "80%" }} />
              </div>
            </li>)}
          </ul>
        : comments.length === 0
          ? <p className="case-comments-empty">Одоогоор сэтгэгдэл алга байна. Эхлээд та сэтгэгдэл үлдээгээрэй.</p>
          : <ul className="case-comment-list">
              {comments.map((comment) => <li key={comment.id}>
                <span className="account-avatar">{comment.author.slice(0, 1).toUpperCase()}</span>
                <div>
                  <strong>{comment.author}<time dateTime={comment.createdAt}>{relativeDate(comment.createdAt)}</time></strong>
                  <p>{comment.text}</p>
                </div>
                {(isProjectOwner || (currentUserId && comment.authorId === currentUserId)) && <button
                  type="button"
                  className="case-comment-delete"
                  title="Сэтгэгдэл устгах"
                  aria-label="Сэтгэгдэл устгах"
                  onClick={() => onDeleteComment(comment)}
                ><Icon name="trash" /></button>}
              </li>)}
            </ul>}
    </div>
  </section>;
}
