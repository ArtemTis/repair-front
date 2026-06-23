import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { RootState } from "../store/store";

const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

export const baseApi = createApi({
    reducerPath: 'api',
    baseQuery: fetchBaseQuery({
        baseUrl: BASE_URL,
        credentials: 'include',
        prepareHeaders: (headers, { getState }) => {
            const token = (getState() as RootState).auth.accessToken;

            if (!headers.has('Content-Type')) {
                headers.set('Content-Type', 'application/json');
            }
            if (token) {
                headers.set('Authorization', `Bearer ${token}`);
            }
            return headers;
        },
    }),
    tagTypes: [
        'User',
        'Tool',
        'Device',
        'RepairGuide',
        'RepairHistory',
        'AssistantChat',
        'UserTool',
        'RepairGuideTool',
        'Skill',
        'Article',
    ],
    endpoints: (build) => ({})
});