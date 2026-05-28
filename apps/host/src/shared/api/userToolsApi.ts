import type { IUserTool } from "../types";
import { baseApi } from "./baseApi";

export const userToolsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getAllUserTools: build.query<IUserTool[], void>({
      query: () => "/api/user-tools",
      providesTags: [{ type: "UserTool", id: "LIST" }],
    }),
    getUserToolsByUserId: build.query<IUserTool[], number>({
      query: (userId) => `/api/user-tools/user/${userId}`,
      providesTags: (_r, _e, userId) => [
        { type: "UserTool", id: `USER_${userId}` },
      ],
    }),
    getUserToolsByToolId: build.query<IUserTool[], number>({
      query: (toolId) => `/api/user-tools/tool/${toolId}`,
      providesTags: (_r, _e, toolId) => [
        { type: "UserTool", id: `TOOL_${toolId}` },
      ],
    }),
    getUserToolByIds: build.query<
      IUserTool,
      { userId: number; toolId: number }
    >({
      query: ({ userId, toolId }) => `/api/user-tool/${userId}/${toolId}`,
      providesTags: (_r, _e, { userId, toolId }) => [
        { type: "UserTool", id: `${userId}_${toolId}` },
      ],
    }),
    addUserTool: build.mutation<IUserTool, IUserTool>({
      query: (body) => ({ url: "/api/user-tool", method: "POST", body }),
      invalidatesTags: (_r, _e, body) => [
        { type: "UserTool", id: "LIST" },
        { type: "UserTool", id: `USER_${body.user_id}` },
        { type: "UserTool", id: `TOOL_${body.tool_id}` },
      ],
    }),
    updateUserToolQuantity: build.mutation<
      IUserTool,
      { userId: number; toolId: number; quantity: number }
    >({
      query: ({ userId, toolId, quantity }) => ({
        url: `/api/user-tool/${userId}/${toolId}`,
        method: "PATCH",
        body: { quantity },
      }),
      invalidatesTags: (_r, _e, { userId, toolId }) => [
        { type: "UserTool", id: "LIST" },
        { type: "UserTool", id: `USER_${userId}` },
        { type: "UserTool", id: `TOOL_${toolId}` },
        { type: "UserTool", id: `${userId}_${toolId}` },
      ],
    }),
    deleteUserTool: build.mutation<
      void,
      { userId: number; toolId: number }
    >({
      query: ({ userId, toolId }) => ({
        url: `/api/user-tool/${userId}/${toolId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_r, _e, { userId, toolId }) => [
        { type: "UserTool", id: "LIST" },
        { type: "UserTool", id: `USER_${userId}` },
        { type: "UserTool", id: `TOOL_${toolId}` },
        { type: "UserTool", id: `${userId}_${toolId}` },
      ],
    }),
  }),
});

export const {
  useGetAllUserToolsQuery,
  useGetUserToolsByUserIdQuery,
  useGetUserToolsByToolIdQuery,
  useGetUserToolByIdsQuery,
  useAddUserToolMutation,
  useUpdateUserToolQuantityMutation,
  useDeleteUserToolMutation,
} = userToolsApi;
