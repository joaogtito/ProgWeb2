import { useState, useEffect } from "react";
import { api } from "../api";
import { Link, useNavigate } from "react-router-dom";
import "../styles/Register.css";

export default function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [fadeOut, setFadeOut] = useState(false);
  const [loading, setLoading] = useState(false);

  // 🔹 Faz o erro sumir após 5s com fade
  useEffect(() => {
    if (error) {
      setFadeOut(false);
      const fadeTimer = setTimeout(() => setFadeOut(true), 4000);
      const clearTimer = setTimeout(() => setError(""), 5000);
      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(clearTimer);
      };
    }
  }, [error]);

  // 🔹 Valida e-mail
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    // Verifica nome
    if (!name.trim()) {
      setError("O nome é obrigatório");
      return;
    }

    // Verifica e-mail
    if (!isValidEmail(email)) {
      setError("Email inválido");
      return;
    }

    // Verifica senhas
    if (password !== confirm) {
      setError("As senhas não coincidem");
      return;
    }

    setLoading(true);

    try {
      // 🔹 Verifica se o e-mail já está cadastrado
      const check = await api.post("/auth/check-email", { email });
      if (check.data.exists) {
        setError("Este email já está cadastrado");
        setLoading(false);
        return;
      }

      // 🔹 Faz o cadastro
      await api.post("/auth/register", { name, email, password, confirmPassword: confirm });
      navigate("/home");
    } catch (err) {
      setError(err.response?.data?.error || "Erro ao registrar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="register-page">
      <div className="register-box">
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Nome completo"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Confirmar senha"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />

          {/* Mensagem de erro com animação */}
          <div className={`error-wrapper ${error ? "visible" : "hidden"}`}>
            {error && <p className={`error-text ${fadeOut ? "fade-out" : ""}`}>{error}</p>}
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Cadastrando..." : "Cadastrar"}
          </button>

          <p className="login-link">
            Já tem uma conta? <Link to="/login">Faça login</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
