import type { IDevice } from "../types";
import { baseApi } from "./baseApi";

type DeviceCreateBody = Omit<IDevice, 'id' | 'created_at' | 'updated_at'>;

export const deviceApi = baseApi.injectEndpoints({
    endpoints: (build) => ({
        getDevicesByUserId: build.query<IDevice[], number>({
            query: (userId) => `/api/devices/user/${userId}`,
            providesTags: (_r, _e, userId) => [{ type: 'Device', id: `USER_${userId}` }],
        }),
        getDeviceById: build.query<IDevice, number>({
            query: (id) => `/api/device/${id}`,
            providesTags: (_r, _e, id) => [{ type: 'Device', id }],
        }),
        createDevice: build.mutation<IDevice, DeviceCreateBody>({
            query: (body) => ({ url: '/api/device', method: 'POST', body }),
            invalidatesTags: (_r, _e, body) => [
                { type: 'Device', id: `USER_${body.user_id}` },
                { type: 'Device', id: 'LIST' },
            ],
        }),
        updateDevice: build.mutation<IDevice, { id: number; patch: Partial<IDevice> }>({
            query: ({ id, patch }) => ({ url: `/api/device/${id}`, method: 'PATCH', body: patch }),
            invalidatesTags: (_r, _e, { id, patch }) => {
                const tags: Array<{ type: 'Device'; id: number | string }> = [
                    { type: 'Device', id },
                    { type: 'Device', id: 'LIST' },
                ];
                if (patch.user_id !== undefined) {
                    tags.push({ type: 'Device', id: `USER_${patch.user_id}` });
                }
                return tags;
            },
        }),
        deleteDevice: build.mutation<void, number>({
            query: (id) => ({ url: `/api/device/${id}`, method: 'DELETE' }),
            invalidatesTags: (_r, _e, id) => [{ type: 'Device', id }, { type: 'Device', id: 'LIST' }],
        }),
    })
})

export const {
    useGetDevicesByUserIdQuery,
    useGetDeviceByIdQuery,
    useCreateDeviceMutation,
    useUpdateDeviceMutation,
    useDeleteDeviceMutation
} = deviceApi;