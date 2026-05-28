import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import ChatInput, { type PendingRepairChatAttachment } from "./components/ChatInput";
import ChatMessages from "./components/ChatMessages";
import type { ChatMessage } from "./types";
import "./ChatPage.css";
import { captionForRepairChatTitle, dataUrlFromStored, parseRepairAssistantStoredMessage, serializeRepairUserMessageForPersistence, type RepairStoredAttachment } from "../../shared/chat/repairAssistantEnvelope";
import { askAIagent, stripBase64DataUrlPayload } from "../../shared/api/ai";
import { chatMessagesToRepairHistory } from "./chatRepairHistory";
import { Card, TextInput, Button } from "../../shared/ui";
import { useAppSelector } from "../../shared/store/hooks";
import {
  useAddAssistantChatMessageMutation,
  useCreateAssistantChatMutation,
  useDeleteAssistantChatMutation,
  useGetAssistantChatByIdQuery,
  useGetAssistantChatsByUserIdQuery,
  useUpdateAssistantChatMutation,
} from "../../shared/api/assistantChatsApi";
import {
  useCreateDeviceMutation,
  useGetDevicesByUserIdQuery,
} from "../../shared/api/deviceApi";
import {
  useCreateRepairHistoryMutation,
  useDeleteRepairHistoryMutation,
  useGetRepairHistoryByUserIdQuery,
  useUpdateRepairHistoryMutation,
} from "../../shared/api/repairHistoryApi";
import { useGetSkillsQuery } from "../../shared/api/skillsApi";
import { useGetToolsQuery } from "../../shared/api/toolsApi";
import { useGetUserToolsByUserIdQuery } from "../../shared/api/userToolsApi";
import type { IAssistantChat, IAssistantChatMessage } from "../../shared/types";
import {
  AI_DETECTED_DEVICE_MODEL,
  formatDeviceName,
} from "../../shared/repairHistory/deviceDisplay";
import {
  getSavedChatReportLinks,
  removeChatReportSection,
  withChatReportRef,
} from "../../shared/repairHistory/chatReportLink";
import {
  appendRepairReportSection,
  repairRecordsShareDeviceName,
} from "../../shared/repairHistory/repairHistoryReports";
import { EMPTY_ARRAY } from "../../shared/lib/emptyArray";

const createTime = () =>
  new Date().toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });

