import {
	IBodyGetPresignedUrl,
	IBodyReportProcessAsync,
	IResponsePresignedUrl,
	IResponseReport,
	IResponseReportProcessAsync
} from "@/types/requests/customs-health-check";

import { request } from "../axios";

export const getPresignedUrl = (params: IBodyGetPresignedUrl) =>
	request.get<any, IResponsePresignedUrl>("/report/upload-url", params);

export const processConsistencyAnalysisAsync = (
	body: IBodyReportProcessAsync
) =>
	request.post<IBodyReportProcessAsync, IResponseReportProcessAsync>(
		"/report/process/async",
		body
	);

export const processConsistencyAnalysisAsyncPolling = (taskId: string) =>
	request.get<any, IResponseReport>(`/report/task/${taskId}`);
