import type { IRepairHistory } from "../types";
import { baseApi } from "./baseApi";

type RepairHistoryCreateBody = Pick<IRepairHistory, 'device_id' | 'issue_description'> &
    Partial<
        Omit<IRepairHistory, 'id' | 'created_at' | 'updated_at' | 'device_id' | 'issue_description'>
    >;

export const repairHistoryApi = baseApi.injectEndpoints({
    endpoints: (build) => ({
        getMyRepairHistory: build.query<IRepairHistory[], void>({
            query: () => '/api/me/repair-history',
            providesTags: [{ type: 'RepairHistory', id: 'LIST' }],
        }),
        getRepairHistoryById: build.query<IRepairHistory, number>({
            query: (id) => `/api/me/repair-history/${id}`,
            providesTags: (_r, _e, id) => [
                { type: 'RepairHistory', id },
                { type: 'RepairHistory', id: 'LIST' }
            ],
        }),
        createRepairHistory: build.mutation<IRepairHistory, RepairHistoryCreateBody>({
            query: (body) => ({ url: '/api/me/repair-history', method: 'POST', body }),
            invalidatesTags: [{ type: 'RepairHistory', id: 'LIST' }],
        }),
        updateRepairHistory: build.mutation<
            IRepairHistory,
            { id: number; patch: Partial<IRepairHistory> }
        >({
            query: ({ id, patch }) => ({
                url: `/api/me/repair-history/${id}`,
                method: 'PATCH',
                body: patch,
            }),
            invalidatesTags: (_r, _e, { id }) => [
                { type: 'RepairHistory', id },
                { type: 'RepairHistory', id: 'LIST' },
            ],
            async onQueryStarted({ id, patch }, { dispatch, queryFulfilled }) {
                const patchResult = dispatch(
                    repairHistoryApi.util.updateQueryData('getMyRepairHistory', undefined, (draft) => {
                        const record = draft.find((item) => item.id === id);
                        if (record) {
                            Object.assign(record, patch);
                        }
                    })
                );
                try {
                    const { data } = await queryFulfilled;
                    dispatch(
                        repairHistoryApi.util.updateQueryData('getMyRepairHistory', undefined, (draft) => {
                            const index = draft.findIndex((item) => item.id === id);
                            if (index !== -1) {
                                draft[index] = data;
                            }
                        })
                    );
                } catch {
                    patchResult.undo();
                }
            },
        }),
        deleteRepairHistory: build.mutation<void, number>({
            query: (id) => ({ url: `/api/me/repair-history/${id}`, method: 'DELETE' }),
            invalidatesTags: (_r, _e, id) => [
                { type: 'RepairHistory', id },
                { type: 'RepairHistory', id: 'LIST' },
            ],
        })
    })
})

export const {
    useGetMyRepairHistoryQuery,
    useGetRepairHistoryByIdQuery,
    useCreateRepairHistoryMutation,
    useUpdateRepairHistoryMutation,
    useDeleteRepairHistoryMutation
} = repairHistoryApi;