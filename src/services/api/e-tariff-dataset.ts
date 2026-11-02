import {
	IBodyGetPresignedUrl,
	IResponsePresignedUrl
} from "@/types/requests/customs-health-check";
import {
	IBodyDatasetProcessAsync,
	IResponseDatasetProcessAsync,
	IResponseDatasetTask
} from "@/types/requests/e-tariff-dataset";

import { request } from "../axios";

export const getDatasetUploadUrl = (params: IBodyGetPresignedUrl) =>
	request.get<any, IResponsePresignedUrl>("/report/upload-url", params);

export const processDatasetAsync = (body: IBodyDatasetProcessAsync) =>
	request.post<IBodyDatasetProcessAsync, IResponseDatasetProcessAsync>(
		"/report/e-tariff/process/async",
		body
	);

export const processDatasetPolling = (taskId: string) =>
	request.get<any, IResponseDatasetTask>(`/report/e-tariff/task/${taskId}`);
