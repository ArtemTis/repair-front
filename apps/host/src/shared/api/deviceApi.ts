import type { IDevice } from "../types";
import { baseApi } from "./baseApi";

type DeviceCreateBody = Omit<IDevice, 'id' | 'created_at' | 'updated_at'>;

export const deviceApi = baseApi.injectEndpoints({
    endpoints: (build) => ({
        getMyDevices: build.query<IDevice[], void>({
            query: () => '/api/me/devices',
            providesTags: [{ type: 'Device', id: 'LIST' }],
        }),
        getDeviceById: build.query<IDevice, number>({
            query: (id) => `/api/me/devices/${id}`,
            providesTags: (_r, _e, id) => [{ type: 'Device', id }],
        }),
        createDevice: build.mutation<IDevice, DeviceCreateBody>({
            query: (body) => ({ url: '/api/me/devices', method: 'POST', body }),
            invalidatesTags: [{ type: 'Device', id: 'LIST' }],
        }),
        updateDevice: build.mutation<IDevice, { id: number; patch: Partial<IDevice> }>({
            query: ({ id, patch }) => ({ url: `/api/me/devices/${id}`, method: 'PATCH', body: patch }),
            invalidatesTags: (_r, _e, { id }) => [
                { type: 'Device', id },
                { type: 'Device', id: 'LIST' },
            ],
        }),
        deleteDevice: build.mutation<void, number>({
            query: (id) => ({ url: `/api/me/devices/${id}`, method: 'DELETE' }),
            invalidatesTags: (_r, _e, id) => [{ type: 'Device', id }, { type: 'Device', id: 'LIST' }],
        }),
    })
})

export const {
    useGetMyDevicesQuery,
    useGetDeviceByIdQuery,
    useCreateDeviceMutation,
    useUpdateDeviceMutation,
    useDeleteDeviceMutation
} = deviceApi;