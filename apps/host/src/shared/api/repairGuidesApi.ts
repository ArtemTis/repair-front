import type { IRepairGuide } from "../types";
import { baseApi } from "./baseApi";

type RepairGuideCreateBody = Omit<
  IRepairGuide,
  "id" | "created_at" | "updated_at"
>;

export const repairGuidesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getMyRepairGuides: build.query<IRepairGuide[], void>({
      query: () => "/api/me/repair-guides",
      providesTags: [{ type: "RepairGuide", id: "LIST" }],
    }),
    getRepairGuideById: build.query<IRepairGuide, number>({
      query: (id) => `/api/me/repair-guides/${id}`,
      providesTags: (_r, _e, id) => [{ type: "RepairGuide", id }],
    }),
    createRepairGuide: build.mutation<IRepairGuide, RepairGuideCreateBody>({
      query: (body) => ({ url: "/api/me/repair-guides", method: "POST", body }),
      invalidatesTags: [{ type: "RepairGuide", id: "LIST" }],
    }),
    updateRepairGuide: build.mutation<
      IRepairGuide,
      { id: number; patch: Partial<IRepairGuide> }
    >({
      query: ({ id, patch }) => ({
        url: `/api/me/repair-guides/${id}`,
        method: "PATCH",
        body: patch,
      }),
      invalidatesTags: (_r, _e, { id }) => {
        const tags: Array<{ type: "RepairGuide"; id: number | string }> = [
          { type: "RepairGuide", id },
          { type: "RepairGuide", id: "LIST" },
        ];
        return tags;
      },
    }),
    deleteRepairGuide: build.mutation<void, number>({
      query: (id) => ({ url: `/api/me/repair-guides/${id}`, method: "DELETE" }),
      invalidatesTags: (_r, _e, id) => [
        { type: "RepairGuide", id },
        { type: "RepairGuide", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetMyRepairGuidesQuery,
  useGetRepairGuideByIdQuery,
  useCreateRepairGuideMutation,
  useUpdateRepairGuideMutation,
  useDeleteRepairGuideMutation,
} = repairGuidesApi;
