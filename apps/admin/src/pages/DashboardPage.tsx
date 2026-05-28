import { useGetAdminStatsQuery } from "../shared/api/adminApi";
import type { RepairStatus } from "../shared/types";

const repairStatusLabels: Record<RepairStatus, string> = {
  in_progress: "В процессе",
  success: "Успешно",
  failed: "Неудачно",
  cancelled: "Отменено",
};

const formatPercent = (value: number) => `${Math.round(value * 100)}%`;

export const DashboardPage = () => {
  const { data: stats, isLoading, isError, refetch } = useGetAdminStatsQuery();

  if (isLoading) {
    return <div className="state">Загрузка статистики...</div>;
  }

  if (isError || !stats) {
    return (
      <div className="state state--error">
        <p>Не удалось загрузить статистику.</p>
        <button type="button" className="button" onClick={() => refetch()}>
          Повторить
        </button>
      </div>
    );
  }

  const maxSkillUsers = Math.max(
    ...stats.users.bySkillLevel.map((level) => level.usersCount),
    1
  );
  const maxRepairStatus = Math.max(
    ...Object.values(stats.repairHistory.byStatus),
    1
  );

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Обзор системы</p>
          <h1>Статистика</h1>
        </div>
        <button type="button" className="button" onClick={() => refetch()}>
          Обновить
        </button>
      </header>

      <div className="metric-grid">
        <article className="metric-card">
          <span>Пользователей</span>
          <strong>{stats.users.total}</strong>
          <small>+{stats.users.last7Days} за 7 дней</small>
        </article>
        <article className="metric-card">
          <span>Чатов</span>
          <strong>{stats.chats.total}</strong>
          <small>{stats.chats.activeLast7Days} активных за 7 дней</small>
        </article>
        <article className="metric-card">
          <span>Сообщений</span>
          <strong>{stats.chats.messagesTotal}</strong>
          <small>{stats.chats.avgMessagesPerChat} в среднем на чат</small>
        </article>
        <article className="metric-card">
          <span>Успешность ремонтов</span>
          <strong>{formatPercent(stats.repairHistory.successRate)}</strong>
          <small>{stats.repairHistory.total} записей в журнале</small>
        </article>
      </div>

      <div className="dashboard-grid">
        <article className="panel">
          <h2>Пользователи по уровню навыков</h2>
          <div className="bar-list">
            {stats.users.bySkillLevel.map((level) => (
              <div className="bar-row" key={level.skillLevelId}>
                <span>{level.name}</span>
                <div className="bar">
                  <span
                    style={{
                      width: `${(level.usersCount / maxSkillUsers) * 100}%`,
                    }}
                  />
                </div>
                <strong>{level.usersCount}</strong>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <h2>Статусы починок</h2>
          <div className="bar-list">
            {Object.entries(stats.repairHistory.byStatus).map(([status, count]) => (
              <div className="bar-row" key={status}>
                <span>{repairStatusLabels[status as RepairStatus]}</span>
                <div className="bar bar--accent">
                  <span style={{ width: `${(count / maxRepairStatus) * 100}%` }} />
                </div>
                <strong>{count}</strong>
              </div>
            ))}
          </div>
        </article>
      </div>

      <article className="panel">
        <h2>Самые активные пользователи</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Пользователь</th>
                <th>Уровень</th>
                <th>Чаты</th>
                <th>Сообщения</th>
                <th>История</th>
                <th>Успешно</th>
              </tr>
            </thead>
            <tbody>
              {stats.topUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    <strong>{user.fullName}</strong>
                    <small>{user.email}</small>
                  </td>
                  <td>{user.skillLevelName}</td>
                  <td>{user.chatsCount}</td>
                  <td>{user.messagesCount}</td>
                  <td>{user.repairHistoryCount}</td>
                  <td>{user.successfulRepairsCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
};
