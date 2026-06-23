import type { ISkills } from "../types";
import { baseApi } from "./baseApi";

export const skillsApi = baseApi.injectEndpoints({
    endpoints: (build) => ({
        getSkills: build.query<ISkills[], void>({
            query: () => '/api/skills',
            providesTags: [{ type: 'Skill', id: 'LIST' }],
        }),
        getSkillById: build.query<ISkills, number>({
            query: (id) => `/api/skill/${id}`,
            providesTags: (_r, _e, id) => [{ type: 'Skill', id }],
        })
    })
})

export const { useGetSkillsQuery, useGetSkillByIdQuery } = skillsApi;