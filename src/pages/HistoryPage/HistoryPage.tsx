import { useEffect, useMemo, type MouseEvent } from "react";
import { Routes, Route, useNavigate, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Card, Button, Select } from "../../shared/ui";
import type { SelectOption } from "../../shared/ui";
import { RoutePath } from "../../shared/config/routerConfig";
import { useAppSelector } from "../../shared/store/hooks";
import {
  useGetRepairHistoryByUserIdQuery,
  useGetRepairHistoryByIdQuery,
  useGetDevicesByUserIdQuery,
  useUpdateRepairHistoryMutation,
  useDeleteRepairHistoryMutation,
} from "../../shared/api/api";
import type { IRepairHistory } from "../../shared/types";
import { formatDeviceName } from "../../shared/repairHistory/deviceDisplay";
import { removeChatReportSection } from "../../shared/repairHistory/chatReportLink";
import {
  filterRepairHistoryByDeviceNameKey,
  flattenRepairAppeals,
  groupListPreview,
  groupRepairHistoryByDeviceName,
  normalizeDeviceNameKey,
  removeRepairReportSectionAt,
  type RepairHistoryDeviceGroup,
  type RepairReportAppeal,
} from "../../shared/repairHistory/repairHistoryReports";
import "./HistoryPage.css";

const STATUS_LABELS: Record<IRepairHistory["status"], string> = {
  in_progress: "В процессе",
  success: "Успешно",
  failed: "Не удалось",
  cancelled: "Отменено",
};

const STATUS_OPTIONS: SelectOption<IRepairHistory["status"]>[] = (
  Object.keys(STATUS_LABELS) as IRepairHistory["status"][]
).map((value) => ({
  value,
  label: STATUS_LABELS[value],
}));

const formatDateTime = (value: Date | string) =>
  new Date(value).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const reportPath = (nameKey: string) =>
  `${RoutePath.history}/report/${encodeURIComponent(nameKey)}`;

