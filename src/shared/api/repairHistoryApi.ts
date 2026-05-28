import type { IRepairHistory } from "../types";
import { baseApi } from "./baseApi";

type RepairHistoryCreateBody = Pick<IRepairHistory, 'user_id' | 'device_id' | 'issue_description'> &
    Partial<
        Omit<IRepairHistory, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'device_id' | 'issue_description'>
    >;

export const repairHistoryApi = baseApi.injectEndpoints({
    endpoints: (build) => ({
        getRepairHistoryByUserId: build.query<IRepairHistory[], number>({
            query: (userId) => `/api/repair-history/user/${userId}`,
            providesTags: (_r, _e, userId) => [{ type: 'RepairHistory', id: `USER_${userId}` }],
        }),
        getRepairHistoryById: build.query<IRepairHistory, number>({
            query: (id) => `/api/repair-history/${id}`,
            providesTags: (_r, _e, id) => [{ type: 'RepairHistory', id }],
        }),
        createRepairHistory: build.mutation<IRepairHistory, RepairHistoryCreateBody>({
            query: (body) => ({ url: '/api/repair-history', method: 'POST', body }),
            invalidatesTags: (_r, _e, body) => [
                { type: 'RepairHistory', id: `USER_${body.user_id}` },
                { type: 'RepairHistory', id: 'LIST' },
            ],
        }),
        updateRepairHistory: build.mutation<
            IRepairHistory,
            { id: number; userId: number; patch: Partial<IRepairHistory> }
        >({
            query: ({ id, patch }) => ({
                url: `/api/repair-history/${id}`,
                method: 'PATCH',
                body: patch,
            }),
            invalidatesTags: (_r, _e, { id, userId }) => [
                { type: 'RepairHistory', id },
                { type: 'RepairHistory', id: 'LIST' },
                { type: 'RepairHistory', id: `USER_${userId}` },
            ],
            async onQueryStarted({ id, userId, patch }, { dispatch, queryFulfilled }) {
                const patchResult = dispatch(
                    repairHistoryApi.util.updateQueryData('getRepairHistoryByUserId', userId, (draft) => {
                        const record = draft.find((item) => item.id === id);
                        if (record) {
                            Object.assign(record, patch);
                        }
                    })
                );
                try {
                    const { data } = await queryFulfilled;
                    dispatch(
                        repairHistoryApi.util.updateQueryData('getRepairHistoryByUserId', userId, (draft) => {
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
        deleteRepairHistory: build.mutation<void, { id: number; userId: number }>({
            query: ({ id }) => ({ url: `/api/repair-history/${id}`, method: 'DELETE' }),
            invalidatesTags: (_r, _e, { id, userId }) => [
                { type: 'RepairHistory', id },
                { type: 'RepairHistory', id: 'LIST' },
                { type: 'RepairHistory', id: `USER_${userId}` },
            ],
        })
    })
})

export const {
    useGetRepairHistoryByUserIdQuery,
    useGetRepairHistoryByIdQuery,
    useCreateRepairHistoryMutation,
    useUpdateRepairHistoryMutation,
    useDeleteRepairHistoryMutation
} = repairHistoryApi;