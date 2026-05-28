import type { IArticle } from "../types";
import { baseApi } from "./baseApi";

export const articlesApi = baseApi.injectEndpoints({
    endpoints: (build) => ({
        getArticles: build.query<IArticle[], void>({
            query: () => '/api/articles',
            providesTags: (result) =>
                result
                    ? [
                        ...result.map(({ id }) => ({ type: 'Article' as const, id })),
                        { type: 'Article', id: 'LIST' },
                    ]
                    : [{ type: 'Article', id: 'LIST' }],
        }),
        getArticleById: build.query<IArticle, number>({
            query: (id) => `/api/articles/${id}`,
            providesTags: (_r, _e, id) => [{ type: 'Article', id }],
        }),
    }),
})

export const { useGetArticlesQuery, useGetArticleByIdQuery } = articlesApi;