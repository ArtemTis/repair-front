import type {
  AssistantMessageAuthor,
  IAssistantChat,
  IAssistantChatMessage,
  IAssistantChatWithMessages,
} from "../types";
import { captionForRepairChatTitle } from "../chat/repairAssistantEnvelope";
import { baseApi } from "./baseApi";

type AssistantChatCreateBody = {
  user_id: number;
  title?: string;
  messages?: Array<{
    author: AssistantMessageAuthor;
    text: string;
    created_at?: string;
  }>;
};

type AssistantChatMessageCreateBody = {
  author: AssistantMessageAuthor;
  text: string;
  created_at?: string;
};

type AssistantChatMessageAddArg = {
  chatId: number;
  userId: number;
  message: AssistantChatMessageCreateBody;
};

const assistantChatTitleFromText = (text: string): string => {
  const caption = captionForRepairChatTitle(text);
  const firstLine = caption.trim().split(/\r?\n/)[0] ?? "";
  if (!firstLine) return "Новый чат";
  return firstLine.length > 72 ? `${firstLine.slice(0, 72)}...` : firstLine;
};

export const assistantChatsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getAssistantChatsByUserId: build.query<IAssistantChat[], number>({
      query: (userId) => `/api/assistant-chats/user/${userId}`,
      providesTags: (result, _e, userId) =>
        result
          ? [
              ...result.map(({ id }) => ({
                type: "AssistantChat" as const,
                id,
              })),
              { type: "AssistantChat", id: `USER_${userId}` },
            ]
          : [{ type: "AssistantChat", id: `USER_${userId}` }],
    }),
    getAssistantChatById: build.query<IAssistantChatWithMessages, number>({
      query: (id) => `/api/assistant-chats/${id}`,
      providesTags: (_r, _e, id) => [{ type: "AssistantChat", id }],
    }),
    createAssistantChat: build.mutation<
      IAssistantChatWithMessages,
      AssistantChatCreateBody
    >({
      query: (body) => ({ url: "/api/assistant-chats", method: "POST", body }),
      invalidatesTags: [],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          const { messages: _messages, ...chatRow } = data;
          dispatch(
            assistantChatsApi.util.updateQueryData(
              "getAssistantChatsByUserId",
              arg.user_id,
              (draft) => {
                draft.unshift(chatRow);
              }
            )
          );
          dispatch(
            assistantChatsApi.util.upsertQueryData(
              "getAssistantChatById",
              data.id,
              data
            )
          );
        } catch {
          /* мутация отклонена */
        }
      },
    }),
    updateAssistantChat: build.mutation<
      IAssistantChat,
      { id: number; userId: number; patch: Pick<IAssistantChat, "title"> }
    >({
      query: ({ id, patch }) => ({
        url: `/api/assistant-chats/${id}`,
        method: "PATCH",
        body: patch,
      }),
      invalidatesTags: (_r, _e, { id, userId }) => [
        { type: "AssistantChat", id },
        { type: "AssistantChat", id: `USER_${userId}` },
      ],
    }),
    addAssistantChatMessage: build.mutation<
      IAssistantChatMessage,
      AssistantChatMessageAddArg
    >({
      query: ({ chatId, message }) => ({
        url: `/api/assistant-chats/${chatId}/messages`,
        method: "POST",
        body: message,
      }),
      invalidatesTags: [],
      async onQueryStarted({ chatId, userId, message }, { dispatch, queryFulfilled }) {
        try {
          const { data: newMsg } = await queryFulfilled;
          dispatch(
            assistantChatsApi.util.updateQueryData(
              "getAssistantChatById",
              chatId,
              (draft) => {
                draft.messages.push(newMsg);
                draft.updated_at = newMsg.created_at;
                if (message.author === "me" && draft.title === "Новый чат") {
                  draft.title = assistantChatTitleFromText(message.text);
                }
              }
            )
          );
          dispatch(
            assistantChatsApi.util.updateQueryData(
              "getAssistantChatsByUserId",
              userId,
              (draft) => {
                const idx = draft.findIndex((c) => c.id === chatId);
                if (idx === -1) return;
                const row = draft[idx];
                const nextTitle =
                  message.author === "me" && row.title === "Новый чат"
                    ? assistantChatTitleFromText(message.text)
                    : row.title;
                draft.splice(idx, 1);
                draft.unshift({
                  ...row,
                  title: nextTitle,
                  updated_at: newMsg.created_at,
                });
              }
            )
          );
        } catch {
          /* ошибка сети / 4xx */
        }
      },
    }),
    deleteAssistantChat: build.mutation<void, { id: number; userId: number }>({
      query: ({ id }) => ({
        url: `/api/assistant-chats/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_r, _e, { id, userId }) => [
        { type: "AssistantChat", id },
        { type: "AssistantChat", id: `USER_${userId}` },
      ],
    }),
  }),
});

export const {
  useGetAssistantChatsByUserIdQuery,
  useGetAssistantChatByIdQuery,
  useCreateAssistantChatMutation,
  useUpdateAssistantChatMutation,
  useAddAssistantChatMessageMutation,
  useDeleteAssistantChatMutation,
} = assistantChatsApi;
