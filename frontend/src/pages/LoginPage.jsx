import { KeyRound, Mail } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/primitives/Button.jsx";
import Card from "../components/primitives/Card.jsx";
import Input from "../components/primitives/Input.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { APP_METADATA } from "../utils/app.js";

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field) => (event) => {
    const value =
      event.target.type === "checkbox" ? event.target.checked : event.target.value;

    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await login({
        email: form.email,
        password: form.password,
        rememberMe: form.rememberMe,
      });
      navigate(APP_METADATA.homePath, { replace: true });
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-screen__shell">
        <Card className="auth-screen__card" variant="accent">
          <div className="auth-screen__brand">
            <div className="auth-screen__badge" aria-hidden="true">
              CS
            </div>
            <div className="auth-screen__copy">
              <p className="eyebrow">Acceso interno</p>
              <h1 className="auth-screen__title">{APP_METADATA.name}</h1>
            </div>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <Input
              id="login-email"
              label="Correo"
              type="email"
              value={form.email}
              onChange={handleChange("email")}
              leadingIcon={Mail}
              autoComplete="username"
              placeholder="usuario@linher.com.mx"
              required
            />

            <Input
              id="login-password"
              label="Contraseña"
              type="password"
              value={form.password}
              onChange={handleChange("password")}
              leadingIcon={KeyRound}
              autoComplete="current-password"
              placeholder="Ingresa tu contraseña"
              required
              error={error || undefined}
            />

            <label className="auth-form__remember">
              <input
                type="checkbox"
                checked={form.rememberMe}
                onChange={handleChange("rememberMe")}
              />
              <span>Mantener sesión</span>
            </label>

            <Button
              className="auth-form__submit"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}

export default LoginPage;
