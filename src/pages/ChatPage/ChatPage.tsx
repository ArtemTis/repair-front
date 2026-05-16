import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import ChatInput from "./components/ChatInput";
import ChatMessages from "./components/ChatMessages";
import type { ChatMessage } from "./types";
import "./ChatPage.css";
import { askDeepSeek } from "../../shared/api/ai";
import { Card, TextInput, Button } from "../../shared/ui";
import { useAppSelector } from "../../shared/store/hooks";
import {
  useAddAssistantChatMessageMutation,
  useCreateAssistantChatMutation,
  useDeleteAssistantChatMutation,
  useGetAssistantChatByIdQuery,
  useGetAssistantChatsByUserIdQuery,
  useUpdateAssistantChatMutation,
} from "../../shared/api/api";
import type { AssistantMessageAuthor, IAssistantChat, IAssistantChatMessage } from "../../shared/types";

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

const titleFromText = (text: string) => {
  const firstLine = text.trim().split(/\r?\n/)[0] ?? "";
  if (!firstLine) return "Новый чат";
  return firstLine.length > 72 ? `${firstLine.slice(0, 72)}...` : firstLine;
};

const mapMessage = (message: IAssistantChatMessage): ChatMessage => ({
  id: String(message.id),
  text: message.text,
  author: message.author,
  timestamp: new Date(message.created_at).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  }),
});

const createLocalMessage = (text: string, author: AssistantMessageAuthor): ChatMessage => ({
  id: `${Date.now()}-${author}-${Math.random().toString(16).slice(2)}`,
  text,
  author,
  timestamp: createTime(),
});

const ChatPage = () => {
  const currentUser = useAppSelector((state) => state.auth.user);
  const userId = currentUser?.id;

  const {
    data: chats = [],
    isLoading: isChatsLoading,
    isError: isChatsError,
    refetch: refetchChats,
  } = useGetAssistantChatsByUserIdQuery(userId ?? 0, { skip: !userId });

  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isAwaitingResponse, setIsAwaitingResponse] = useState(false);
  const messagesRef = useRef<HTMLDivElement | null>(null);

  const {
    data: activeChat,
    isError: isActiveChatError,
  } = useGetAssistantChatByIdQuery(activeChatId ?? 0, { skip: !activeChatId });

  const [createAssistantChat, { isLoading: isCreatingChat }] = useCreateAssistantChatMutation();
  const [addAssistantChatMessage] = useAddAssistantChatMessageMutation();
  const [updateAssistantChat] = useUpdateAssistantChatMutation();
  const [deleteAssistantChat] = useDeleteAssistantChatMutation();

  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [renameDraft, setRenameDraft] = useState("");

  const sortedChats = useMemo(
    () => [...chats].sort((a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at)),
    [chats]
  );

  const activeTitle = activeChat?.title ?? "Новый чат";

  const canSend = useMemo(
    () => inputValue.trim().length > 0 && !isAwaitingResponse && !isCreatingChat,
    [inputValue, isAwaitingResponse, isCreatingChat]
  );

  useEffect(() => {
    if (!activeChatId) {
      setMessages([]);
      return;
    }

    if (activeChat) {
      setMessages(activeChat.messages.map(mapMessage));
    }
  }, [activeChatId, activeChat]);

  const handleNewChatClick = () => {
    if (isAwaitingResponse) return;
    setRenamingId(null);
    setRenameDraft("");
    setActiveChatId(null);
    setMessages([]);
    setInputValue("");
  };

  const handleSendMessage = async () => {
    const messageText = inputValue.trim();
    if (!messageText || isAwaitingResponse || isCreatingChat || !userId) {
      return;
    }

    const userMessage = createLocalMessage(messageText, "me");

    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInputValue("");
    setIsAwaitingResponse(true);

    try {
      let chatId = activeChatId;

      if (!chatId) {
        const createdChat = await createAssistantChat({
          user_id: userId,
          title: titleFromText(messageText),
          messages: [{ author: "me", text: messageText, created_at: new Date().toISOString() }],
        }).unwrap();
        chatId = createdChat.id;
        setActiveChatId(chatId);
      } else {
        await addAssistantChatMessage({
          chatId,
          message: { author: "me", text: messageText, created_at: new Date().toISOString() },
        }).unwrap();
      }

      const response = await askDeepSeek(messageText);
      const companionMessage = createLocalMessage(response, "companion");
      setMessages((prevMessages) => [...prevMessages, companionMessage]);

      await addAssistantChatMessage({
        chatId,
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
          />

          <div className={`chat-page__input-wrap ${!canSend ? "is-disabled" : ""}`}>
            <ChatInput
              value={inputValue}
              onChange={setInputValue}
              onSend={handleSendMessage}
              canSend={canSend}
            />
          </div>
        </div>
      </Card>
    </section>
  );
};

export default ChatPage;
