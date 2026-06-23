import type {
  AssistantMessageAuthor,
  IAssistantChat,
  IAssistantChatMessage,
  IAssistantChatWithMessages,
} from "../types";
import { captionForRepairChatTitle } from "../chat/repairAssistantEnvelope";
import { baseApi } from "./baseApi";

type AssistantChatCreateBody = {
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
    getMyAssistantChats: build.query<IAssistantChat[], void>({
      query: () => "/api/me/assistant-chats",
      providesTags: (result) =>
        result
          ? [
            ...result.map(({ id }) => ({
              type: "AssistantChat" as const,
              id,
            })),
            { type: "AssistantChat", id: "LIST" },
          ]
          : [{ type: "AssistantChat", id: "LIST" }],
    }),
    getAssistantChatById: build.query<IAssistantChatWithMessages, number>({
      query: (id) => `/api/me/assistant-chats/${id}`,
      providesTags: (_r, _e, id) => [{ type: "AssistantChat", id }],
    }),
    createAssistantChat: build.mutation<
      IAssistantChatWithMessages,
      AssistantChatCreateBody
    >({
      query: (body) => ({ url: "/api/me/assistant-chats", method: "POST", body }),
      invalidatesTags: [],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          const { messages: _messages, ...chatRow } = data;
          dispatch(
            assistantChatsApi.util.updateQueryData(
              "getMyAssistantChats",
              undefined,
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
      { id: number; patch: Pick<IAssistantChat, "title"> }
    >({
      query: ({ id, patch }) => ({
        url: `/api/me/assistant-chats/${id}`,
        method: "PATCH",
        body: patch,
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: "AssistantChat", id },
        { type: "AssistantChat", id: "LIST" },
      ],
    }),
    addAssistantChatMessage: build.mutation<
      IAssistantChatMessage,
      AssistantChatMessageAddArg
    >({
      query: ({ chatId, message }) => ({
        url: `/api/me/assistant-chats/${chatId}/messages`,
        method: "POST",
        body: message,
      }),
      invalidatesTags: [],
      async onQueryStarted({ chatId, message }, { dispatch, queryFulfilled }) {
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
              "getMyAssistantChats",
              undefined,
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
    deleteAssistantChat: build.mutation<void, number>({
      query: (id) => ({
        url: `/api/me/assistant-chats/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_r, _e, id) => [
        { type: "AssistantChat", id },
        { type: "AssistantChat", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetMyAssistantChatsQuery,
  useGetAssistantChatByIdQuery,
  useCreateAssistantChatMutation,
  useUpdateAssistantChatMutation,
  useAddAssistantChatMessageMutation,
  useDeleteAssistantChatMutation,
} = assistantChatsApi;
