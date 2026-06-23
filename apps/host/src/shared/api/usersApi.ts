import type { IAuthUser, IUser } from "../types";
import { baseApi } from "./baseApi";

type UserUpdateBody = Partial<
  Omit<IUser, "id" | "email" | "created_at" | "updated_at">
>;

export const usersApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getMe: build.query<IAuthUser, void>({
      query: () => "/api/me",
      providesTags: [{ type: "User", id: "ME" }],
    }),
    updateMe: build.mutation<IAuthUser, UserUpdateBody>({
      query: (patch) => ({
        url: "/api/me",
        method: "PATCH",
        body: patch,
      }),
      invalidatesTags: [{ type: "User", id: "ME" }],
    }),
    deleteMe: build.mutation<void, void>({
      query: () => ({ url: "/api/me", method: "DELETE" }),
      invalidatesTags: [{ type: "User", id: "ME" }],
    }),
  }),
});

export const {
  useGetMeQuery,
  useUpdateMeMutation,
  useDeleteMeMutation,
} = usersApi;
