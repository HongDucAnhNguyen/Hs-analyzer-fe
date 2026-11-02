export type IBodyGetPresignedUrl = {
	filename: string;
};

export type IResponsePresignedUrl = {
	upload_url: string;
	object_name: string;
	bucket: string;
	expires_in_seconds: string;
	content_type: string;
};

export type IBodyReportProcessAsync = {
	object_name: string;
	input_sections: string[];
	prefill_mode: string;
};

export type IResponseReportProcessAsync = {
	task_id: string;
	status: string;
	message: string;
};

export type IResponseReport = {
	task_id: string;
	error: string;
	status: string;
	result: {
		status: string;
		object_name: string;
		download_url: string;
		expires_in_seconds: 0;
		message: string;
	};
};
