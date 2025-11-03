import { useState, useEffect } from "react";
import { api } from "../api";
import { Link, useNavigate } from "react-router-dom";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import "../styles/Login.css";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [fadeOut, setFadeOut] = useState(false);
  const [loading, setLoading] = useState(false);

  // 🕐 fade + desaparecimento do erro após 5s
  useEffect(() => {
    if (error) {
      setFadeOut(false); // reseta o fade

      const fadeTimer = setTimeout(() => setFadeOut(true), 4000); // começa a sumir no 4º segundo
      const clearTimer = setTimeout(() => setError(""), 5000); // remove de vez no 5º

      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(clearTimer);
      };
    }
  }, [error]);

 async function handleSubmit(e) {
  e.preventDefault();
  setError("");

  // 🔎 validação simples de formato de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    setError("Email inválido");
    return;
  }

  setLoading(true);

  try {
    await api.post("/auth/login", { email, password });
    navigate("/home");
  } catch (err) {
    if (err.response?.status === 400 || err.response?.status === 401) {
      setError("Email ou senha incorretos");
    } else {
      setError(err.response?.data?.error || "Erro ao fazer login");
    }
  } finally {
    setLoading(false);
  }
}


  return (
    <div className="login-container">
      <div className="login-box">
  <form className="login-form" onSubmit={handleSubmit} autoComplete="off">
  <h2 className="login-title">Login</h2>

  {/* campo de email — agora invisível pro gerenciador */}
  <input
    type="text"
    placeholder="Email"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    autoComplete="off"
    name="user_email_fake" // 👈 nome neutro, o Chrome não reconhece
    inputMode="email"      // 👈 ainda mostra o teclado de email no mobile
    required
  />

  <div className="password-field">
    <input
      type={showPassword ? "text" : "password"}
      placeholder="Senha"
      value={password}
      onChange={(e) => setPassword(e.target.value)}
      autoComplete="new-password"
      name="user_pass_fake" // 👈 idem
      required
    />
    <button
      type="button"
      className="toggle-password"
      onClick={() => setShowPassword(!showPassword)}
      aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
    >
      {showPassword ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
    </button>
  </div>

  <div className={`error-wrapper ${error ? "visible" : "hidden"}`}>
    {error && <p className={`error-text ${fadeOut ? "fade-out" : ""}`}>{error}</p>}
  </div>

  <button type="submit" className="submit-btn" disabled={loading}>
    {loading ? "Entrando..." : "Entrar"}
  </button>

  <p className="signup-text">
    Ainda não tem uma conta? <Link to="/register">Cadastre-se</Link>
  </p>
</form>


      </div>
    </div>
  );
}
