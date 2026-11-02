import { ApiError } from '@/types';
import {
  DefaultError,
  MutationFunction,
  UseMutationOptions,
  UseMutationResult,
  useMutation,
} from '@tanstack/react-query';
import { UseFormGetValues, UseFormSetError } from 'react-hook-form';
import useLoadServerError from '../useLoadServerError';

export interface AppMutationOptions {
  getValues?: UseFormGetValues<any>;
  setError?: UseFormSetError<any>;
  customError?: boolean;
}

export interface useAppMutationProps<TData, TError, TVariables, TContext> {
  useAppMutationProps?: AppMutationOptions;
  queryOptions?: UseMutationOptions<TData, TError, TVariables, TContext>;
}

export default function useAppMutation<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TContext = unknown
>(
  mutationFn: MutationFunction<TData, TVariables>,
  props?: useAppMutationProps<TData, TError, TVariables, TContext>
): UseMutationResult<TData, TError, TVariables, TContext> {
  const { loadServerErrors } = useLoadServerError();
  const mutation = useMutation({
    ...props?.queryOptions,
    mutationFn,
    onError: (error) => {
      !props?.useAppMutationProps?.customError &&
        loadServerErrors({ error: error as unknown as ApiError, ...props?.useAppMutationProps });
      return;
    },
  });

  const safeMutate = (...args: Parameters<typeof mutation.mutate>) => {
    if (!mutation.isPending) {
      return mutation.mutate(...args);
    }
  };

  const safeMutateAsync = (...args: Parameters<typeof mutation.mutateAsync>): Promise<TData> => {
    if (!mutation.isPending) {
      return mutation.mutateAsync(...args);
    }

    return Promise.resolve(undefined as unknown as TData);
  };

  return { ...mutation, mutate: safeMutate, mutateAsync: safeMutateAsync };
}
