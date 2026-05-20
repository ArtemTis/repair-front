import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
  IAuthResponse,
  IUser,
  ISkills,
  ITool,
  IDevice,
  IRepairGuide,
  IRepairHistory,
  IAssistantChat,
  IAssistantChatMessage,
  IAssistantChatWithMessages,
  AssistantMessageAuthor,
  IUserTool,
  IRepairGuideTool,
  ILoginBody,
  IRegisterBody,
  IArticle,
} from '../types';
import { captionForRepairChatTitle } from '../chat/repairAssistantEnvelope';

const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

type UserCreateBody = Omit<IUser, 'id' | 'created_at' | 'updated_at'>;
type UserUpdateBody = Partial<Omit<IUser, 'id' | 'email' | 'created_at' | 'updated_at'>>;
type ToolCreateBody = Omit<ITool, 'id' | 'created_at' | 'updated_at'>;
type DeviceCreateBody = Omit<IDevice, 'id' | 'created_at' | 'updated_at'>;
type RepairGuideCreateBody = Omit<IRepairGuide, 'id' | 'created_at' | 'updated_at'>;
type RepairHistoryCreateBody = Pick<IRepairHistory, 'user_id' | 'device_id' | 'issue_description'> &
  Partial<
    Omit<IRepairHistory, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'device_id' | 'issue_description'>
  >;
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

