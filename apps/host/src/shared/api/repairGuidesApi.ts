import type { IRepairGuide } from "../types";
import { baseApi } from "./baseApi";

type RepairGuideCreateBody = Omit<
  IRepairGuide,
  "id" | "created_at" | "updated_at"
>;

export const repairGuidesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getRepairGuidesByUserId: build.query<IRepairGuide[], number>({
      query: (userId) => `/api/repair-guides/user/${userId}`,
      providesTags: (_r, _e, userId) => [
        { type: "RepairGuide", id: `USER_${userId}` },
      ],
    }),
    getRepairGuideById: build.query<IRepairGuide, number>({
      query: (id) => `/api/repair-guide/${id}`,
      providesTags: (_r, _e, id) => [{ type: "RepairGuide", id }],
    }),
    createRepairGuide: build.mutation<IRepairGuide, RepairGuideCreateBody>({
      query: (body) => ({ url: "/api/repair-guide", method: "POST", body }),
      invalidatesTags: (_r, _e, body) => [
        { type: "RepairGuide", id: `USER_${body.user_id}` },
        { type: "RepairGuide", id: "LIST" },
      ],
    }),
    updateRepairGuide: build.mutation<
      IRepairGuide,
      { id: number; patch: Partial<IRepairGuide> }
    >({
      query: ({ id, patch }) => ({
        url: `/api/repair-guide/${id}`,
        method: "PATCH",
        body: patch,
      }),
      invalidatesTags: (_r, _e, { id, patch }) => {
        const tags: Array<{ type: "RepairGuide"; id: number | string }> = [
          { type: "RepairGuide", id },
          { type: "RepairGuide", id: "LIST" },
        ];
        if (patch.user_id !== undefined) {
          tags.push({ type: "RepairGuide", id: `USER_${patch.user_id}` });
        }
        return tags;
      },
    }),
    deleteRepairGuide: build.mutation<void, number>({
      query: (id) => ({ url: `/api/repair-guide/${id}`, method: "DELETE" }),
      invalidatesTags: (_r, _e, id) => [
        { type: "RepairGuide", id },
        { type: "RepairGuide", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetRepairGuidesByUserIdQuery,
  useGetRepairGuideByIdQuery,
  useCreateRepairGuideMutation,
  useUpdateRepairGuideMutation,
  useDeleteRepairGuideMutation,
} = repairGuidesApi;
