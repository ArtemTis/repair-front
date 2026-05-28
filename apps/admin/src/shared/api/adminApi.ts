import type { AdminStats, AdminUser, SkillLevel } from "../types";
import { baseApi } from "./baseApi";

export const adminApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getAdminStats: build.query<AdminStats, void>({
      query: () => "/api/admin/stats",
      providesTags: [{ type: "AdminStats", id: "SUMMARY" }],
    }),
    getAdminUsers: build.query<AdminUser[], void>({
      query: () => "/api/admin/users",
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "AdminUser" as const, id })),
              { type: "AdminUser", id: "LIST" },
            ]
          : [{ type: "AdminUser", id: "LIST" }],
    }),
    updateUserSkillLevel: build.mutation<
      AdminUser,
      { userId: number; skillLevelId: number }
    >({
      query: ({ userId, skillLevelId }) => ({
        url: `/api/admin/users/${userId}/skill-level`,
        method: "PATCH",
        body: { skill_level_id: skillLevelId },
      }),
      invalidatesTags: (_result, _error, { userId }) => [
        { type: "AdminUser", id: userId },
        { type: "AdminUser", id: "LIST" },
        { type: "AdminStats", id: "SUMMARY" },
      ],
    }),
    getSkillLevels: build.query<SkillLevel[], void>({
      query: () => "/api/skills",
      providesTags: [{ type: "Skill", id: "LIST" }],
    }),
  }),
});

export const {
  useGetAdminStatsQuery,
  useGetAdminUsersQuery,
  useUpdateUserSkillLevelMutation,
  useGetSkillLevelsQuery,
} = adminApi;
