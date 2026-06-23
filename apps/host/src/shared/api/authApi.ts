import type { IAuthResponse, IAuthUser, ILoginBody, IRegisterBody } from "../types";
import { baseApi } from "./baseApi";

export const authApi = baseApi.injectEndpoints({
    endpoints: (build) => ({
        login: build.mutation<IAuthResponse, ILoginBody>({
            query: (body) => ({ url: '/api/auth/login', method: 'POST', body }),
        }),
        register: build.mutation<IAuthResponse, IRegisterBody>({
            query: (body) => ({ url: '/api/auth/register', method: 'POST', body }),
            invalidatesTags: [{ type: 'User', id: 'LIST' }],
        }),
        refresh: build.mutation<IAuthResponse, void>({
            query: () => ({ url: '/api/auth/refresh', method: 'POST' }),
        }),
        logoutFromServer: build.mutation<{ message: string }, void>({
            query: () => ({ url: '/api/auth/logout', method: 'POST' }),
        }),
        me: build.query<{ user: IAuthUser }, void>({
            query: () => '/api/auth/me',
        }),
    })
});

export const {
    useLoginMutation,
    useRegisterMutation,
    useRefreshMutation,
    useLogoutFromServerMutation,
    useMeQuery
} = authApi;