import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

export const baseApi = createApi({
    reducerPath: 'api',
    baseQuery: fetchBaseQuery({
        baseUrl: BASE_URL,
        prepareHeaders: (headers) => {
            if (!headers.has('Content-Type')) {
                headers.set('Content-Type', 'application/json');
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