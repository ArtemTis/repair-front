import { FormEvent, useEffect, useMemo, useState } from "react";
import { skipToken } from "@reduxjs/toolkit/query";
import {
  useAddUserToolMutation,
  useCreateToolMutation,
  useDeleteUserToolMutation,
  useGetRepairGuidesByUserIdQuery,
  useGetRepairHistoryByUserIdQuery,
  useGetSkillsQuery,
  useGetToolsQuery,
  useGetUserByIdQuery,
  useGetUserToolsByUserIdQuery,
  useUpdateUserMutation,
  useUpdateUserToolQuantityMutation,
} from "../../shared/api/api";
import { setCurrentUser } from "../../shared/store/authSlice";
import { useAppDispatch, useAppSelector } from "../../shared/store/hooks";
import { IRepairHistory } from "../../shared/types";
import { Button, Card, Select, TextInput } from "../../shared/ui";
import "./ProfilePage.css";

const statusLabels: Record<IRepairHistory["status"], string> = {
  in_progress: "В работе",
  success: "Успешно",
  failed: "Не удалось",
  cancelled: "Отменено",
};

const ProfilePage = () => {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.user);
  const userId = currentUser?.id;
  const queryUserId = userId ?? skipToken;

  const { data: user } = useGetUserByIdQuery(queryUserId);
  const { data: skills = [] } = useGetSkillsQuery();
  const { data: tools = [] } = useGetToolsQuery();
  const { data: userTools = [] } = useGetUserToolsByUserIdQuery(queryUserId);
  const { data: repairGuides = [] } = useGetRepairGuidesByUserIdQuery(queryUserId);
  const { data: repairHistory = [] } = useGetRepairHistoryByUserIdQuery(queryUserId);

  const [updateUser, { isLoading: isSkillUpdating }] = useUpdateUserMutation();
  const [addUserTool, { isLoading: isAddingTool }] = useAddUserToolMutation();
  const [updateToolQuantity] = useUpdateUserToolQuantityMutation();
  const [deleteUserTool] = useDeleteUserToolMutation();
  const [createTool, { isLoading: isCreatingTool }] = useCreateToolMutation();

  const displayUser = user ?? currentUser;
  const activeSkill = skills.find((skill) => skill.id === displayUser?.skill_level_id);
  const [selectedToolId, setSelectedToolId] = useState<number>(0);
  const [toolQuantity, setToolQuantity] = useState(1);
  const [newToolName, setNewToolName] = useState("");
  const [newToolDescription, setNewToolDescription] = useState("");
  const [formMessage, setFormMessage] = useState("");

  useEffect(() => {
    if (tools.length > 0 && selectedToolId === 0) {
      setSelectedToolId(tools[0].id);
    }
  }, [selectedToolId, tools]);

  const inventory = useMemo(
    () =>
      userTools.map((item) => ({
        ...item,
        tool: tools.find((tool) => tool.id === item.tool_id),
      })),
    [tools, userTools]
  );

  const toolOptions = useMemo(
    () => tools.map((tool) => ({ value: tool.id, label: tool.name })),
    [tools]
  );

  const repairStats = useMemo(() => {
    const success = repairHistory.filter((item) => item.status === "success").length;
    const inProgress = repairHistory.filter((item) => item.status === "in_progress").length;
    const failed = repairHistory.filter((item) => item.status === "failed").length;

    return {
      requests: repairGuides.length,
      repairs: repairHistory.length,
      success,
      inProgress,
      failed,
    };
  }, [repairGuides.length, repairHistory]);

  if (!displayUser || !userId) {
    return null;
  }

  const handleSkillChange = async (skillLevelId: number) => {
    setFormMessage("");
    try {
      const updatedUser = await updateUser({
        id: userId,
        patch: { skill_level_id: skillLevelId },
      }).unwrap();
      dispatch(setCurrentUser(updatedUser));
      setFormMessage("Уровень навыков обновлён.");
    } catch {
      setFormMessage("Не удалось обновить уровень навыков.");
    }
  };

  const handleAddExistingTool = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormMessage("");

    if (!selectedToolId) {
      setFormMessage("Выберите инструмент из списка.");
      return;
    }

    try {
      await addUserTool({
        user_id: userId,
        tool_id: selectedToolId,
        quantity: Math.max(1, toolQuantity),
      }).unwrap();
      setToolQuantity(1);
      setFormMessage("Инструмент добавлен в инвентарь.");
    } catch {
      setFormMessage("Не удалось добавить инструмент.");
    }
  };

  const handleCreateAndAddTool = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormMessage("");

    if (!newToolName.trim()) {
      setFormMessage("Введите название нового инструмента.");
      return;
    }

    try {
      const createdTool = await createTool({
        name: newToolName.trim(),
        description: newToolDescription.trim() || null,
      }).unwrap();

      await addUserTool({
        user_id: userId,
        tool_id: createdTool.id,
        quantity: 1,
      }).unwrap();

      setNewToolName("");
      setNewToolDescription("");
      setFormMessage("Новый инструмент создан и добавлен.");
    } catch {
      setFormMessage("Не удалось создать инструмент.");
    }
  };

  const handleQuantityChange = async (toolId: number, quantity: number) => {
    const normalizedQuantity = Math.max(0, quantity);

    try {
      if (normalizedQuantity === 0) {
        await deleteUserTool({ userId, toolId }).unwrap();
        return;
      }

      await updateToolQuantity({
        userId,
        toolId,
        quantity: normalizedQuantity,
      }).unwrap();
    } catch {
      setFormMessage("Не удалось обновить количество инструмента.");
    }
  };

  const handleRemoveTool = async (toolId: number) => {
    setFormMessage("");
    try {
      await deleteUserTool({ userId, toolId }).unwrap();
      setFormMessage("Инструмент удалён из инвентаря.");
    } catch {
      setFormMessage("Не удалось удалить инструмент.");
    }
  };

  return (
    <section className="profile-page">
      <div className="profile-page__hero">
        <div>
          <p className="profile-page__eyebrow">Профиль пользователя</p>
          <h1 className="profile-page__title">{displayUser.full_name}</h1>
          <p className="profile-page__subtitle">{displayUser.email}</p>
        </div>
        <div className="profile-page__avatar" aria-hidden="true">
          {displayUser.full_name.slice(0, 2).toUpperCase()}
        </div>
      </div>

      <div className="profile-grid">
        <Card className="profile-card profile-card--wide">
          <div className="profile-card__header">
            <div>
              <h2 className="profile-card__title">Уровень навыков</h2>
              <p className="profile-card__text">
                Текущий уровень: {activeSkill?.name ?? "не выбран"}
              </p>
            </div>
          </div>

          <div className="skill-list">
            {skills.map((skill) => (
              <button
                key={skill.id}
                className={`skill-chip ${
                  skill.id === displayUser.skill_level_id ? "is-active" : ""
                }`}
                type="button"
                disabled={isSkillUpdating}
                onClick={() => handleSkillChange(skill.id)}
              >
                <span>{skill.name}</span>
                <small>{skill.description}</small>
              </button>
            ))}
          </div>
        </Card>

        <Card className="profile-card">
          <h2 className="profile-card__title">Статистика</h2>
          <div className="stats-grid">
            <div className="stat-item">
              <strong>{repairStats.requests}</strong>
              <span>Запросов</span>
            </div>
            <div className="stat-item">
              <strong>{repairStats.repairs}</strong>
              <span>Починок</span>
            </div>
            <div className="stat-item">
              <strong>{repairStats.success}</strong>
              <span>Успешно</span>
            </div>
            <div className="stat-item">
              <strong>{repairStats.inProgress}</strong>
              <span>В работе</span>
            </div>
          </div>
        </Card>

        <Card className="profile-card profile-card--wide">
          <div className="profile-card__header">
            <div>
              <h2 className="profile-card__title">Инвентарь инструментов</h2>
              <p className="profile-card__text">
                Добавляйте готовые инструменты или создавайте новые позиции.
              </p>
            </div>
          </div>

          <form className="inventory-form" onSubmit={handleAddExistingTool}>
            <Select
              aria-label="Инструмент для добавления"
              options={toolOptions}
              value={selectedToolId}
              onChange={setSelectedToolId}
            />
            <TextInput
              min={1}
              type="number"
              value={toolQuantity}
              onChange={(event) => setToolQuantity(Number(event.target.value))}
            />
            <Button type="submit" disabled={isAddingTool || tools.length === 0}>
              Добавить
            </Button>
          </form>

          <form className="inventory-form inventory-form--new" onSubmit={handleCreateAndAddTool}>
            <TextInput
              value={newToolName}
              onChange={(event) => setNewToolName(event.target.value)}
              placeholder="Новый инструмент"
            />
            <TextInput
              value={newToolDescription}
              onChange={(event) => setNewToolDescription(event.target.value)}
              placeholder="Описание"
            />
            <Button type="submit" variant="ghost" disabled={isCreatingTool}>
              Создать
            </Button>
          </form>

          {formMessage && <p className="profile-message">{formMessage}</p>}

          <div className="inventory-list">
            {inventory.length === 0 ? (
              <p className="profile-empty">В инвентаре пока нет инструментов.</p>
            ) : (
              inventory.map((item) => (
                <div className="inventory-item" key={item.tool_id}>
                  <div>
                    <strong>{item.tool?.name ?? `Инструмент #${item.tool_id}`}</strong>
                    {item.tool?.description && <span>{item.tool.description}</span>}
                  </div>
                  <div className="inventory-item__actions">
                    <TextInput
                      min={0}
                      type="number"
                      value={item.quantity}
                      onChange={(event) =>
                        handleQuantityChange(item.tool_id, Number(event.target.value))
                      }
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => handleRemoveTool(item.tool_id)}
                    >
                      Убрать
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="profile-card">
          <h2 className="profile-card__title">Последние починки</h2>
          <div className="repair-list">
            {repairHistory.length === 0 ? (
              <p className="profile-empty">История починок пока пустая.</p>
            ) : (
              repairHistory.slice(0, 5).map((repair) => (
                <div className="repair-item" key={repair.id}>
                  <strong>{repair.issue_description}</strong>
                  <span>{statusLabels[repair.status]}</span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </section>
  );
};

export default ProfilePage;
