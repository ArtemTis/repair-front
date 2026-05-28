import type { IUser } from "../types";
import { baseApi } from "./baseApi";

type UserCreateBody = Omit<IUser, "id" | "created_at" | "updated_at">;
type UserUpdateBody = Partial<
  Omit<IUser, "id" | "email" | "created_at" | "updated_at">
>;

export const usersApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getUsers: build.query<IUser[], void>({
      query: () => "/api/users",
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "User" as const, id })),
              { type: "User", id: "LIST" },
            ]
          : [{ type: "User", id: "LIST" }],
    }),
    getUserById: build.query<IUser, number>({
      query: (id) => `/api/user/${id}`,
      providesTags: (_r, _e, id) => [{ type: "User", id }],
    }),
    createUser: build.mutation<IUser, UserCreateBody>({
      query: (body) => ({ url: "/api/user", method: "POST", body }),
      invalidatesTags: [{ type: "User", id: "LIST" }],
    }),
    updateUser: build.mutation<IUser, { id: number; patch: UserUpdateBody }>({
      query: ({ id, patch }) => ({
        url: `/api/user/${id}`,
        method: "PATCH",
        body: patch,
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: "User", id },
        { type: "User", id: "LIST" },
      ],
    }),
    deleteUser: build.mutation<void, number>({
      query: (id) => ({ url: `/api/user/${id}`, method: "DELETE" }),
      invalidatesTags: (_r, _e, id) => [
        { type: "User", id },
        { type: "User", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetUsersQuery,
  useGetUserByIdQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
} = usersApi;