const TrashIcon = () => (
  <svg
    className="history-page__trash-icon"
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

const HistoryListView = () => {
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.auth.user);

  const { data: records = [], isLoading, isError, error } = useGetRepairHistoryByUserIdQuery(
    user?.id ?? 0,
    { skip: !user?.id }
  );
  const { data: devices = [] } = useGetDevicesByUserIdQuery(user?.id ?? 0, { skip: !user?.id });
  const [deleteRepairHistory, { isLoading: isDeleting }] = useDeleteRepairHistoryMutation();

  const deviceGroups = useMemo(() => {
    const devicesById = new Map(devices.map((device) => [device.id, device]));
    return groupRepairHistoryByDeviceName(records, devicesById);
  }, [devices, records]);

  const empty = !isLoading && !isError && deviceGroups.length === 0;

  const handleDeleteGroup = async (
    event: MouseEvent,
    group: RepairHistoryDeviceGroup
  ) => {
    event.stopPropagation();
    if (!user?.id) return;

    const count = group.appealCount;
    const message =
      count === 1
        ? `Удалить отчёт «${group.deviceName}»?`
        : `Удалить отчёт «${group.deviceName}» и все ${count} обращения?`;

    if (!window.confirm(message)) return;

    try {
      await Promise.all(
        group.records.map((record) =>
          deleteRepairHistory({ id: record.id, userId: user.id }).unwrap()
        )
      );
    } catch {
      window.alert("Не удалось удалить отчёт. Попробуйте ещё раз.");
    }
  };

  return (
    <section className="history-page">
      <Card className="history-page__panel">
        <header className="history-page__header">
          <h1 className="history-page__title">История починок</h1>
          <p className="history-page__subtitle">
            Отчёты с одинаковым названием техники объединены в один
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

          {!isLoading && !isError && deviceGroups.length > 0 && (
            <ul className="history-page__list">
              {deviceGroups.map((group) => (
                <li key={group.nameKey}>
                  <div className="history-page__list-card">
                    <button
                      type="button"
                      className="history-page__list-item"
                      onClick={() => navigate(reportPath(group.nameKey))}
                    >
                      <span className="history-page__list-item-title">
                        {group.deviceName}
                      </span>
                      <span className="history-page__list-item-desc">
                        {groupListPreview(group)}
                      </span>
                      <span className="history-page__list-item-meta">
                        <span
                          className={`history-page__badge history-page__badge--${group.latestAppealStatus}`}
                        >
                          {STATUS_LABELS[group.latestAppealStatus]}
                        </span>
                        <span className="history-page__list-item-date">
                          {formatDateTime(group.latestAppealDate)}
                        </span>
                      </span>
                    </button>
                    <button
                      type="button"
                      className="history-page__list-delete"
                      disabled={isDeleting}
                      aria-label={`Удалить отчёт «${group.deviceName}»`}
                      title="Удалить отчёт"
                      onClick={(event) => void handleDeleteGroup(event, group)}
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>
    </section>
  );
};

const HistoryReportDetailView = () => {
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.auth.user);
  const { nameKey: nameKeyParam } = useParams<{ nameKey: string }>();
  const nameKey = nameKeyParam ? decodeURIComponent(nameKeyParam) : "";
  const validNameKey = nameKey.trim().length > 0;

  const { data: records = [], isLoading: isRecordsLoading } = useGetRepairHistoryByUserIdQuery(
    user?.id ?? 0,
    { skip: !user?.id }
  );
  const { data: devices = [] } = useGetDevicesByUserIdQuery(user?.id ?? 0, { skip: !user?.id });
  const [updateRepairHistory, { isLoading: isStatusUpdating }] =
    useUpdateRepairHistoryMutation();
  const [deleteRepairHistory, { isLoading: isDeleting }] = useDeleteRepairHistoryMutation();

  const devicesById = useMemo(
    () => new Map(devices.map((device) => [device.id, device])),
    [devices]
  );

  const deviceRecords = useMemo(
    () =>
      validNameKey
        ? filterRepairHistoryByDeviceNameKey(records, nameKey, devicesById)
        : [],
    [devicesById, nameKey, records, validNameKey]
  );

  const deviceName = useMemo(() => {
    if (deviceRecords.length === 0) return nameKey;
    const group = groupRepairHistoryByDeviceName(records, devicesById).find(
      (item) => item.nameKey === normalizeDeviceNameKey(nameKey)
    );
    return group?.deviceName ?? nameKey;
  }, [deviceRecords.length, devicesById, nameKey, records]);

  const appeals = useMemo(
    () => flattenRepairAppeals(deviceRecords),
    [deviceRecords]
  );

  const handleStatusChange = async (
    recordId: number,
    status: IRepairHistory["status"]
  ) => {
    if (!user?.id) return;

    const patch: Partial<IRepairHistory> = { status };
    if (status === "success" || status === "failed" || status === "cancelled") {
      patch.finished_at = new Date();
    } else if (status === "in_progress") {
      patch.finished_at = null;
    }

    try {
      await updateRepairHistory({ id: recordId, userId: user.id, patch }).unwrap();
    } catch {
      window.alert("Не удалось обновить статус.");
    }
  };

  const handleDeleteAppeal = async (appeal: RepairReportAppeal) => {
    if (!user?.id) return;
    if (!window.confirm("Удалить это обращение из отчёта?")) return;

    const record = deviceRecords.find((item) => item.id === appeal.repairHistoryId);
    if (!record) return;

    const nextNotes =
      appeal.chatId != null && appeal.messageId
        ? removeChatReportSection(record.result_notes, appeal.chatId, appeal.messageId)
        : removeRepairReportSectionAt(record.result_notes, appeal.sectionIndex);

    try {
      if (!nextNotes) {
        await deleteRepairHistory({ id: record.id, userId: user.id }).unwrap();
      } else {
        await updateRepairHistory({
          id: record.id,
          userId: user.id,
          patch: { result_notes: nextNotes },
        }).unwrap();
      }

      const remainingAppeals = appeals.filter(
        (item) =>
          !(
            item.repairHistoryId === appeal.repairHistoryId &&
            item.sectionIndex === appeal.sectionIndex
          )
      );
      if (remainingAppeals.length === 0) {
        navigate(RoutePath.history);
      }
    } catch {
      window.alert("Не удалось удалить обращение.");
    }
  };

  const handleDeleteAll = async () => {
    if (!user?.id || deviceRecords.length === 0) return;

    const message =
      appeals.length === 1
        ? `Удалить отчёт «${deviceName}»?`
        : `Удалить отчёт «${deviceName}» и все ${appeals.length} обращения?`;

    if (!window.confirm(message)) return;

    try {
      await Promise.all(
        deviceRecords.map((record) =>
          deleteRepairHistory({ id: record.id, userId: user.id }).unwrap()
        )
      );
      navigate(RoutePath.history);
    } catch {
      window.alert("Не удалось удалить отчёт.");
    }
  };

  return (
    <section className="history-page">
      <Card className="history-page__panel history-page__panel--detail">
        <div className="history-page__detail-toolbar">
          <Button variant="ghost" type="button" onClick={() => navigate(RoutePath.history)}>
            ← К списку починок
          </Button>
          {deviceRecords.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              className="history-page__delete-btn history-page__delete-btn--toolbar"
              disabled={isDeleting}
              onClick={() => void handleDeleteAll()}
            >
              Удалить отчёт
            </Button>
          )}
        </div>

        {!validNameKey && (
          <p className="history-page__error" role="alert">
            Некорректная ссылка на отчёт.
          </p>
        )}

        {validNameKey && isRecordsLoading && (
          <p className="history-page__hint">Загрузка…</p>
        )}

        {validNameKey && !isRecordsLoading && deviceRecords.length === 0 && (
          <p className="history-page__empty">Записи для этой техники не найдены.</p>
        )}

        {validNameKey && deviceRecords.length > 0 && (
          <>
            <header className="history-page__header history-page__header--detail">
              <h1 className="history-page__title">{deviceName}</h1>
              <p className="history-page__subtitle">
                {appeals.length === 1
                  ? "1 обращение к помощнику"
                  : `${appeals.length} обращения к помощнику`}
              </p>
            </header>

            <div className="history-page__entries">
              {appeals.map((appeal, index) => (
                <article
                  key={`${appeal.repairHistoryId}-${appeal.sectionIndex}`}
                  className="history-page__entry"
                >
                  <div className="history-page__entry-head">
                    <div className="history-page__entry-meta">
                      <span className="history-page__entry-label">
                        {appeals.length > 1
                          ? `Обращение ${appeals.length - index}`
                          : "Обращение"}
                      </span>
                      <time className="history-page__entry-date">
                        {formatDateTime(appeal.date)}
                      </time>
                    </div>
                    <div className="history-page__entry-actions">
                      <Select
                        className="history-page__status-select"
                        aria-label={`Статус обращения от ${formatDateTime(appeal.date)}`}
                        options={STATUS_OPTIONS}
                        value={appeal.record.status}
                        disabled={isStatusUpdating || isDeleting}
                        onChange={(status) =>
                          void handleStatusChange(appeal.repairHistoryId, status)
                        }
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        className="history-page__delete-btn"
                        disabled={isDeleting}
                        onClick={() => void handleDeleteAppeal(appeal)}
                      >
                        Удалить
                      </Button>
                    </div>
                  </div>

                  {appeal.markdown && (
                    <div className="history-page__report markdown-body">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {appeal.markdown}
                      </ReactMarkdown>
                    </div>
                  )}
                </article>
              ))}
            </div>
          </>
        )}
      </Card>
    </section>
  );
};

/** Старые ссылки /history/:id перенаправляют на отчёт по названию техники */
const LegacyRepairRedirect = () => {
  const navigate = useNavigate();
  const { repairId } = useParams<{ repairId: string }>();
  const id = repairId ? Number.parseInt(repairId, 10) : NaN;
  const validId = Number.isFinite(id) && id > 0;

  const user = useAppSelector((s) => s.auth.user);
  const { data: record, isLoading, isError } = useGetRepairHistoryByIdQuery(id, {
    skip: !validId,
  });
  const { data: devices = [] } = useGetDevicesByUserIdQuery(user?.id ?? 0, {
    skip: !user?.id || !record?.device_id,
  });

  useEffect(() => {
    if (!record) return;
    const device = devices.find((item) => item.id === record.device_id);
    if (!device) return;

    const nameKey = normalizeDeviceNameKey(formatDeviceName(device));
    navigate(reportPath(nameKey), { replace: true });
  }, [devices, navigate, record]);

  if (!validId) {
    return (
      <section className="history-page">
        <Card className="history-page__panel">
          <p className="history-page__error" role="alert">
            Некорректная ссылка на запись.
          </p>
        </Card>
      </section>
    );
  }

  if (isLoading) {
    return (
      <section className="history-page">
        <Card className="history-page__panel">
          <p className="history-page__hint">Загрузка…</p>
        </Card>
      </section>
    );
  }

  if (isError || !record) {
    return (
      <section className="history-page">
        <Card className="history-page__panel">
          <p className="history-page__error" role="alert">
            Запись не найдена или недоступна.
          </p>
        </Card>
      </section>
    );
  }

  return (
    <section className="history-page">
      <Card className="history-page__panel">
        <p className="history-page__hint">Переход к отчёту…</p>
      </Card>
    </section>
  );
};

/** Старые ссылки /history/device/:id → отчёт по названию техники */
const LegacyDeviceIdRedirect = () => {
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.auth.user);
  const { deviceId: deviceIdParam } = useParams<{ deviceId: string }>();
  const deviceId = deviceIdParam ? Number.parseInt(deviceIdParam, 10) : NaN;

  const { data: devices = [], isLoading } = useGetDevicesByUserIdQuery(user?.id ?? 0, {
    skip: !user?.id,
  });

  useEffect(() => {
    const device = devices.find((item) => item.id === deviceId);
    if (!device) return;
    navigate(reportPath(normalizeDeviceNameKey(formatDeviceName(device))), {
      replace: true,
    });
  }, [deviceId, devices, navigate]);

  if (isLoading) {
    return (
      <section className="history-page">
        <Card className="history-page__panel">
          <p className="history-page__hint">Загрузка…</p>
        </Card>
      </section>
    );
  }

  return (
    <section className="history-page">
      <Card className="history-page__panel">
        <p className="history-page__hint">Переход к отчёту…</p>
      </Card>
    </section>
  );
};

const HistoryPage = () => (
  <Routes>
    <Route index element={<HistoryListView />} />
    <Route path="report/:nameKey" element={<HistoryReportDetailView />} />
    <Route path="device/:deviceId" element={<LegacyDeviceIdRedirect />} />
    <Route path=":repairId" element={<LegacyRepairRedirect />} />
  </Routes>
);

export default HistoryPage;
