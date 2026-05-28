import type { ITool } from "../types";
import { baseApi } from "./baseApi";

type ToolCreateBody = Omit<ITool, "id" | "created_at" | "updated_at">;

export const toolsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getTools: build.query<ITool[], void>({
      query: () => "/api/tools",
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Tool" as const, id })),
              { type: "Tool", id: "LIST" },
            ]
          : [{ type: "Tool", id: "LIST" }],
    }),
    getToolById: build.query<ITool, number>({
      query: (id) => `/api/tool/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Tool", id }],
    }),
    createTool: build.mutation<ITool, ToolCreateBody>({
      query: (body) => ({ url: "/api/tool", method: "POST", body }),
      invalidatesTags: [{ type: "Tool", id: "LIST" }],
    }),
    updateTool: build.mutation<ITool, { id: number; patch: Partial<ITool> }>({
      query: ({ id, patch }) => ({
        url: `/api/tool/${id}`,
        method: "PATCH",
        body: patch,
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: "Tool", id },
        { type: "Tool", id: "LIST" },
      ],
    }),
    deleteTool: build.mutation<void, number>({
      query: (id) => ({ url: `/api/tool/${id}`, method: "DELETE" }),
      invalidatesTags: (_r, _e, id) => [
        { type: "Tool", id },
        { type: "Tool", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetToolsQuery,
  useGetToolByIdQuery,
  useCreateToolMutation,
  useUpdateToolMutation,
  useDeleteToolMutation,
} = toolsApi;