/** Совпадает с логикой title на бэкенде при первом сообщении пользователя */
const assistantChatTitleFromText = (text: string): string => {
  const caption = captionForRepairChatTitle(text);
  const firstLine = caption.trim().split(/\r?\n/)[0] ?? '';
  if (!firstLine) return 'Новый чат';
  return firstLine.length > 72 ? `${firstLine.slice(0, 72)}...` : firstLine;
};

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: BASE_URL,
    prepareHeaders: (headers) => {
      if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }
      return headers;
    },
  }),
  tagTypes: [
    'User',
    'Tool',
    'Device',
    'RepairGuide',
    'RepairHistory',
    'AssistantChat',
    'UserTool',
    'RepairGuideTool',
    'Skill',
    'Article',
  ],
  endpoints: (build) => ({
    login: build.mutation<IAuthResponse, ILoginBody>({
      query: (body) => ({ url: '/api/auth/login', method: 'POST', body }),
    }),
    register: build.mutation<IAuthResponse, IRegisterBody>({
      query: (body) => ({ url: '/api/auth/register', method: 'POST', body }),
      invalidatesTags: [{ type: 'User', id: 'LIST' }],
    }),

    getUsers: build.query<IUser[], void>({
      query: () => '/api/users',
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'User' as const, id })),
              { type: 'User', id: 'LIST' },
            ]
          : [{ type: 'User', id: 'LIST' }],
    }),
    getUserById: build.query<IUser, number>({
      query: (id) => `/api/user/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'User', id }],
    }),
    createUser: build.mutation<IUser, UserCreateBody>({
      query: (body) => ({ url: '/api/user', method: 'POST', body }),
      invalidatesTags: [{ type: 'User', id: 'LIST' }],
    }),
    updateUser: build.mutation<IUser, { id: number; patch: UserUpdateBody }>({
      query: ({ id, patch }) => ({ url: `/api/user/${id}`, method: 'PATCH', body: patch }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'User', id }, { type: 'User', id: 'LIST' }],
    }),
    deleteUser: build.mutation<void, number>({
      query: (id) => ({ url: `/api/user/${id}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, id) => [{ type: 'User', id }, { type: 'User', id: 'LIST' }],
    }),

    getTools: build.query<ITool[], void>({
      query: () => '/api/tools',
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Tool' as const, id })),
              { type: 'Tool', id: 'LIST' },
            ]
          : [{ type: 'Tool', id: 'LIST' }],
    }),
    getToolById: build.query<ITool, number>({
      query: (id) => `/api/tool/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Tool', id }],
    }),
    createTool: build.mutation<ITool, ToolCreateBody>({
      query: (body) => ({ url: '/api/tool', method: 'POST', body }),
      invalidatesTags: [{ type: 'Tool', id: 'LIST' }],
    }),
    updateTool: build.mutation<ITool, { id: number; patch: Partial<ITool> }>({
      query: ({ id, patch }) => ({ url: `/api/tool/${id}`, method: 'PATCH', body: patch }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Tool', id }, { type: 'Tool', id: 'LIST' }],
    }),
    deleteTool: build.mutation<void, number>({
      query: (id) => ({ url: `/api/tool/${id}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, id) => [{ type: 'Tool', id }, { type: 'Tool', id: 'LIST' }],
    }),

    getDevicesByUserId: build.query<IDevice[], number>({
      query: (userId) => `/api/devices/user/${userId}`,
      providesTags: (_r, _e, userId) => [{ type: 'Device', id: `USER_${userId}` }],
    }),
    getDeviceById: build.query<IDevice, number>({
      query: (id) => `/api/device/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Device', id }],
    }),
    createDevice: build.mutation<IDevice, DeviceCreateBody>({
      query: (body) => ({ url: '/api/device', method: 'POST', body }),
      invalidatesTags: (_r, _e, body) => [
        { type: 'Device', id: `USER_${body.user_id}` },
        { type: 'Device', id: 'LIST' },
      ],
    }),
    updateDevice: build.mutation<IDevice, { id: number; patch: Partial<IDevice> }>({
      query: ({ id, patch }) => ({ url: `/api/device/${id}`, method: 'PATCH', body: patch }),
      invalidatesTags: (_r, _e, { id, patch }) => {
        const tags: Array<{ type: 'Device'; id: number | string }> = [
          { type: 'Device', id },
          { type: 'Device', id: 'LIST' },
        ];
        if (patch.user_id !== undefined) {
          tags.push({ type: 'Device', id: `USER_${patch.user_id}` });
        }
        return tags;
      },
    }),
    deleteDevice: build.mutation<void, number>({
      query: (id) => ({ url: `/api/device/${id}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, id) => [{ type: 'Device', id }, { type: 'Device', id: 'LIST' }],
    }),

    getRepairGuidesByUserId: build.query<IRepairGuide[], number>({
      query: (userId) => `/api/repair-guides/user/${userId}`,
      providesTags: (_r, _e, userId) => [{ type: 'RepairGuide', id: `USER_${userId}` }],
    }),
    getRepairGuideById: build.query<IRepairGuide, number>({
      query: (id) => `/api/repair-guide/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'RepairGuide', id }],
    }),
    createRepairGuide: build.mutation<IRepairGuide, RepairGuideCreateBody>({
      query: (body) => ({ url: '/api/repair-guide', method: 'POST', body }),
      invalidatesTags: (_r, _e, body) => [
        { type: 'RepairGuide', id: `USER_${body.user_id}` },
        { type: 'RepairGuide', id: 'LIST' },
      ],
    }),
    updateRepairGuide: build.mutation<
      IRepairGuide,
      { id: number; patch: Partial<IRepairGuide> }
    >({
      query: ({ id, patch }) => ({
        url: `/api/repair-guide/${id}`,
        method: 'PATCH',
        body: patch,
      }),
      invalidatesTags: (_r, _e, { id, patch }) => {
        const tags: Array<{ type: 'RepairGuide'; id: number | string }> = [
          { type: 'RepairGuide', id },
          { type: 'RepairGuide', id: 'LIST' },
        ];
        if (patch.user_id !== undefined) {
          tags.push({ type: 'RepairGuide', id: `USER_${patch.user_id}` });
        }
        return tags;
      },
    }),
    deleteRepairGuide: build.mutation<void, number>({
      query: (id) => ({ url: `/api/repair-guide/${id}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'RepairGuide', id },
        { type: 'RepairGuide', id: 'LIST' },
      ],
    }),

    getRepairHistoryByUserId: build.query<IRepairHistory[], number>({
      query: (userId) => `/api/repair-history/user/${userId}`,
      providesTags: (_r, _e, userId) => [{ type: 'RepairHistory', id: `USER_${userId}` }],
    }),
    getRepairHistoryById: build.query<IRepairHistory, number>({
      query: (id) => `/api/repair-history/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'RepairHistory', id }],
    }),
    createRepairHistory: build.mutation<IRepairHistory, RepairHistoryCreateBody>({
      query: (body) => ({ url: '/api/repair-history', method: 'POST', body }),
      invalidatesTags: (_r, _e, body) => [
        { type: 'RepairHistory', id: `USER_${body.user_id}` },
        { type: 'RepairHistory', id: 'LIST' },
      ],
    }),
    updateRepairHistory: build.mutation<
      IRepairHistory,
      { id: number; userId: number; patch: Partial<IRepairHistory> }
    >({
      query: ({ id, patch }) => ({
        url: `/api/repair-history/${id}`,
        method: 'PATCH',
        body: patch,
      }),
      invalidatesTags: (_r, _e, { id, userId }) => [
        { type: 'RepairHistory', id },
        { type: 'RepairHistory', id: 'LIST' },
        { type: 'RepairHistory', id: `USER_${userId}` },
      ],
      async onQueryStarted({ id, userId, patch }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          baseApi.util.updateQueryData('getRepairHistoryByUserId', userId, (draft) => {
            const record = draft.find((item) => item.id === id);
            if (record) {
              Object.assign(record, patch);
            }
          })
        );
        try {
          const { data } = await queryFulfilled;
          dispatch(
            baseApi.util.updateQueryData('getRepairHistoryByUserId', userId, (draft) => {
              const index = draft.findIndex((item) => item.id === id);
              if (index !== -1) {
                draft[index] = data;
              }
            })
          );
        } catch {
          patchResult.undo();
        }
      },
    }),
    deleteRepairHistory: build.mutation<void, { id: number; userId: number }>({
      query: ({ id }) => ({ url: `/api/repair-history/${id}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, { id, userId }) => [
        { type: 'RepairHistory', id },
        { type: 'RepairHistory', id: 'LIST' },
        { type: 'RepairHistory', id: `USER_${userId}` },
      ],
    }),

    getAssistantChatsByUserId: build.query<IAssistantChat[], number>({
      query: (userId) => `/api/assistant-chats/user/${userId}`,
      providesTags: (result, _e, userId) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'AssistantChat' as const, id })),
              { type: 'AssistantChat', id: `USER_${userId}` },
            ]
          : [{ type: 'AssistantChat', id: `USER_${userId}` }],
    }),
    getAssistantChatById: build.query<IAssistantChatWithMessages, number>({
      query: (id) => `/api/assistant-chats/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'AssistantChat', id }],
    }),
    createAssistantChat: build.mutation<IAssistantChatWithMessages, AssistantChatCreateBody>({
      query: (body) => ({ url: '/api/assistant-chats', method: 'POST', body }),
      invalidatesTags: [],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          const { messages: _m, ...chatRow } = data;
          dispatch(
            baseApi.util.updateQueryData('getAssistantChatsByUserId', arg.user_id, (draft) => {
              draft.unshift(chatRow);
            })
          );
          dispatch(baseApi.util.upsertQueryData('getAssistantChatById', data.id, data));
        } catch {
          /* мутация отклонена */
        }
      },
    }),
    updateAssistantChat: build.mutation<
      IAssistantChat,
      { id: number; userId: number; patch: Pick<IAssistantChat, 'title'> }
    >({
      query: ({ id, patch }) => ({
        url: `/api/assistant-chats/${id}`,
        method: 'PATCH',
        body: patch,
      }),
      invalidatesTags: (_r, _e, { id, userId }) => [
        { type: 'AssistantChat', id },
        { type: 'AssistantChat', id: `USER_${userId}` },
      ],
    }),
    addAssistantChatMessage: build.mutation<IAssistantChatMessage, AssistantChatMessageAddArg>({
      query: ({ chatId, message }) => ({
        url: `/api/assistant-chats/${chatId}/messages`,
        method: 'POST',
        body: message,
      }),
      invalidatesTags: [],
      async onQueryStarted({ chatId, userId, message }, { dispatch, queryFulfilled }) {
        try {
          const { data: newMsg } = await queryFulfilled;
          dispatch(
            baseApi.util.updateQueryData('getAssistantChatById', chatId, (draft) => {
              draft.messages.push(newMsg);
              draft.updated_at = newMsg.created_at;
              if (message.author === 'me' && draft.title === 'Новый чат') {
                draft.title = assistantChatTitleFromText(message.text);
              }
            })
          );
          dispatch(
            baseApi.util.updateQueryData('getAssistantChatsByUserId', userId, (draft) => {
              const idx = draft.findIndex((c) => c.id === chatId);
              if (idx === -1) return;
              const row = draft[idx];
              const nextTitle =
                message.author === 'me' && row.title === 'Новый чат'
                  ? assistantChatTitleFromText(message.text)
                  : row.title;
              draft.splice(idx, 1);
              draft.unshift({ ...row, title: nextTitle, updated_at: newMsg.created_at });
            })
          );
        } catch {
          /* ошибка сети / 4xx */
        }
      },
    }),
    deleteAssistantChat: build.mutation<void, { id: number; userId: number }>({
      query: ({ id }) => ({ url: `/api/assistant-chats/${id}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, { id, userId }) => [
        { type: 'AssistantChat', id },
        { type: 'AssistantChat', id: `USER_${userId}` },
      ],
    }),

    getAllUserTools: build.query<IUserTool[], void>({
      query: () => '/api/user-tools',
      providesTags: [{ type: 'UserTool', id: 'LIST' }],
    }),
    getUserToolsByUserId: build.query<IUserTool[], number>({
      query: (userId) => `/api/user-tools/user/${userId}`,
      providesTags: (_r, _e, userId) => [{ type: 'UserTool', id: `USER_${userId}` }],
    }),
    getUserToolsByToolId: build.query<IUserTool[], number>({
      query: (toolId) => `/api/user-tools/tool/${toolId}`,
      providesTags: (_r, _e, toolId) => [{ type: 'UserTool', id: `TOOL_${toolId}` }],
    }),
    getUserToolByIds: build.query<IUserTool, { userId: number; toolId: number }>({
      query: ({ userId, toolId }) => `/api/user-tool/${userId}/${toolId}`,
      providesTags: (_r, _e, { userId, toolId }) => [
        { type: 'UserTool', id: `${userId}_${toolId}` },
      ],
    }),
    addUserTool: build.mutation<IUserTool, IUserTool>({
      query: (body) => ({ url: '/api/user-tool', method: 'POST', body }),
      invalidatesTags: (_r, _e, body) => [
        { type: 'UserTool', id: 'LIST' },
        { type: 'UserTool', id: `USER_${body.user_id}` },
        { type: 'UserTool', id: `TOOL_${body.tool_id}` },
      ],
    }),
    updateUserToolQuantity: build.mutation<
      IUserTool,
      { userId: number; toolId: number; quantity: number }
    >({
      query: ({ userId, toolId, quantity }) => ({
        url: `/api/user-tool/${userId}/${toolId}`,
        method: 'PATCH',
        body: { quantity },
      }),
      invalidatesTags: (_r, _e, { userId, toolId }) => [
        { type: 'UserTool', id: 'LIST' },
        { type: 'UserTool', id: `USER_${userId}` },
        { type: 'UserTool', id: `TOOL_${toolId}` },
        { type: 'UserTool', id: `${userId}_${toolId}` },
      ],
    }),
    deleteUserTool: build.mutation<void, { userId: number; toolId: number }>({
      query: ({ userId, toolId }) => ({
        url: `/api/user-tool/${userId}/${toolId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_r, _e, { userId, toolId }) => [
        { type: 'UserTool', id: 'LIST' },
        { type: 'UserTool', id: `USER_${userId}` },
        { type: 'UserTool', id: `TOOL_${toolId}` },
        { type: 'UserTool', id: `${userId}_${toolId}` },
      ],
    }),

    getAllRepairGuideTools: build.query<IRepairGuideTool[], void>({
      query: () => '/api/repair-guide-tools',
      providesTags: [{ type: 'RepairGuideTool', id: 'LIST' }],
    }),
    getRepairGuideToolsByGuideId: build.query<IRepairGuideTool[], number>({
      query: (guideId) => `/api/repair-guide-tools/guide/${guideId}`,
      providesTags: (_r, _e, guideId) => [
        { type: 'RepairGuideTool', id: `GUIDE_${guideId}` },
      ],
    }),
    getRepairGuideToolsByToolId: build.query<IRepairGuideTool[], number>({
      query: (toolId) => `/api/repair-guide-tools/tool/${toolId}`,
      providesTags: (_r, _e, toolId) => [{ type: 'RepairGuideTool', id: `TOOL_${toolId}` }],
    }),
    getRepairGuideToolByIds: build.query<
      IRepairGuideTool,
      { guideId: number; toolId: number }
    >({
      query: ({ guideId, toolId }) =>
        `/api/repair-guide-tool/${guideId}/${toolId}`,
      providesTags: (_r, _e, { guideId, toolId }) => [
        { type: 'RepairGuideTool', id: `${guideId}_${toolId}` },
      ],
    }),
    addRepairGuideTool: build.mutation<IRepairGuideTool, IRepairGuideTool>({
      query: (body) => ({ url: '/api/repair-guide-tool', method: 'POST', body }),
      invalidatesTags: (_r, _e, body) => [
        { type: 'RepairGuideTool', id: 'LIST' },
        { type: 'RepairGuideTool', id: `GUIDE_${body.repair_guide_id}` },
        { type: 'RepairGuideTool', id: `TOOL_${body.tool_id}` },
      ],
    }),
    updateRepairGuideTool: build.mutation<
      IRepairGuideTool,
      {
        guideId: number;
        toolId: number;
        patch: Partial<IRepairGuideTool>;
      }
    >({
      query: ({ guideId, toolId, patch }) => ({
        url: `/api/repair-guide-tool/${guideId}/${toolId}`,
        method: 'PATCH',
        body: patch,
      }),
      invalidatesTags: (_r, _e, { guideId, toolId }) => [
        { type: 'RepairGuideTool', id: 'LIST' },
        { type: 'RepairGuideTool', id: `GUIDE_${guideId}` },
        { type: 'RepairGuideTool', id: `TOOL_${toolId}` },
        { type: 'RepairGuideTool', id: `${guideId}_${toolId}` },
      ],
    }),
    deleteRepairGuideTool: build.mutation<void, { guideId: number; toolId: number }>({
      query: ({ guideId, toolId }) => ({
        url: `/api/repair-guide-tool/${guideId}/${toolId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_r, _e, { guideId, toolId }) => [
        { type: 'RepairGuideTool', id: 'LIST' },
        { type: 'RepairGuideTool', id: `GUIDE_${guideId}` },
        { type: 'RepairGuideTool', id: `TOOL_${toolId}` },
        { type: 'RepairGuideTool', id: `${guideId}_${toolId}` },
      ],
    }),

    getSkills: build.query<ISkills[], void>({
      query: () => '/api/skills',
      providesTags: [{ type: 'Skill', id: 'LIST' }],
    }),
    getSkillById: build.query<ISkills, number>({
      query: (id) => `/api/skill/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Skill', id }],
    }),
    getSkillByUserId: build.query<ISkills, number>({
      query: (userId) => `/api/skill/user/${userId}`,
      providesTags: (_r, _e, userId) => [{ type: 'Skill', id: `USER_${userId}` }],
    }),

    getArticles: build.query<IArticle[], void>({
      query: () => '/api/articles',
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Article' as const, id })),
              { type: 'Article', id: 'LIST' },
            ]
          : [{ type: 'Article', id: 'LIST' }],
    }),
    getArticleById: build.query<IArticle, number>({
      query: (id) => `/api/articles/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Article', id }],
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useGetUsersQuery,
  useGetUserByIdQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useGetToolsQuery,
  useGetToolByIdQuery,
  useCreateToolMutation,
  useUpdateToolMutation,
  useDeleteToolMutation,
  useGetDevicesByUserIdQuery,
  useGetDeviceByIdQuery,
  useCreateDeviceMutation,
  useUpdateDeviceMutation,
  useDeleteDeviceMutation,
  useGetRepairGuidesByUserIdQuery,
  useGetRepairGuideByIdQuery,
  useCreateRepairGuideMutation,
  useUpdateRepairGuideMutation,
  useDeleteRepairGuideMutation,
  useGetRepairHistoryByUserIdQuery,
  useGetRepairHistoryByIdQuery,
  useCreateRepairHistoryMutation,
  useUpdateRepairHistoryMutation,
  useDeleteRepairHistoryMutation,
  useGetAssistantChatsByUserIdQuery,
  useGetAssistantChatByIdQuery,
  useCreateAssistantChatMutation,
  useUpdateAssistantChatMutation,
  useAddAssistantChatMessageMutation,
  useDeleteAssistantChatMutation,
  useGetAllUserToolsQuery,
  useGetUserToolsByUserIdQuery,
  useGetUserToolsByToolIdQuery,
  useGetUserToolByIdsQuery,
  useAddUserToolMutation,
  useUpdateUserToolQuantityMutation,
  useDeleteUserToolMutation,
  useGetAllRepairGuideToolsQuery,
  useGetRepairGuideToolsByGuideIdQuery,
  useGetRepairGuideToolsByToolIdQuery,
  useGetRepairGuideToolByIdsQuery,
  useAddRepairGuideToolMutation,
  useUpdateRepairGuideToolMutation,
  useDeleteRepairGuideToolMutation,
  useGetSkillsQuery,
  useGetSkillByIdQuery,
  useGetSkillByUserIdQuery,
  useGetArticlesQuery,
  useGetArticleByIdQuery,
} = baseApi;
