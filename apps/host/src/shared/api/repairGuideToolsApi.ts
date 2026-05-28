import type { IRepairGuideTool } from "../types";
import { baseApi } from "./baseApi";

export const repairGuideToolsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getAllRepairGuideTools: build.query<IRepairGuideTool[], void>({
      query: () => "/api/repair-guide-tools",
      providesTags: [{ type: "RepairGuideTool", id: "LIST" }],
    }),
    getRepairGuideToolsByGuideId: build.query<IRepairGuideTool[], number>({
      query: (guideId) => `/api/repair-guide-tools/guide/${guideId}`,
      providesTags: (_r, _e, guideId) => [
        { type: "RepairGuideTool", id: `GUIDE_${guideId}` },
      ],
    }),
    getRepairGuideToolsByToolId: build.query<IRepairGuideTool[], number>({
      query: (toolId) => `/api/repair-guide-tools/tool/${toolId}`,
      providesTags: (_r, _e, toolId) => [
        { type: "RepairGuideTool", id: `TOOL_${toolId}` },
      ],
    }),
    getRepairGuideToolByIds: build.query<
      IRepairGuideTool,
      { guideId: number; toolId: number }
    >({
      query: ({ guideId, toolId }) =>
        `/api/repair-guide-tool/${guideId}/${toolId}`,
      providesTags: (_r, _e, { guideId, toolId }) => [
        { type: "RepairGuideTool", id: `${guideId}_${toolId}` },
      ],
    }),
    addRepairGuideTool: build.mutation<
      IRepairGuideTool,
      IRepairGuideTool
    >({
      query: (body) => ({
        url: "/api/repair-guide-tool",
        method: "POST",
        body,
      }),
      invalidatesTags: (_r, _e, body) => [
        { type: "RepairGuideTool", id: "LIST" },
        { type: "RepairGuideTool", id: `GUIDE_${body.repair_guide_id}` },
        { type: "RepairGuideTool", id: `TOOL_${body.tool_id}` },
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
        method: "PATCH",
        body: patch,
      }),
      invalidatesTags: (_r, _e, { guideId, toolId }) => [
        { type: "RepairGuideTool", id: "LIST" },
        { type: "RepairGuideTool", id: `GUIDE_${guideId}` },
        { type: "RepairGuideTool", id: `TOOL_${toolId}` },
        { type: "RepairGuideTool", id: `${guideId}_${toolId}` },
      ],
    }),
    deleteRepairGuideTool: build.mutation<
      void,
      { guideId: number; toolId: number }
    >({
      query: ({ guideId, toolId }) => ({
        url: `/api/repair-guide-tool/${guideId}/${toolId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_r, _e, { guideId, toolId }) => [
        { type: "RepairGuideTool", id: "LIST" },
        { type: "RepairGuideTool", id: `GUIDE_${guideId}` },
        { type: "RepairGuideTool", id: `TOOL_${toolId}` },
        { type: "RepairGuideTool", id: `${guideId}_${toolId}` },
      ],
    }),
  }),
});

export const {
  useGetAllRepairGuideToolsQuery,
  useGetRepairGuideToolsByGuideIdQuery,
  useGetRepairGuideToolsByToolIdQuery,
  useGetRepairGuideToolByIdsQuery,
  useAddRepairGuideToolMutation,
  useUpdateRepairGuideToolMutation,
  useDeleteRepairGuideToolMutation,
} = repairGuideToolsApi;
