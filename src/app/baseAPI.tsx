import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export const EmptySplitApi = createApi({
  baseQuery: fetchBaseQuery({ baseUrl: '/' }),
  endpoints: () => ({}),
});
