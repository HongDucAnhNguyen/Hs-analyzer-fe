import {
	IBodyHsCodeAnalyze,
	IBodyHsCodeSearch,
	IHsCodeAnalyzeResponse,
	IResponseHsCode,
	IResponseHsCodeAsync,
	IResponseHsCodeCompendium,
	IResponseHsDatabase,
	IResponseHsDatabaseAsync,
	IResponseHsRuling
} from "@/types/requests/e-tariff-classification";

import { request } from "../axios";

// export const hsCodeSearch = (body: IBodyHsCodeSearch) =>
//   request.post<IBodyHsCodeSearch, IResponseHsCode>('/search/hscode', body);

// export const hsCodeSearch = (body: IBodyHsCodeSearch) =>
//   request.post<IBodyHsCodeSearch, IResponseHsCode>('/classify', body);

export const hsCodeSearchAsync = (body: IBodyHsCodeSearch) =>
	request.post<IBodyHsCodeSearch, IResponseHsCodeAsync>(
		"/classify/async",
		body
	);

export const hsCodeSearchAsyncPolling = (taskId: string) =>
	request.get<any, IResponseHsCode>(`/classify/async/${taskId}`);

export const hsCodeSearchCompendium = (body: IBodyHsCodeSearch) =>
	request.post<IBodyHsCodeSearch, IResponseHsCodeCompendium>(
		"/search/compendium",
		body
	);

export const hsCodeSearchAsean = (body: IBodyHsCodeSearch) =>
	request.post<IBodyHsCodeSearch, IResponseHsCodeCompendium>(
		"/search/asean",
		body
	);

export const hsRulingSearch = (body: IBodyHsCodeSearch) =>
	request.post<IBodyHsCodeSearch, IResponseHsRuling>("/crawl/hs-ruling", body);

export const hsDatabaseSearchAsync = (body: IBodyHsCodeSearch) =>
	request.post<IBodyHsCodeSearch, IResponseHsDatabaseAsync>(
		"/crawl/hs_database/async",
		body
	);

export const hsDatabaseSearchAsyncPolling = (taskId: string) =>
	request.get<any, IResponseHsDatabase>(`/crawl/hs_database/async/${taskId}`);

export const analyzeHsCodes = (body: IBodyHsCodeAnalyze) =>
	request.post<IBodyHsCodeAnalyze, IHsCodeAnalyzeResponse>(
		"/analyze/hs-codes",
		body
	);
