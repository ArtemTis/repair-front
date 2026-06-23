import { lazy, Suspense, type ComponentType } from "react";
import { useAppSelector } from "../../shared/store/hooks";
import { PageLoader } from "../../shared/ui/PageLoader/PageLoader";

type RemoteLoadErrorProps = {
  error?: unknown;
};

const RemoteLoadError = ({ error }: RemoteLoadErrorProps) => {
  const message =
    error instanceof Error ? error.message : "Неизвестная ошибка загрузки remote.";

  return (
    <div className="state state--error">
      <p>Не удалось загрузить админ-панель.</p>
      <p>
        Убедитесь, что admin remote запущен: <code>npm run admin:start</code> (порт 3001)
        или из корня <code>npm run dev</code>.
      </p>
      <p>
        Проверьте{" "}
        <a href="http://localhost:3001/remoteEntry.js" target="_blank" rel="noreferrer">
          http://localhost:3001/remoteEntry.js
        </a>
        .
      </p>
      {process.env.NODE_ENV === "development" && (
        <pre style={{ whiteSpace: "pre-wrap", fontSize: "0.85rem" }}>{message}</pre>
      )}
    </div>
  );
};

const loadAdminRemote = (): Promise<{ default: ComponentType<{ accessToken?: string }> }> =>
  import("admin/AdminApp")
    .then((module) => ({
      default: (module.default ?? module) as ComponentType<{ accessToken?: string }>,
    }))
    .catch((error) => {
      console.error("Failed to load admin remote:", error);
      const ErrorComponent = () => <RemoteLoadError error={error} />;
      return { default: ErrorComponent };
    });

const AdminApp = lazy(loadAdminRemote);

export const AdminRemoteWrapper = () => {
  const accessToken = useAppSelector((state) => state.auth.accessToken);

  return (
    <Suspense fallback={<PageLoader label="Загрузка админки..." />}>
      <AdminApp accessToken={accessToken ?? undefined} />
    </Suspense>
  );
};
