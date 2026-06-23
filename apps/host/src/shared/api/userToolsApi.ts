import type { IUserTool } from "../types";
import { baseApi } from "./baseApi";

export const userToolsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getMyUserTools: build.query<IUserTool[], void>({
      query: () => "/api/me/user-tools",
      providesTags: [{ type: "UserTool", id: "LIST" }],
    }),
    getUserToolsByToolId: build.query<IUserTool[], number>({
      query: (toolId) => `/api/me/user-tools/tool/${toolId}`,
      providesTags: (_r, _e, toolId) => [
        { type: "UserTool", id: `TOOL_${toolId}` },
      ],
    }),
    getUserToolByIds: build.query<
      IUserTool,
      number
    >({
      query: (toolId) => `/api/me/user-tools/${toolId}`,
      providesTags: (_r, _e, toolId) => [
        { type: "UserTool", id: toolId },
      ],
    }),
    addUserTool: build.mutation<IUserTool, IUserTool>({
      query: (body) => ({ url: "/api/me/user-tools", method: "POST", body }),
      invalidatesTags: (_r, _e, { tool_id }) => [
        { type: "UserTool", id: "LIST" },
        { type: "UserTool", id: `TOOL_${tool_id}` },
      ],
    }),
    updateUserToolQuantity: build.mutation<
      IUserTool,
      { toolId: number; quantity: number }
    >({
      query: ({ toolId, quantity }) => ({
        url: `/api/me/user-tools/${toolId}`,
        method: "PATCH",
        body: { quantity },
      }),
      invalidatesTags: (_r, _e, { toolId }) => [
        { type: "UserTool", id: "LIST" },
        { type: "UserTool", id: `TOOL_${toolId}` },
        { type: "UserTool", id: toolId },
      ],
    }),
    deleteUserTool: build.mutation<
      void,
      number
    >({
      query: (toolId) => ({
        url: `/api/me/user-tools/${toolId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_r, _e, toolId) => [
        { type: "UserTool", id: "LIST" },
        { type: "UserTool", id: `TOOL_${toolId}` },
        { type: "UserTool", id: toolId },
      ],
    }),
  }),
});

export const {
  useGetMyUserToolsQuery,
  useGetUserToolsByToolIdQuery,
  useGetUserToolByIdsQuery,
  useAddUserToolMutation,
  useUpdateUserToolQuantityMutation,
  useDeleteUserToolMutation,
} = userToolsApi;
