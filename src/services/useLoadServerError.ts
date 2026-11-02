import {
	FieldValues,
	UseFormGetValues,
	UseFormSetError
} from "react-hook-form";

import { find, forEach } from "lodash";
import { toast } from "sonner";

import { ApiError, BusinessError, ValidationError } from "@/types";
import { HTTP_STATUS } from "@/constants";

import { useQuotaStore } from "@/stores/quota-store";

type ARGS = {
	error: ApiError;
	getValues?: UseFormGetValues<FieldValues>;
	setError?: UseFormSetError<FieldValues>;
};

export default function useLoadServerError() {
	const loadServerErrors = (args: ARGS) => {
		const { error, getValues, setError } = args;

		if (!error) {
			return;
		}

		const isClientError =
			!Object.prototype.hasOwnProperty.call(error, "data") &&
			!!error.statusText;
		if (isClientError) {
			showError({ message: error.statusText });
			return;
		}

		const response = error;

		if (response.status === HTTP_STATUS.UNAUTHORIZED) {
			showError(response?.data?.detail);
			return;
		}

		if (response.status === HTTP_STATUS.PAYMENT_REQUIRED) {
			showError(
				"Insufficient LLM credits. Please add more tokens to continue."
			);
			return;
		}

		if (response.status === HTTP_STATUS.FORBIDDEN) {
			showError(response?.data?.detail || "Engagement code is invalid.");
			return;
		}

		if (response.status === HTTP_STATUS.INTERNAL_SERVER_ERROR) {
			showError(
				response?.data?.detail ||
					"Server error has occurred. Please try again later."
			);
			return;
		}

		if (
			typeof getValues === "function" &&
			typeof setError === "function" &&
			response.status === HTTP_STATUS.VALIDATION_ERROR
		) {
			const data = response.data as ValidationError;
			attachErrorsIntoForm(data, getValues, setError);
			return;
		}
		const data = response.data as BusinessError;
		showError(data.detail || []);
	};

	const attachErrorsIntoForm = (
		data: ValidationError,
		getValues: UseFormGetValues<FieldValues>,
		setError: UseFormSetError<FieldValues>
	) => {
		let errorLoaded = false;

		const formValues = getValues();
		forEach(formValues, (_: string, key: string) => {
			const info = find(
				data.detail,
				(item: { field: string }) => item.field === key
			);
			if (!info) {
				return;
			}

			errorLoaded = true;
			// TODO handler i18n with item.key
			setError(key, { type: "custom", message: info.message as string });
		});

		if (errorLoaded) {
			return;
		}

		// show toast message
		let message = "Some fields are invalid";
		const info = data.detail[0].message;
		if (info) {
			message = info;
		}
		showError(message);
	};

	const showError = (error: any) => {
		// TODO handler i18n with error.key
		let message = error[0]?.message || error;

		if (typeof message === "string") {
			const normalized = message.toLowerCase();
			const isQuotaError =
				/insufficient[_ ]quota|exceeded your current quota|quota exceeded/.test(
					normalized
				);
			if (isQuotaError) {
				message =
					"Insufficient LLM credits. Please add more tokens to continue.";
				useQuotaStore.getState().setQuotaBlocked(true);
			}
		}

		if (message === "canceled") {
			return;
		}

		if (message === "Network Error" || message === "timeout exceeded") {
			message = "Network error has occurred. Please try again later.";
		}

		if (message === "Too Many Attempts.") {
			message = "Please wait while the page is reloading.";
		}

		toast.error(`${message}`);
	};

	return {
		loadServerErrors
	};
}
