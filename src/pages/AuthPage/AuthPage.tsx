import { FormEvent, useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  useGetSkillsQuery,
  useLoginMutation,
  useRegisterMutation,
} from "../../shared/api/api";
import { RoutePath } from "../../shared/config/routerConfig";
import { useAppDispatch, useAppSelector } from "../../shared/store/hooks";
import { setCurrentUser } from "../../shared/store/authSlice";
import { Button, Card, Select, TextInput } from "../../shared/ui";
import "./AuthPage.css";

type AuthMode = "login" | "register";

const AuthPage = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.user);
  const { data: skills = [] } = useGetSkillsQuery();
  const [login, { isLoading: isLoggingIn }] = useLoginMutation();
  const [register, { isLoading: isRegistering }] = useRegisterMutation();

  const [mode, setMode] = useState<AuthMode>("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [skillId, setSkillId] = useState<number>(1);
  const [error, setError] = useState("");

  const title = mode === "login" ? "Вход в аккаунт" : "Регистрация";
  const submitText = mode === "login" ? "Войти" : "Создать аккаунт";
  const isSubmitting = isLoggingIn || isRegistering;

  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email]);

  const skillOptions = useMemo(
    () => skills.map((skill) => ({ value: skill.id, label: skill.name })),
    [skills]
  );

  useEffect(() => {
    if (skills.length > 0) {
      setSkillId(skills[0].id);
    }
  }, [skills]);

  if (currentUser) {
    return <Navigate to={RoutePath.profile} replace />;
  }

  const resetError = () => setError("");

  const handleModeChange = (nextMode: AuthMode) => {
    setMode(nextMode);
    setError("");
  };

  const handleLogin = async () => {
    try {
      const response = await login({
        email: normalizedEmail,
        password,
      }).unwrap();

      dispatch(setCurrentUser(response.user));
      navigate(RoutePath.profile, { replace: true });
    } catch {
      setError("Неверный email или пароль.");
    }
  };

  const handleRegister = async () => {
    if (!fullName.trim()) {
      setError("Введите имя пользователя.");
      return;
    }

    try {
      const response = await register({
        full_name: fullName.trim(),
        email: normalizedEmail,
        password,
        skill_level_id: skillId,
      }).unwrap();

      dispatch(setCurrentUser(response.user));
      navigate(RoutePath.profile, { replace: true });
    } catch {
      setError("Не удалось создать пользователя. Проверьте данные и API.");
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!normalizedEmail || !password) {
      setError("Введите email и пароль.");
      return;
    }

    if (mode === "login") {
      await handleLogin();
      return;
    }

    await handleRegister();
  };

  return (
    <main className="auth-page">
      <Card className="auth-card">
        <div className="auth-card__header">
          <span className="auth-card__badge">TechService AI</span>
          <h1 className="auth-card__title">{title}</h1>
          <p className="auth-card__subtitle">
            Авторизуйтесь, чтобы сохранить инвентарь, уровень навыков и историю
            починок.
          </p>
        </div>

        <div className="auth-card__tabs" role="tablist">
          <button
            className={`auth-card__tab ${mode === "login" ? "is-active" : ""}`}
            type="button"
            onClick={() => handleModeChange("login")}
          >
            Вход
          </button>
          <button
            className={`auth-card__tab ${mode === "register" ? "is-active" : ""}`}
            type="button"
            onClick={() => handleModeChange("register")}
          >
            Регистрация
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === "register" && (
            <label className="auth-form__field">
              <span>Имя</span>
              <TextInput
                value={fullName}
                onChange={(event) => {
                  resetError();
                  setFullName(event.target.value);
                }}
                placeholder="Иван Петров"
              />
            </label>
          )}

          <label className="auth-form__field">
            <span>Email</span>
            <TextInput
              type="email"
              value={email}
              onChange={(event) => {
                resetError();
                setEmail(event.target.value);
              }}
              placeholder="user@example.com"
            />
          </label>

          <label className="auth-form__field">
            <span>Пароль</span>
            <TextInput
              type="password"
              value={password}
              onChange={(event) => {
                resetError();
                setPassword(event.target.value);
              }}
              placeholder="Введите пароль"
            />
          </label>

          {mode === "register" && (
            <label className="auth-form__field">
              <span>Уровень навыков</span>
              <Select
                aria-label="Уровень навыков"
                options={skillOptions}
                value={skillId}
                onChange={setSkillId}
              />
            </label>
          )}

          {error && <p className="auth-form__error">{error}</p>}

          <Button className="auth-form__submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Подождите..." : submitText}
          </Button>
        </form>
      </Card>
    </main>
  );
};

export default AuthPage;
