import { ApiError } from '@/types';
import {
  QueryClient,
  QueryKey,
  QueryObserverResult,
  UseQueryOptions,
  UseQueryResult,
  useQuery,
} from '@tanstack/react-query';
import useLoadServerError from '../useLoadServerError';

export type UseAppQueryResult<TData, TError> = Omit<UseQueryResult<TData, TError>, 'refetch'> & {
  refetch: (
    ...args: Parameters<UseQueryResult<TData, TError>['refetch']>
  ) => Promise<QueryObserverResult<TData, TError> | void>;
};

export default function useAppQuery<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey
>(
  options: UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  queryClient?: QueryClient
): UseAppQueryResult<TData, TError> {
  const { loadServerErrors } = useLoadServerError();

  const query = useQuery(options, queryClient);

  const safeRefetch = (
    ...args: Parameters<UseQueryResult<TData, TError>['refetch']>
  ): Promise<QueryObserverResult<TData, TError> | void> => {
    if (!query.isRefetching) {
      return query.refetch(...args);
    }

    return Promise.resolve();
  };

  if (query.isError) {
    loadServerErrors({ error: query.error as unknown as ApiError });
  }

  return { ...query, refetch: safeRefetch, isLoading: query.isLoading || query.isFetching };
}
