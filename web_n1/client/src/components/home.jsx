import { useState, useEffect } from "react";
import { api } from "../api";
import { useNavigate } from "react-router-dom";
import CommentsSection from "./CommentsSection"; // ✅ importação do novo componente
import "../styles/home.css";

export default function Home() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState("");
  const [user, setUser] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState({ visible: false, postId: null });

  // 🔹 Carrega usuário logado e posts
  useEffect(() => {
    async function fetchData() {
      try {
        const { data } = await api.get("/auth/me");
        if (!data) navigate("/login");
        setUser(data);

        const postsRes = await api.get("/posts");
        setPosts(postsRes.data);
      } catch (err) {
        console.error("❌ Erro /auth/me:", err.response?.data || err);
        navigate("/login");
      }
    }
    fetchData();
  }, [navigate]);

  // 🔹 Cria novo post
  async function handlePost(e) {
    e.preventDefault();
    if (!newPost.trim()) return;

    try {
      const res = await api.post("/posts", { content: newPost });
      setPosts([res.data, ...posts]);
      setNewPost("");
    } catch (err) {
      console.error("Erro ao criar post:", err);
    }
  }

  // 🔹 Abre modal de confirmação
  function openDeleteModal(id) {
    setConfirmDelete({ visible: true, postId: id });
  }

  // 🔹 Fecha modal de confirmação
  function closeDeleteModal() {
    setConfirmDelete({ visible: false, postId: null });
  }

  // 🔹 Excluir post (com modal personalizado)
  async function handleDeletePost() {
    const id = confirmDelete.postId;
    if (!id) return;

    try {
      await api.delete(`/posts/${id}`);
      setPosts(posts.filter((p) => p.id !== id));
      closeDeleteModal();
    } catch (err) {
      console.error("Erro ao excluir post:", err);
      alert("Erro ao excluir o post");
    }
  }

  // 🔹 Abre modal de post + comentários
  function openPost(post) {
    setSelectedPost(post);
  }

  // 🔹 Logout
  async function handleLogout() {
    await api.post("/auth/logout");
    navigate("/login");
  }

  // 🔹 Fecha modal com tecla ESC
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") {
        if (selectedPost) {
          setSelectedPost((prev) => ({ ...prev, closing: true }));
          setTimeout(() => setSelectedPost(null), 250);
        } else if (confirmDelete.visible) {
          closeDeleteModal();
        }
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [selectedPost, confirmDelete]);

  return (
    <div className="home-page">
      {/* HEADER */}
      <header className="home-header">
        <h2>Feed</h2>
        <button className="logout-btn" onClick={handleLogout}>
          Sair
        </button>
      </header>

      {/* POSTS */}
      <main className="posts-area">
        {posts.length === 0 ? (
          <p className="no-posts">Nenhum post ainda.</p>
        ) : (
          posts.map((post) => (
            <div className="post-card" key={post.id}>
              <div className="post-header">
                <p className="post-author">{post.author?.name || "Anônimo"}</p>

                {/* 🔹 Botão delete visível apenas para o dono */}
                {user && post.author?.email === user.email && (
                  <button
                    className="delete-btn"
                    onClick={() => openDeleteModal(post.id)}
                    title="Excluir post"
                  >
                    🗑️
                  </button>
                )}
              </div>

              <p className="post-content" onClick={() => openPost(post)}>
                {post.content}
              </p>
            </div>
          ))
        )}
      </main>

      {/* FORMULÁRIO DE NOVO POST */}
      <form className="post-form" onSubmit={handlePost}>
        <textarea
          placeholder="Escreva seu post..."
          value={newPost}
          onChange={(e) => {
            if (e.target.value.length <= 256) setNewPost(e.target.value);
          }}
          rows="2"
          maxLength={256}
          required
        />
        <p className="char-count">{newPost.length}/256</p>
        <button type="submit">Publicar</button>
      </form>

      {/* MODAL DE COMENTÁRIOS */}
      {selectedPost && (
        <div
          className={`modal-overlay ${selectedPost?.closing ? "closing" : ""}`}
          onClick={() => {
            setSelectedPost((prev) => ({ ...prev, closing: true }));
            setTimeout(() => setSelectedPost(null), 250);
          }}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-author">{selectedPost.author?.name}</h3>
            <p className="modal-content">{selectedPost.content}</p>
            <hr />
            <CommentsSection postId={selectedPost.id} /> {/* ✅ Importado */}
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO */}
      {confirmDelete.visible && (
        <div className="confirm-overlay" onClick={closeDeleteModal}>
          <div className="confirm-box" onClick={(e) => e.stopPropagation()}>
            <h3>Excluir Post</h3>
            <p>Tem certeza que deseja excluir este post? Essa ação não pode ser desfeita.</p>
            <div className="confirm-actions">
              <button className="cancel-btn" onClick={closeDeleteModal}>
                Cancelar
              </button>
              <button className="confirm-btn" onClick={handleDeletePost}>
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
