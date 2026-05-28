import type { IAuthResponse, ILoginBody, IRegisterBody } from "../types";
import { baseApi } from "./baseApi";

export const authApi = baseApi.injectEndpoints({
    endpoints: (build) => ({
        login: build.mutation<IAuthResponse, ILoginBody>({
            query: (body) => ({ url: '/api/auth/login', method: 'POST', body }),
        }),
        register: build.mutation<IAuthResponse, IRegisterBody>({
            query: (body) => ({ url: '/api/auth/register', method: 'POST', body }),
            invalidatesTags: [{ type: 'User', id: 'LIST' }],
        })
    })
});

export const { useLoginMutation, useRegisterMutation } = authApi;