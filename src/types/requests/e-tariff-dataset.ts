export type IBodyDatasetProcessAsync = {
	object_name: string;
};

export type IResponseDatasetProcessAsync = {
	task_id: string;
	status: string;
	message: string;
};

export type IResponseDatasetTask = {
	task_id: string;
	status: string;
	error?: string;
	progress?: {
		status?: string;
		current_step?: string;
		rows_processed?: number;
		total_rows?: number;
	};
	result?: {
		status: string;
		object_name: string;
		download_url: string;
		expires_in_seconds: number;
		message?: string;
	};
};
