import {
	getDatasetUploadUrl,
	processDatasetAsync,
	processDatasetPolling
} from "../api/e-tariff-dataset";
import useAppMutation, { AppMutationOptions } from "../hooks/useAppMutation";

export const useDatasetUploadUrl = (options?: AppMutationOptions) =>
	useAppMutation(getDatasetUploadUrl, {
		useAppMutationProps: options
	});

export const useProcessDatasetAsync = (options?: AppMutationOptions) =>
	useAppMutation(processDatasetAsync, {
		useAppMutationProps: options
	});

export const useProcessDatasetPolling = (options?: AppMutationOptions) =>
	useAppMutation(processDatasetPolling, {
		useAppMutationProps: options
	});
