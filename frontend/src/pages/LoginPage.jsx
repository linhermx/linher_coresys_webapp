import { useEffect, useMemo, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';

import logoVerticalLight from '../assets/logo-coresys-vertical-positivo.svg';
import logoVerticalDark from '../assets/logo-coresys-vertical-negativo.svg';
import { InlineNotice } from '../components/primitives/InlineNotice.jsx';
import { ThemeToggle } from '../components/primitives/ThemeToggle.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { useTheme } from '../hooks/useTheme.js';

const DEFAULT_EMAIL = 'programador@linher.com.mx';
const FALLBACK_LOGIN_ERROR = 'No pudimos iniciar sesión. Intenta nuevamente.';
const EMPTY_CREDENTIALS_ERROR = 'Ingresa tu correo y contraseña para continuar.';
const MAX_EMAIL_LENGTH = 254;
const SUPPORT_PANEL_ID = 'auth-support-panel';

const resolveLoginErrorMessage = (error) => {
  const status = Number(error?.status || 0);
  const code = String(error?.code || '').trim().toUpperCase();
  const rawMessage = String(error?.message || '').trim();

  if (status === 401 || code === 'INVALID_CREDENTIALS') {
    return 'Correo o contraseña incorrectos. Verifica tus datos e inténtalo nuevamente.';
  }

  if (status === 429 || code === 'TOO_MANY_REQUESTS') {
    return 'Realizaste demasiados intentos. Espera un momento e inténtalo nuevamente.';
  }

  if (status >= 500) {
    return 'No fue posible iniciar sesión por un error interno. Intenta nuevamente en unos minutos.';
  }

  if (
    rawMessage.toLowerCase().includes('fetch') ||
    rawMessage.toLowerCase().includes('network')
  ) {
    return 'No pudimos conectar con el servidor. Verifica tu conexión e inténtalo nuevamente.';
  }

  if (!rawMessage) {
    return FALLBACK_LOGIN_ERROR;
  }

  return rawMessage;
};

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, login } = useAuth();
  const { theme } = useTheme();
  const [logoSrc, setLogoSrc] = useState(theme === 'dark' ? logoVerticalDark : logoVerticalLight);
  const [email, setEmail] = useState(DEFAULT_EMAIL);
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showSupportInfo, setShowSupportInfo] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const redirectPath = useMemo(() => {
    const candidate = location.state?.from;
    if (typeof candidate !== 'string') {
      return '/tickets';
    }

    return candidate.startsWith('/') ? candidate : '/tickets';
  }, [location.state]);

  useEffect(() => {
    setLogoSrc(theme === 'dark' ? logoVerticalDark : logoVerticalLight);
  }, [theme]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    navigate(redirectPath, { replace: true });
  }, [isAuthenticated, navigate, redirectPath]);

  if (isAuthenticated) {
    return <Navigate to={redirectPath} replace />;
  }

  return (
    <main className="auth-page" aria-labelledby="auth-title">
      <div className="auth-page__theme-slot">
        <ThemeToggle className="auth-page__theme-toggle" />
      </div>

      <section className="auth-card" aria-describedby="auth-subtitle">
        <header className="auth-card__intro">
          <img
            src={logoSrc}
            alt="Coresys"
            className="auth-card__logo"
            width="180"
            height="56"
            loading="eager"
            decoding="async"
            onError={() => setLogoSrc(logoVerticalLight)}
          />
          <h1 id="auth-title" className="auth-card__title">Inicia sesión</h1>
          <p id="auth-subtitle" className="auth-card__subtitle">
            Accede con tu cuenta corporativa.
          </p>
        </header>

        <form
          className="auth-card__form"
          aria-busy={isSubmitting}
          onSubmit={async (event) => {
            event.preventDefault();
            if (isSubmitting) {
              return;
            }

            const normalizedEmail = String(email || '').trim().toLowerCase();
            const currentPassword = String(password || '');
            if (!normalizedEmail || !currentPassword) {
              setSubmitError(EMPTY_CREDENTIALS_ERROR);
              return;
            }

            setSubmitError('');
            setIsSubmitting(true);

            try {
              await login({
                email: normalizedEmail,
                password: currentPassword,
                rememberMe
              });
            } catch (error) {
              setSubmitError(resolveLoginErrorMessage(error));
            } finally {
              setIsSubmitting(false);
            }
          }}
        >
          <label className="auth-card__field" htmlFor="auth-email">
            <span>Correo corporativo</span>
            <input
              id="auth-email"
              name="email"
              type="email"
              inputMode="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              autoComplete="email"
              placeholder="nombre@linher.com.mx"
              maxLength={MAX_EMAIL_LENGTH}
              value={email}
              onChange={(event) => {
                if (submitError) {
                  setSubmitError('');
                }
                setEmail(event.target.value);
              }}
              disabled={isSubmitting}
              required
            />
          </label>

          <label className="auth-card__field" htmlFor="auth-password">
            <span>Contraseña</span>
            <input
              id="auth-password"
              name="password"
              type="password"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              autoComplete="current-password"
              placeholder="Ingresa tu contraseña"
              value={password}
              onChange={(event) => {
                if (submitError) {
                  setSubmitError('');
                }
                setPassword(event.target.value);
              }}
              disabled={isSubmitting}
              required
            />
          </label>

          <div className="auth-card__options">
            <label className="auth-card__remember" htmlFor="auth-remember-me">
              <input
                id="auth-remember-me"
                name="remember_me"
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
                disabled={isSubmitting}
              />
              <span>Recordarme en este equipo</span>
            </label>

            <button
              type="button"
              className="auth-card__forgot"
              aria-controls={SUPPORT_PANEL_ID}
              aria-expanded={showSupportInfo}
              onClick={() => setShowSupportInfo((currentState) => !currentState)}
              disabled={isSubmitting}
            >
              <span>¿Olvidaste tu contraseña?</span>
            </button>
          </div>

          {showSupportInfo ? (
            <aside
              id={SUPPORT_PANEL_ID}
              className="auth-card__recovery"
              aria-live="polite"
            >
              <strong>Recuperar acceso</strong>
              <p>La recuperación de acceso se realiza con el área de Sistemas. Si olvidaste tu contraseña o no puedes iniciar sesión, contáctalos para recibir ayuda.</p>
            </aside>
          ) : null}

          {submitError ? (
            <InlineNotice tone="error" className="auth-card__notice">
              {submitError}
            </InlineNotice>
          ) : null}

          <button
            type="submit"
            className="auth-card__submit"
            disabled={isSubmitting}
          >
            <LogIn size={16} aria-hidden="true" />
            <span>{isSubmitting ? 'Validando acceso...' : 'Iniciar sesión'}</span>
          </button>
        </form>
      </section>
    </main>
  );
};
