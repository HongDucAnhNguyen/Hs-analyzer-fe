import {
	analyzeHsCodes,
	hsCodeSearchAsean,
	hsCodeSearchAsync,
	hsCodeSearchAsyncPolling,
	hsCodeSearchCompendium,
	hsDatabaseSearchAsync,
	hsDatabaseSearchAsyncPolling,
	hsRulingSearch
} from "../api/e-tariff-classification";
import useAppMutation, { AppMutationOptions } from "../hooks/useAppMutation";

// export const useHsCodeSearch = (options: AppMutationOptions) => {
//   return useAppMutation(hsCodeSearch, {
//     useAppMutationProps: options,
//   });
// };

export const useHsCodeSearchAsync = (options: AppMutationOptions) => {
	return useAppMutation(hsCodeSearchAsync, {
		useAppMutationProps: options
	});
};

export const useHsCodeSearchAsyncPolling = (options: AppMutationOptions) => {
	return useAppMutation(hsCodeSearchAsyncPolling, {
		useAppMutationProps: options
	});
};

export const useHsCodeSearchCompendium = (options: AppMutationOptions) => {
	return useAppMutation(hsCodeSearchCompendium, {
		useAppMutationProps: options
	});
};

export const useHsCodeSearchAsean = (options: AppMutationOptions) => {
	return useAppMutation(hsCodeSearchAsean, {
		useAppMutationProps: options
	});
};

export const useHsRulingSearch = (options: AppMutationOptions) => {
	return useAppMutation(hsRulingSearch, {
		useAppMutationProps: options
	});
};

export const useHsDatabaseSearchAsync = (options: AppMutationOptions) => {
	return useAppMutation(hsDatabaseSearchAsync, {
		useAppMutationProps: options
	});
};

export const useHsDatabaseSearchAsyncPolling = (
	options: AppMutationOptions
) => {
	return useAppMutation(hsDatabaseSearchAsyncPolling, {
		useAppMutationProps: options
	});
};

export const useHsCodeAnalyze = (options: AppMutationOptions) => {
	return useAppMutation(analyzeHsCodes, {
		useAppMutationProps: options
	});
};
