import { useState, useEffect } from "react";
import { api } from "../api";
import "../styles/home.css";

export default function CommentsSection({ postId }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [user, setUser] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null); // 🔹 controla modal de confirmação

  // 🔹 Carrega comentários e usuário logado
  useEffect(() => {
    async function fetchComments() {
      try {
        const me = await api.get("/auth/me");
        setUser(me.data);

        const res = await api.get(`/comments/${postId}?page=${page}&limit=10`);
        setComments(res.data.comments);
        setTotalPages(res.data.totalPages);
      } catch (err) {
        console.error("Erro ao carregar comentários:", err);
      }
    }
    fetchComments();
  }, [postId, page]);

  // 🔹 Adiciona novo comentário
  async function handleComment(e) {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      await api.post("/comments", { postId, content: newComment });
      setNewComment("");

      const res = await api.get(`/comments/${postId}?page=${page}&limit=10`);
      setComments(res.data.comments);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error("Erro ao comentar:", err);
    }
  }

  // 🔹 Confirmar exclusão (abre modal)
  function openConfirmDelete(id) {
    setConfirmDelete(id);
  }

  // 🔹 Cancelar exclusão
  function cancelDelete() {
    setConfirmDelete(null);
  }

  // 🔹 Excluir comentário
  async function handleDeleteComment() {
    if (!confirmDelete) return;

    try {
      await api.delete(`/comments/${confirmDelete}`);
      setComments(comments.filter((c) => c.id !== confirmDelete));
    } catch (err) {
      console.error("Erro ao excluir comentário:", err);
      alert("Erro ao excluir comentário");
    } finally {
      setConfirmDelete(null);
    }
  }

  return (
    <div className="comments-section">
      <h4>Comentários</h4>

      {comments.length === 0 ? (
        <p className="no-comments">Nenhum comentário ainda.</p>
      ) : (
        comments.map((c) => (
          <div className="comment" key={c.id}>
            <div className="comment-header">
              <strong>{c.author?.name}:</strong>
              {user && c.author?.email === user.email && (
                <button
                  className="delete-comment-btn"
                  onClick={() => openConfirmDelete(c.id)}
                  title="Excluir comentário"
                >
                  🗑️
                </button>
              )}
            </div>
            <p className="comment-text">{c.content}</p>
          </div>
        ))
      )}

      {/* Paginação */}
      <div className="pagination">
        <button
          className="page-btn left"
          disabled={page <= 1}
          onClick={() => setPage(page - 1)}
        >
          ←
        </button>

        <span className="page-info">
          Página {page} de {totalPages}
        </span>

        <button
          className="page-btn right"
          disabled={page >= totalPages}
          onClick={() => setPage(page + 1)}
        >
          →
        </button>
      </div>

      {/* Novo comentário */}
      <form className="comment-form" onSubmit={handleComment}>
        <textarea
          placeholder="Escreva um comentário..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          rows="2"
          maxLength={256}
          required
        />
        <p className="char-count">{newComment.length}/256</p>
        <button type="submit">Comentar</button>
      </form>

      {/* 🔹 Modal de confirmação de exclusão */}
      {confirmDelete && (
        <div className="confirm-overlay" onClick={cancelDelete}>
          <div
            className="confirm-box"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Excluir comentário?</h3>
            <p>Essa ação não pode ser desfeita.</p>
            <div className="confirm-actions">
              <button className="cancel-btn" onClick={cancelDelete}>
                Cancelar
              </button>
              <button className="confirm-btn" onClick={handleDeleteComment}>
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
