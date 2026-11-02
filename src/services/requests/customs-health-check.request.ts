import {
	getPresignedUrl,
	processConsistencyAnalysisAsync,
	processConsistencyAnalysisAsyncPolling
} from "../api/customs-health-check";
import useAppMutation, { AppMutationOptions } from "../hooks/useAppMutation";

export const useGetPresignedUrl = (options?: AppMutationOptions) => {
	return useAppMutation(getPresignedUrl, {
		useAppMutationProps: options
	});
};

export const useProcessConsistencyAnalysisAsync = (
	options?: AppMutationOptions
) => {
	return useAppMutation(processConsistencyAnalysisAsync, {
		useAppMutationProps: options
	});
};

export const useProcessConsistencyAnalysisAsyncPolling = (
	options?: AppMutationOptions
) => {
	return useAppMutation(processConsistencyAnalysisAsyncPolling, {
		useAppMutationProps: options
	});
};
