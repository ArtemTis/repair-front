import { ChangeEvent, useMemo, useState } from "react";
import {
  useGetAdminUsersQuery,
  useGetSkillLevelsQuery,
  useUpdateUserSkillLevelMutation,
} from "../shared/api/adminApi";

const formatDate = (date: string) =>
  new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));

export const UsersPage = () => {
  const [search, setSearch] = useState("");
  const [selectedSkillLevel, setSelectedSkillLevel] = useState("all");

  const {
    data: users = [],
    isLoading: isUsersLoading,
    isError: isUsersError,
    refetch,
  } = useGetAdminUsersQuery();
  const { data: skillLevels = [] } = useGetSkillLevelsQuery();
  const [updateSkillLevel, { isLoading: isUpdating }] =
    useUpdateUserSkillLevelMutation();

  const filteredUsers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        !normalizedSearch ||
        user.fullName.toLowerCase().includes(normalizedSearch) ||
        user.email.toLowerCase().includes(normalizedSearch);
      const matchesSkillLevel =
        selectedSkillLevel === "all" ||
        user.skillLevelId === Number(selectedSkillLevel);

      return matchesSearch && matchesSkillLevel;
    });
  }, [search, selectedSkillLevel, users]);

  const handleSkillLevelChange =
    (userId: number) => async (event: ChangeEvent<HTMLSelectElement>) => {
      await updateSkillLevel({
        userId,
        skillLevelId: Number(event.target.value),
      }).unwrap();
    };

  if (isUsersLoading) {
    return <div className="state">Загрузка пользователей...</div>;
  }

  if (isUsersError) {
    return (
      <div className="state state--error">
        <p>Не удалось загрузить пользователей.</p>
        <button type="button" className="button" onClick={() => refetch()}>
          Повторить
        </button>
      </div>
    );
  }

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Модерация</p>
          <h1>Пользователи</h1>
        </div>
        <button type="button" className="button" onClick={() => refetch()}>
          Обновить
        </button>
      </header>

      <div className="filters">
        <label>
          Поиск
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Имя или email"
          />
        </label>
        <label>
          Уровень навыков
          <select
            value={selectedSkillLevel}
            onChange={(event) => setSelectedSkillLevel(event.target.value)}
          >
            <option value="all">Все уровни</option>
            {skillLevels.map((level) => (
              <option key={level.id} value={level.id}>
                {level.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <article className="panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Пользователь</th>
                <th>Уровень навыков</th>
                <th>Устройства</th>
                <th>Чаты</th>
                <th>Сообщения</th>
                <th>Починки</th>
                <th>Регистрация</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    <strong>{user.fullName}</strong>
                    <small>{user.email}</small>
                  </td>
                  <td>
                    <select
                      value={user.skillLevelId}
                      disabled={isUpdating}
                      onChange={handleSkillLevelChange(user.id)}
                    >
                      {skillLevels.map((level) => (
                        <option key={level.id} value={level.id}>
                          {level.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>{user.devicesCount}</td>
                  <td>{user.chatsCount}</td>
                  <td>{user.messagesCount}</td>
                  <td>
                    {user.repairHistoryCount}
                    <small>{user.successfulRepairsCount} успешно</small>
                  </td>
                  <td>{formatDate(user.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <p className="empty">Пользователи по текущим фильтрам не найдены.</p>
        )}
      </article>
    </section>
  );
};
