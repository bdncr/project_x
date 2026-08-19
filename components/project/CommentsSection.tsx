export type Comment = { id: string; author: string; text: string };

type CommentsSectionProps = {
  authorInitial: string;
  commentText: string;
  onCommentTextChange: (value: string) => void;
  onPostComment: () => void;
  comments: Comment[];
};

export function CommentsSection({ authorInitial, commentText, onCommentTextChange, onPostComment, comments }: CommentsSectionProps) {
  return <section className="case-comments-block">
    <div className="case-comments-inner">
      <div className="case-comment-composer">
        <span className="account-avatar">{authorInitial}</span>
        <div>
          <textarea value={commentText} onChange={(event) => onCommentTextChange(event.target.value)} rows={3} placeholder="Энэ төслийн талаар та юу бодож байна?" />
          <button type="button" disabled={!commentText.trim()} onClick={onPostComment}>Сэтгэгдэл нэмэх</button>
        </div>
      </div>
      {comments.length === 0 ? <p className="case-comments-empty">Одоогоор сэтгэгдэл алга байна. Эхлээд та сэтгэгдэл үлдээгээрэй.</p> : <ul className="case-comment-list">
        {comments.map((comment) => <li key={comment.id}>
          <span className="account-avatar">{comment.author.slice(0, 1).toUpperCase()}</span>
          <div><strong>{comment.author}</strong><p>{comment.text}</p></div>
        </li>)}
      </ul>}
    </div>
  </section>;
}
