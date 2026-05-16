import { Routes, Route, useNavigate, useParams } from "react-router-dom";
import { Card, Button } from "../../shared/ui";
import { RoutePath } from "../../shared/config/routerConfig";
import { useAppSelector } from "../../shared/store/hooks";
import {
  useGetRepairHistoryByUserIdQuery,
  useGetRepairHistoryByIdQuery,
  useGetDeviceByIdQuery,
} from "../../shared/api/api";
import type { IRepairHistory } from "../../shared/types";
import "./HistoryPage.css";

const STATUS_LABELS: Record<IRepairHistory["status"], string> = {
  in_progress: "В процессе",
  success: "Успешно",
  failed: "Не удалось",
  cancelled: "Отменено",
};

const formatDateTime = (value: Date | string) =>
  new Date(value).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const repairListTitle = (record: IRepairHistory): string => {
  const line = record.issue_description.trim().split(/\r?\n/)[0] ?? "";
  if (!line) return `Починка №${record.id}`;
  if (line.length <= 72) return line;
  return `${line.slice(0, 72)}…`;
};

const repairPreview = (record: IRepairHistory, maxLen = 140): string => {
  const text = record.issue_description.trim();
  if (text.length <= maxLen) return text;
  return `${text.slice(0, maxLen)}…`;
};

const HistoryListView = () => {
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.auth.user);

  const { data, isLoading, isError, error } = useGetRepairHistoryByUserIdQuery(
    user?.id ?? 0,
    { skip: !user?.id }
  );

  const empty = !isLoading && !isError && (!data || data.length === 0);

  return (
    <section className="history-page">
      <Card className="history-page__panel">
        <header className="history-page__header">
          <h1 className="history-page__title">История починок</h1>
          <p className="history-page__subtitle">
            Обращения к помощнику и сохранённые консультации по ремонту
          </p>
        </header>

        <div className="history-page__body">
          {isLoading && <p className="history-page__hint">Загрузка…</p>}

          {isError && (
            <p className="history-page__error" role="alert">
              {(error as { data?: { message?: string } })?.data?.message ??
                "Не удалось загрузить историю. Попробуйте позже."}
            </p>
          )}

          {empty && (
            <p className="history-page__empty">Список починок пока что пуст</p>
          )}

          {!isLoading && !isError && data && data.length > 0 && (
            <ul className="history-page__list">
              {data.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className="history-page__list-item"
                    onClick={() => navigate(`${RoutePath.history}/${item.id}`)}
                  >
                    <span className="history-page__list-item-title">
                      {repairListTitle(item)}
                    </span>
                    <span className="history-page__list-item-desc">
                      {repairPreview(item)}
                    </span>
                    <span className="history-page__list-item-meta">
                      <span
                        className={`history-page__badge history-page__badge--${item.status}`}
                      >
                        {STATUS_LABELS[item.status]}
                      </span>
                      <span className="history-page__list-item-date">
                        {formatDateTime(item.started_at)}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>
    </section>
  );
};

const HistoryDetailView = () => {
  const navigate = useNavigate();
  const { repairId } = useParams<{ repairId: string }>();
  const id = repairId ? Number.parseInt(repairId, 10) : NaN;
  const validId = Number.isFinite(id) && id > 0;

  const {
    data: record,
    isLoading,
    isError,
    error,
  } = useGetRepairHistoryByIdQuery(id, { skip: !validId });

  const { data: device } = useGetDeviceByIdQuery(record?.device_id ?? 0, {
    skip: !record?.device_id,
  });

  const detailBlocks: { label: string; value: string | null }[] = record
    ? [
        { label: "Статус", value: STATUS_LABELS[record.status] },
        {
          label: "Начало",
          value: formatDateTime(record.started_at),
        },
        {
          label: "Окончание",
          value: record.finished_at ? formatDateTime(record.finished_at) : "—",
        },
        {
          label: "Устройство",
          value: device
            ? [device.device_type, device.brand, device.model]
                .filter(Boolean)
                .join(" · ")
            : record.device_id
              ? `ID устройства: ${record.device_id}`
              : "—",
        },
        { label: "Описание проблемы", value: record.issue_description },
        { label: "Выполненные работы", value: record.work_performed },
        { label: "Итог / заметки", value: record.result_notes },
        { label: "Рекомендация", value: record.recommendation_used },
        {
          label: "Обновлено",
          value: formatDateTime(record.updated_at),
        },
      ]
    : [];

  return (
    <section className="history-page">
      <Card className="history-page__panel history-page__panel--detail">
        <div className="history-page__detail-toolbar">
          <Button variant="ghost" type="button" onClick={() => navigate(RoutePath.history)}>
            ← К списку починок
          </Button>
        </div>

        {!validId && (
          <p className="history-page__error" role="alert">
            Некорректная ссылка на запись.
          </p>
        )}

        {validId && isLoading && <p className="history-page__hint">Загрузка…</p>}

        {validId && isError && (
          <p className="history-page__error" role="alert">
            {(error as { data?: { message?: string } })?.data?.message ??
              "Запись не найдена или недоступна."}
          </p>
        )}

        {validId && record && (
          <>
            <header className="history-page__header history-page__header--detail">
              <h1 className="history-page__title">{repairListTitle(record)}</h1>
              <p className="history-page__subtitle">
                Подробности консультации с помощником
              </p>
            </header>
            <dl className="history-page__detail">
              {detailBlocks.map(
                ({ label, value }) =>
                  value && (
                    <div key={label} className="history-page__detail-row">
                      <dt>{label}</dt>
                      <dd>{value}</dd>
                    </div>
                  )
              )}
            </dl>
          </>
        )}
      </Card>
    </section>
  );
};

const HistoryPage = () => (
  <Routes>
    <Route index element={<HistoryListView />} />
    <Route path=":repairId" element={<HistoryDetailView />} />
  </Routes>
);

export default HistoryPage;
