import { cookieStorageHelper } from "@/helpers/store-helper";
import Axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";

import { useEngagementStore } from "@/stores/engagement-store";
import { useQuotaStore } from "@/stores/quota-store";

interface CustomAxiosRequestConfig<D = any> extends AxiosRequestConfig<D> {
	skipAuth?: boolean;
	skipQuotaGuard?: boolean;
}

const QUOTA_BLOCK_MESSAGE =
	"Insufficient LLM credits, please add more tokens to run tool";

const isQuotaMessage = (value: unknown) => {
	if (typeof value !== "string") {
		return false;
	}
	const normalized = value.toLowerCase();
	return (
		normalized.includes("insufficient quota") ||
		normalized.includes("exceeded your current quota") ||
		normalized.includes("quota exceeded")
	);
};

const axiosInstance = Axios.create({
	timeout: 0,
	baseURL: process.env.NEXT_PUBLIC_API_URL
	// withCredentials: true,
	// headers: {
	//   Cookie: `abuse_interstitial=${process.env.NEXT_PUBLIC_KEY_COOKIE}`,
	// },
});

// let isRefreshing = false;
// let failedRequestsQueue: Array<FailedRequest> = [];

axiosInstance.interceptors.request.use(
	async (config: any) => {
		if (!config?.skipQuotaGuard) {
			const quotaState = useQuotaStore.getState();
			if (quotaState.isQuotaBlocked) {
				return Promise.reject({
					status: 402,
					data: { detail: QUOTA_BLOCK_MESSAGE }
				});
			}
		}

		if (config.skipAuth) {
			return config;
		}

		const token = cookieStorageHelper.get("access_token");
		const engagementCode = useEngagementStore.getState().engagementCode;
		return {
			...config,
			headers: {
				...config.headers,
				Authorization: `Bearer ${token}`,
				...(engagementCode ? { "X-Engagement-Code": engagementCode } : {})
			}
		};
	},
	(error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
	(response: AxiosResponse) => handleAxiosResponse(response),
	async (error: AxiosError) => {
		const response = error.response as any;
		const detail = response?.data?.detail;
		if (response?.status === 402 || isQuotaMessage(detail)) {
			useQuotaStore.getState().setQuotaBlocked(true);
		}
		return Promise.reject(response);
	}
);

const handleAxiosResponse = async (response: AxiosResponse<any, any>) => {
	return response.data;
};

export const request = {
	get<ReqType, ResType>(
		url: string,
		params?: ReqType,
		config?: CustomAxiosRequestConfig<ReqType>
	): Promise<ResType> {
		return axiosInstance.get(url, {
			params,
			...config
		});
	},
	post<ReqType, ResType>(
		url: string,
		data?: ReqType,
		config?: CustomAxiosRequestConfig<ReqType>
	): Promise<ResType> {
		return axiosInstance.post(url, data, config);
	},
	put<ReqType, ResType>(url: string, data?: ReqType): Promise<ResType> {
		return axiosInstance.put(url, data);
	},
	patch<ReqType, ResType>(
		url: string,
		data?: ReqType,
		config?: CustomAxiosRequestConfig<ReqType>
	): Promise<ResType> {
		return axiosInstance.patch(url, data, config);
	},
	delete<ReqType, ResType>(
		url: string,
		data?: ReqType,
		config?: CustomAxiosRequestConfig<ReqType>
	): Promise<ResType> {
		return axiosInstance.delete(url, { data, ...config });
	}
};