const formatChatDate = (value: string) =>
  new Date(value).toLocaleString("ru-RU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

const titleFromText = (apiMessageText: string) => {
  const captionLine = captionForRepairChatTitle(apiMessageText).trim().split(/\r?\n/)[0] ?? "";
  if (!captionLine) return "Новый чат";
  return captionLine.length > 72 ? `${captionLine.slice(0, 72)}...` : captionLine;
};

const mapMessage = (message: IAssistantChatMessage): ChatMessage => {
  const timestamp = new Date(message.created_at).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const id = String(message.id);

  if (message.author !== "me") {
    return {
      id,
      author: "companion",
      text: message.text,
      timestamp,
    };
  }

  const raw = message.text;
  const parsed = parseRepairAssistantStoredMessage(raw);
  const env = parsed.envelope;

  return {
    id,
    author: "me",
    text: env ? (env.text ?? "") : raw,
    persistedText: raw,
    timestamp,
    attachments: env?.attachments?.map((a) => ({
      kind: a.kind === "audio" ? "audio" as const : "image" as const,
      dataUrl: dataUrlFromStored(a),
    })),
  };
};

function pendingRepairAudioFormat(file: PendingRepairChatAttachment): "mp3" | "wav" {
  const mime = file.mimeType.toLowerCase();
  if (mime.includes("mpeg") || mime.includes("mp3")) return "mp3";
  return "wav";
}

function pendingToRepairStoredAttachment(file: PendingRepairChatAttachment): RepairStoredAttachment {
  const base64 = stripBase64DataUrlPayload(file.dataUrl);
  if (file.kind === "image") {
    return {
      kind: "image",
      mimeType: file.mimeType.startsWith("image/") ? file.mimeType : "image/jpeg",
      base64,
    };
  }
  return {
    kind: "audio",
    format: pendingRepairAudioFormat(file),
    base64,
  };
}

const createCompanionBubble = (text: string): ChatMessage => ({
  id: `${Date.now()}-companion-${Math.random().toString(16).slice(2)}`,
  text,
  author: "companion",
  timestamp: createTime(),
});

type ReportSaveStatus = "idle" | "saving" | "saved" | "error";

type ReportSaveEntry = {
  status: ReportSaveStatus;
  repairHistoryId?: number;
};

const areReportSaveStatusesEqual = (
  current: Record<string, ReportSaveEntry>,
  next: Record<string, ReportSaveEntry>
) => {
  const currentKeys = Object.keys(current);
  const nextKeys = Object.keys(next);

  if (currentKeys.length !== nextKeys.length) {
    return false;
  }

  return nextKeys.every((key) => {
    const currentEntry = current[key];
    const nextEntry = next[key];

    return (
      currentEntry?.status === nextEntry.status &&
      currentEntry?.repairHistoryId === nextEntry.repairHistoryId
    );
  });
};

const cleanMarkdownText = (value: string) =>
  value
    .replace(/[#*_`>~|-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const firstMeaningfulLine = (value: string, fallback: string) => {
  const line = value
    .split(/\r?\n/)
    .map((item) => cleanMarkdownText(item))
    .find(Boolean);
  if (!line) return fallback;
  return line.length > 180 ? `${line.slice(0, 180)}...` : line;
};

const extractDeviceNameFromAssistantAnswer = (text: string): string | null => {
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine
      .replace(/^[\s#>*_\-`]+/, "")
      .replace(/[*_`]+/g, "")
      .trim();
    const match = line.match(/^название\s+техники\s*[:—-]\s*(.+)$/i);
    if (!match) continue;

    const name = cleanMarkdownText(match[1]);
    if (!name || /^не\s+определ/i.test(name)) {
      return null;
    }

    return name.length > 120 ? `${name.slice(0, 120)}...` : name;
  }

  return null;
};

const inferDeviceType = (text: string) => {
  const normalized = text.toLowerCase();
  const knownTypes = [
    "стиральная машина",
    "посудомоечная машина",
    "холодильник",
    "микроволновка",
    "телевизор",
    "ноутбук",
    "компьютер",
    "смартфон",
    "пылесос",
    "утюг",
    "чайник",
    "принтер",
  ];
  return knownTypes.find((item) => normalized.includes(item)) ?? "Неизвестная техника";
};

const extractRelevantLines = (text: string, keywords: string[]) => {
  const lines = text
    .split(/\r?\n/)
    .map((line) => cleanMarkdownText(line))
    .filter(Boolean);
  const matched = lines.filter((line) => {
    const lower = line.toLowerCase();
    return keywords.some((keyword) => lower.includes(keyword));
  });
  return matched.slice(0, 6);
};

const buildRepairReportNotes = (
  deviceName: string,
  issue: string,
  assistantAnswer: string,
  userMessages: ChatMessage[],
  chatTitle: string
) => {
  const warnings = extractRelevantLines(assistantAnswer, [
    "опас",
    "вниман",
    "предупреж",
    "отключ",
    "напряж",
    "ток",
    "сервис",
    "мастер",
  ]);
  const tools = extractRelevantLines(assistantAnswer, [
    "инструмент",
    "отвертк",
    "мультиметр",
    "ключ",
    "пассатиж",
    "паяль",
    "купить",
    "одолжить",
  ]);
  const userRequests = userMessages
    .map((message) => message.text.trim())
    .filter(Boolean)
    .join("\n\n");

  return [
    `# Отчет из чата: ${chatTitle}`,
    "",
    "## Что сломалось",
    issue,
    "",
    "## Техника",
    deviceName,
    "",
    "## Предупреждения",
    warnings.length > 0
      ? warnings.map((line) => `- ${line}`).join("\n")
      : "Отдельные предупреждения не выделены автоматически. Проверьте полный ответ помощника ниже.",
    "",
    "## Инструменты",
    tools.length > 0
      ? tools.map((line) => `- ${line}`).join("\n")
      : "Отдельный список инструментов не выделен автоматически. Проверьте полный ответ помощника ниже.",
    "",
    "## Запросы пользователя",
    userRequests || "Текстовые запросы отсутствовали.",
    "",
    "## Ответ помощника",
    assistantAnswer,
  ].join("\n");
};

const ChatPage = () => {
  const currentUser = useAppSelector((state) => state.auth.user);
  const userId = currentUser?.id;

  const {
    data: chats = EMPTY_ARRAY,
    isLoading: isChatsLoading,
    isError: isChatsError,
    refetch: refetchChats,
  } = useGetAssistantChatsByUserIdQuery(userId ?? 0, { skip: !userId });
  const { data: skills = EMPTY_ARRAY } = useGetSkillsQuery();
  const { data: tools = EMPTY_ARRAY } = useGetToolsQuery();
  const { data: userTools = EMPTY_ARRAY } = useGetUserToolsByUserIdQuery(userId ?? 0, { skip: !userId });
  const { data: devices = EMPTY_ARRAY } = useGetDevicesByUserIdQuery(userId ?? 0, { skip: !userId });
  const { data: repairHistory = EMPTY_ARRAY } = useGetRepairHistoryByUserIdQuery(userId ?? 0, {
    skip: !userId,
  });

  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [pendingAttachments, setPendingAttachments] = useState<PendingRepairChatAttachment[]>([]);
  const [isAwaitingResponse, setIsAwaitingResponse] = useState(false);
  const [reportSaveStatuses, setReportSaveStatuses] = useState<Record<string, ReportSaveEntry>>({});
  const messagesRef = useRef<HTMLDivElement | null>(null);

  const {
    data: activeChat,
    isError: isActiveChatError,
  } = useGetAssistantChatByIdQuery(activeChatId ?? 0, { skip: !activeChatId });

  const [createAssistantChat, { isLoading: isCreatingChat }] = useCreateAssistantChatMutation();
  const [addAssistantChatMessage] = useAddAssistantChatMessageMutation();
  const [updateAssistantChat] = useUpdateAssistantChatMutation();
  const [deleteAssistantChat] = useDeleteAssistantChatMutation();
  const [createDevice] = useCreateDeviceMutation();
  const [createRepairHistory] = useCreateRepairHistoryMutation();
  const [updateRepairHistory] = useUpdateRepairHistoryMutation();
  const [deleteRepairHistory] = useDeleteRepairHistoryMutation();

  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [renameDraft, setRenameDraft] = useState("");

  const sortedChats = useMemo(
    () => [...chats].sort((a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at)),
    [chats]
  );
  const activeSkill = useMemo(
    () => skills.find((skill) => skill.id === currentUser?.skill_level_id),
    [currentUser?.skill_level_id, skills]
  );
  const assistantContext = useMemo(
    () => ({
      skillLevelName: activeSkill?.name,
      skillLevelDescription: activeSkill?.description,
      tools: userTools.map((item) => {
        const tool = tools.find((candidate) => candidate.id === item.tool_id);
        return {
          name: tool?.name ?? `Инструмент #${item.tool_id}`,
          quantity: item.quantity,
          description: tool?.description,
        };
      }),
    }),
    [activeSkill?.description, activeSkill?.name, tools, userTools]
  );
  // При activeChatId === null запрос пропускается, но RTK Query может кратко держать
  // кэш предыдущего чата в `data` — заголовок должен явно зависеть от выбранного id.
  const activeTitle =
    activeChatId != null ? (activeChat?.title ?? "Новый чат") : "Новый чат";

  const canSend = useMemo(
    () =>
      (inputValue.trim().length > 0 || pendingAttachments.length > 0) &&
      !isAwaitingResponse &&
      !isCreatingChat,
    [inputValue, pendingAttachments.length, isAwaitingResponse, isCreatingChat]
  );

  useEffect(() => {
    if (!activeChatId) {
      setMessages((prev) => (prev.length === 0 ? prev : []));
      return;
    }

    if (activeChat) {
      setMessages(activeChat.messages.map(mapMessage));
    }
  }, [activeChatId, activeChat]);

  useEffect(() => {
    if (!activeChatId) {
      setReportSaveStatuses((prev) => (Object.keys(prev).length === 0 ? prev : {}));
      return;
    }

    const savedLinks = getSavedChatReportLinks(repairHistory, activeChatId);

    setReportSaveStatuses((prev) => {
      const next: Record<string, ReportSaveEntry> = {};

      for (const message of messages) {
        if (message.author !== "companion" || message.omitFromAiHistory) continue;

        const link = savedLinks.get(message.id);
        if (link) {
          next[message.id] = { status: "saved", repairHistoryId: link.repairHistoryId };
        } else if (prev[message.id]?.status === "saving") {
          next[message.id] = prev[message.id];
        } else {
          next[message.id] = { status: "idle" };
        }
      }

      return areReportSaveStatusesEqual(prev, next) ? prev : next;
    });
  }, [activeChatId, messages, repairHistory]);

  const handleNewChatClick = () => {
    if (isAwaitingResponse) return;
    setRenamingId(null);
    setRenameDraft("");
    setActiveChatId(null);
    setMessages([]);
    setInputValue("");
    setPendingAttachments([]);
    setReportSaveStatuses({});
  };

  const handleSendMessage = async () => {
    const captionText = inputValue.trim();
    if ((!captionText && pendingAttachments.length === 0) || isAwaitingResponse || isCreatingChat || !userId) {
      return;
    }

    const storedAttachments = pendingAttachments.map(pendingToRepairStoredAttachment);

    const userApiText =
      pendingAttachments.length === 0
        ? captionText
        : serializeRepairUserMessageForPersistence(captionText, storedAttachments);

    const userMessage: ChatMessage = {
      id: `${Date.now()}-me-${Math.random().toString(16).slice(2)}`,
      author: "me",
      text: captionText,
      persistedText: userApiText,
      timestamp: createTime(),
      attachments: pendingAttachments.map((p) => ({
        kind: p.kind === "audio" ? "audio" as const : "image" as const,
        dataUrl: p.dataUrl,
      })),
    };

    const historyPrior = [...messages];
    const userTurnForApi = {
      role: "user" as const,
      caption: captionText,
      attachments: storedAttachments,
    };

    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInputValue("");
    setPendingAttachments([]);
    setIsAwaitingResponse(true);

    try {
      let chatId = activeChatId;

      if (!chatId) {
        const createdChat = await createAssistantChat({
          user_id: userId,
          title: titleFromText(userApiText),
          messages: [{ author: "me", text: userApiText, created_at: new Date().toISOString() }],
        }).unwrap();
        chatId = createdChat.id;
        setActiveChatId(chatId);
      } else {
        await addAssistantChatMessage({
          chatId,
          userId,
          message: { author: "me", text: userApiText, created_at: new Date().toISOString() },
        }).unwrap();
      }

      const response = await askAIagent([
        ...chatMessagesToRepairHistory(historyPrior),
        userTurnForApi,
      ], assistantContext);
      const companionMessage = createCompanionBubble(response);
      setMessages((prevMessages) => [...prevMessages, companionMessage]);

      await addAssistantChatMessage({
        chatId,
        userId,
        message: { author: "companion", text: response, created_at: new Date().toISOString() },
      }).unwrap();
    } catch (err) {
      const detail =
        err instanceof Error && err.message.trim()
          ? err.message.trim()
          : "Не удалось получить ответ от ИИ. Попробуйте еще раз.";
      const errorMessage: ChatMessage = {
        id: `${Date.now()}-error`,
        text: detail,
        author: "companion",
        timestamp: createTime(),
        omitFromAiHistory: true,
      };

      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    } finally {
      setIsAwaitingResponse(false);
    }
  };

  useEffect(() => {
    const messagesContainer = messagesRef.current;
    if (!messagesContainer) {
      return;
    }

    messagesContainer.scrollTo({
      top: messagesContainer.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isAwaitingResponse, activeChatId]);

  const selectChat = (id: number) => {
    if (isAwaitingResponse) return;
    setRenamingId(null);
    setRenameDraft("");
    setActiveChatId(id);
    setMessages([]);
    setInputValue("");
    setPendingAttachments([]);
    setReportSaveStatuses({});
  };

  const startRename = (chat: IAssistantChat) => {
    if (isAwaitingResponse || !userId) return;
    setRenamingId(chat.id);
    setRenameDraft(chat.title);
  };

  const cancelRename = () => {
    setRenamingId(null);
    setRenameDraft("");
  };

  const submitRename = async (event?: FormEvent) => {
    event?.preventDefault();
    if (!userId || renamingId == null) return;
    const title = renameDraft.trim();
    if (!title) {
      cancelRename();
      return;
    }
    try {
      await updateAssistantChat({
        id: renamingId,
        userId,
        patch: { title },
      }).unwrap();
    } finally {
      cancelRename();
    }
  };

  const handleDeleteChat = async (chatId: number) => {
    if (!userId || isAwaitingResponse) return;
    if (!window.confirm("Удалить этот чат? Вся переписка будет удалена без восстановления.")) {
      return;
    }
    await deleteAssistantChat({ id: chatId, userId }).unwrap();
    if (activeChatId === chatId) {
      handleNewChatClick();
    }
    if (renamingId === chatId) {
      cancelRename();
    }
  };

  const ensureReportDevice = async (issueText: string, assistantAnswer: string) => {
    const detectedDeviceName = extractDeviceNameFromAssistantAnswer(assistantAnswer);
    const deviceName = detectedDeviceName ?? inferDeviceType(issueText);
    const normalizedDeviceName = deviceName.toLowerCase();
    const existingDevice = devices.find((device) => {
      const candidates = [device.device_type, device.model, formatDeviceName(device)];
      return candidates.some((candidate) => candidate?.toLowerCase() === normalizedDeviceName);
    });

    if (existingDevice) {
      return {
        device: existingDevice,
        deviceName: detectedDeviceName ?? formatDeviceName(existingDevice),
      };
    }

    const createdDevice = await createDevice({
      user_id: userId!,
      device_type: deviceName,
      brand: null,
      model: AI_DETECTED_DEVICE_MODEL,
      serial_number: null,
      notes: "Автоматически создано по строке «Название техники» из ответа ИИ.",
    }).unwrap();
    return { device: createdDevice, deviceName };
  };

  const handleUnsaveReport = async (messageId: string, repairHistoryId: number) => {
    if (!userId || !activeChatId) return;

    setReportSaveStatuses((prev) => ({
      ...prev,
      [messageId]: { status: "saving", repairHistoryId },
    }));

    try {
      const record = repairHistory.find((item) => item.id === repairHistoryId);
      if (!record) {
        setReportSaveStatuses((prev) => ({ ...prev, [messageId]: { status: "idle" } }));
        return;
      }

      const nextNotes = removeChatReportSection(
        record.result_notes,
        activeChatId,
        messageId
      );

      if (!nextNotes) {
        await deleteRepairHistory({ id: repairHistoryId, userId }).unwrap();
      } else {
        await updateRepairHistory({
          id: repairHistoryId,
          userId,
          patch: { result_notes: nextNotes },
        }).unwrap();
      }

      setReportSaveStatuses((prev) => ({ ...prev, [messageId]: { status: "idle" } }));
    } catch {
      setReportSaveStatuses((prev) => ({
        ...prev,
        [messageId]: { status: "error", repairHistoryId },
      }));
    }
  };

  const handleSaveReport = async (messageId: string) => {
    if (!userId || !activeChatId) return;

    const assistantIndex = messages.findIndex((message) => message.id === messageId);
    const assistantMessage = messages[assistantIndex];
    if (!assistantMessage || assistantMessage.author !== "companion") {
      return;
    }

    setReportSaveStatuses((prev) => ({
      ...prev,
      [messageId]: { status: "saving" },
    }));

    try {
      const messagesForReport = messages.slice(0, assistantIndex + 1);
      const userMessages = messagesForReport.filter((message) => message.author === "me");
      const lastUserMessage = [...userMessages].reverse()[0];
      const issue = firstMeaningfulLine(
        lastUserMessage?.text ?? activeTitle,
        activeTitle || "Консультация по ремонту"
      );
      const { device: reportDevice, deviceName: reportDeviceName } = await ensureReportDevice(
        issue,
        assistantMessage.text
      );
      const reportNotes = buildRepairReportNotes(
        reportDeviceName,
        issue,
        assistantMessage.text,
        userMessages,
        activeTitle
      );

      const recommendation = firstMeaningfulLine(
        assistantMessage.text,
        "Рекомендации сохранены в полном отчете."
      );
      const devicesById = new Map(devices.map((device) => [device.id, device]));
      const existingReport = repairHistory
        .filter((record) =>
          repairRecordsShareDeviceName(record, reportDeviceName, devicesById)
        )
        .sort(
          (a, b) => Date.parse(String(b.started_at)) - Date.parse(String(a.started_at))
        )[0];

      let repairHistoryId: number;

      if (existingReport) {
        await updateRepairHistory({
          id: existingReport.id,
          userId,
          patch: {
            issue_description: issue,
            work_performed: assistantMessage.text,
            recommendation_used: recommendation,
            result_notes: appendRepairReportSection(
              existingReport.result_notes,
              reportNotes,
              new Date(),
              { chatId: activeChatId, messageId }
            ),
          },
        }).unwrap();
        repairHistoryId = existingReport.id;
      } else {
        const created = await createRepairHistory({
          user_id: userId,
          device_id: reportDevice.id,
          issue_description: issue,
          started_at: new Date(),
          finished_at: null,
          status: "in_progress",
          work_performed: assistantMessage.text,
          result_notes: withChatReportRef(activeChatId, messageId, reportNotes),
          recommendation_used: recommendation,
          complexity_skill_level_id: currentUser?.skill_level_id ?? null,
        }).unwrap();
        repairHistoryId = created.id;
      }

      setReportSaveStatuses((prev) => ({
        ...prev,
        [messageId]: { status: "saved", repairHistoryId },
      }));
    } catch {
      setReportSaveStatuses((prev) => ({ ...prev, [messageId]: { status: "error" } }));
    }
  };

  const handleToggleReport = (messageId: string) => {
    const entry = reportSaveStatuses[messageId];
    if (entry?.status === "saving") return;

    if (entry?.status === "saved" && entry.repairHistoryId) {
      void handleUnsaveReport(messageId, entry.repairHistoryId);
      return;
    }

    void handleSaveReport(messageId);
  };

  return (
    <section className="chat-page">
      <Card className="chat-page__shell">
        <aside className="chat-page__sidebar" aria-label="Список чатов">
          <div className="chat-page__sidebar-head">
            <span className="chat-page__sidebar-head-title">Чаты</span>
          </div>

          <div className="chat-page__new-chat-row">
            <button
              type="button"
              className="chat-page__new-chat-btn"
              onClick={handleNewChatClick}
              disabled={isAwaitingResponse}
              aria-label="Новый чат"
            >
              <span className="chat-page__new-chat-icon" aria-hidden="true">
                +
              </span>
              <span className="chat-page__new-chat-label">Новый чат</span>
            </button>
          </div>

          {isChatsLoading && (
            <p className="chat-page__sidebar-empty">Загрузка чатов…</p>
          )}

          {isChatsError && (
            <div className="chat-page__sidebar-empty chat-page__sidebar-empty--boxed">
              <p>Не удалось загрузить список чатов.</p>
              <button type="button" className="chat-page__sidebar-link-btn" onClick={() => refetchChats()}>
                Повторить
              </button>
            </div>
          )}

          {!isChatsLoading && !isChatsError && sortedChats.length === 0 && (
            <p className="chat-page__sidebar-empty">
              Сохранённых чатов пока нет. Напишите сообщение в новом чате.
            </p>
          )}

          {sortedChats.length > 0 && (
            <ul className="chat-page__sidebar-list">
              {sortedChats.map((chat) => {
                const isActive = chat.id === activeChatId;
                const isRenaming = renamingId === chat.id;

                return (
                  <li key={chat.id}>
                    {isRenaming ? (
                      <form className="chat-page__rename-form" onSubmit={submitRename}>
                        <TextInput
                          className="chat-page__rename-input"
                          value={renameDraft}
                          onChange={(e) => setRenameDraft(e.target.value)}
                          placeholder="Название чата"
                          aria-label="Новое название чата"
                          autoFocus
                          maxLength={160}
                        />
                        <div className="chat-page__rename-actions">
                          <Button type="submit" className="chat-page__rename-submit">
                            Сохранить
                          </Button>
                          <Button type="button" variant="ghost" onClick={cancelRename}>
                            Отмена
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <div className="chat-page__sidebar-row">
                        <button
                          type="button"
                          className={`chat-page__sidebar-item${isActive ? " chat-page__sidebar-item--active" : ""}`}
                          onClick={() => selectChat(chat.id)}
                          disabled={isAwaitingResponse}
                          aria-current={isActive ? "true" : undefined}
                        >
                          <span className="chat-page__sidebar-avatar" aria-hidden="true">
                            AI
                          </span>
                          <span className="chat-page__sidebar-text">
                            <span className="chat-page__sidebar-title">{chat.title}</span>
                            <span className="chat-page__sidebar-preview">
                              Обновлён {formatChatDate(chat.updated_at)}
                            </span>
                          </span>
                        </button>
                        <div className="chat-page__sidebar-row-actions">
                          <button
                            type="button"
                            className="chat-page__sidebar-icon-btn"
                            aria-label={`Переименовать чат «${chat.title}»`}
                            disabled={isAwaitingResponse}
                            onClick={(e) => {
                              e.stopPropagation();
                              startRename(chat);
                            }}
                          >
                            ✎
                          </button>
                          <button
                            type="button"
                            className="chat-page__sidebar-icon-btn chat-page__sidebar-icon-btn--danger"
                            aria-label={`Удалить чат «${chat.title}»`}
                            disabled={isAwaitingResponse}
                            onClick={(e) => {
                              e.stopPropagation();
                              void handleDeleteChat(chat.id);
                            }}
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        <div className="chat-page__main">
          <header className="chat-page__header">
            <div className="chat-page__avatar" aria-hidden="true">
              AI
            </div>
            <div className="chat-page__header-text">
              <h1 className="chat-page__title">
                {activeTitle}
              </h1>
              <p className="chat-page__subtitle">
                {activeChatId
                  ? "продолжайте диалог с помощником"
                  : "пустой чат готов — напишите первое сообщение"}
              </p>
            </div>
          </header>

          {isActiveChatError && (
            <p className="chat-page__chat-error" role="alert">
              Не удалось открыть этот чат. Выберите другой или создайте новый.
            </p>
          )}

          <ChatMessages
            ref={messagesRef}
            messages={messages}
            isAwaitingResponse={isAwaitingResponse}
            onToggleReport={handleToggleReport}
            getReportSaveEntry={(messageId) => reportSaveStatuses[messageId] ?? { status: "idle" }}
          />

          <div className={`chat-page__input-wrap ${!canSend ? "is-disabled" : ""}`}>
            <ChatInput
              value={inputValue}
              onChange={setInputValue}
              onSend={handleSendMessage}
              canSend={canSend}
              disabled={isAwaitingResponse || isCreatingChat}
              pendingAttachments={pendingAttachments}
              onAttachmentsChange={setPendingAttachments}
            />
          </div>
        </div>
      </Card>
    </section>
  );
};

export default ChatPage;
