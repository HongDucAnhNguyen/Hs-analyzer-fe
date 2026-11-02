"use client";

import { useEffect, useState, type ChangeEvent, type DragEvent } from "react";

import clsx from "clsx";
import { CheckCircle, Download, FileText, Upload } from "lucide-react";
import { toast } from "sonner";

import { useEngagementStore } from "@/stores/engagement-store";
import { useQuotaStore } from "@/stores/quota-store";
import {
	useDatasetUploadUrl,
	useProcessDatasetAsync,
	useProcessDatasetPolling
} from "@/services/requests/e-tariff-dataset.request";
import { downloadFile } from "@/lib/utils";

import { BaseButton } from "@/components/common/button";
import { BaseInput } from "@/components/common/input";
import { BaseLabel } from "@/components/common/label";

const STATUS = {
	IDLE: "idle",
	UPLOADING: "uploading",
	UPLOADED: "uploaded",
	PROCESSING: "processing",
	COMPLETED: "completed",
	ERROR: "error"
};

const QUOTA_MESSAGE =
	"Insufficient LLM credits. Please add more tokens to continue.";

const isQuotaMessage = (value?: string | null) => {
	if (!value) {
		return false;
	}
	const normalized = value.toLowerCase();
	return (
		normalized.includes("insufficient quota") ||
		normalized.includes("exceeded your current quota") ||
		normalized.includes("quota exceeded") ||
		normalized.includes("insufficient credits")
	);
};

const getQuotaDetail = (error: any) => {
	return (
		error?.data?.detail ||
		error?.detail ||
		error?.message ||
		error?.data?.error ||
		null
	);
};

export default function DatasetInputPage() {
	const [status, setStatus] = useState(STATUS.IDLE);
	const [fileName, setFileName] = useState("");
	const [objectName, setObjectName] = useState("");
	const [taskId, setTaskId] = useState("");
	const [downloadUrl, setDownloadUrl] = useState("");
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [dragOver, setDragOver] = useState(false);
	const engagementCode = useEngagementStore((state) => state.engagementCode);
	const setEngagementCode = useEngagementStore(
		(state) => state.setEngagementCode
	);
	const setQuotaBlocked = useQuotaStore((state) => state.setQuotaBlocked);
	const isQuotaBlocked = useQuotaStore((state) => state.isQuotaBlocked);

	const { mutate: getUploadUrl } = useDatasetUploadUrl();
	const { mutate: processDataset } = useProcessDatasetAsync();
	const { mutate: pollDataset } = useProcessDatasetPolling();

	const REQUIRED_BASE_NAME = "Public HS data for testing";

	const isValidFileName = (name: string) => {
		const lastDotIndex = name.lastIndexOf(".");
		const baseName = lastDotIndex >= 0 ? name.slice(0, lastDotIndex) : name;
		return baseName === REQUIRED_BASE_NAME;
	};

	useEffect(() => {
		if (!taskId || isQuotaBlocked) {
			return;
		}

		const stopPolling = (interval: ReturnType<typeof setInterval>) => {
			clearInterval(interval);
		};

		const pollOnce = () => {
			pollDataset(taskId, {
				onSuccess: (res) => {
					if (res.status === "FAILURE") {
						stopPolling(interval);
						if (isQuotaMessage(res.error)) {
							setQuotaBlocked(true);
							setTaskId("");
							toast.error(QUOTA_MESSAGE);
							setErrorMessage(QUOTA_MESSAGE);
						} else {
							setErrorMessage(
								res.error || "Đã phát sinh lỗi trong quá trình xử lý."
							);
						}
						setStatus(STATUS.ERROR);
						return;
					}

					const download = res.result?.download_url;
					if (res.status === "SUCCESS" || res.result?.status === "SUCCESS") {
						stopPolling(interval);
						setDownloadUrl(download || "");
						setStatus(STATUS.COMPLETED);
					}
				},
				onError: (error: any) => {
					const detail = getQuotaDetail(error);
					stopPolling(interval);
					if (isQuotaMessage(detail)) {
						setQuotaBlocked(true);
						setTaskId("");
						toast.error(QUOTA_MESSAGE);
						setErrorMessage(QUOTA_MESSAGE);
						setStatus(STATUS.ERROR);
						return;
					}
					setErrorMessage(detail || "Đã phát sinh lỗi trong quá trình xử lý.");
					setStatus(STATUS.ERROR);
				}
			});
		};

		const interval = setInterval(pollOnce, 2000);
		pollOnce();

		return () => stopPolling(interval);
	}, [pollDataset, taskId, isQuotaBlocked, setQuotaBlocked]);

	const startProcessing = (nextObjectName: string) => {
		setStatus(STATUS.PROCESSING);
		setErrorMessage(null);
		processDataset(
			{ object_name: nextObjectName },
			{
				onSuccess: (res) => {
					setTaskId(res.task_id);
				},
				onError: (error: any) => {
					const detail = getQuotaDetail(error);
					if (isQuotaMessage(detail)) {
						setQuotaBlocked(true);
						setTaskId("");
						toast.error(QUOTA_MESSAGE);
						setErrorMessage(QUOTA_MESSAGE);
						setStatus(STATUS.ERROR);
						return;
					}
					setErrorMessage(detail || "Không thể xử lý file.");
					setStatus(STATUS.ERROR);
				}
			}
		);
	};

	const handleContinueProcessing = () => {
		if (!engagementCode) {
			setStatus(STATUS.ERROR);
			setErrorMessage("Engagement code is required to run the tool.");
			return;
		}
		if (isQuotaBlocked) {
			setStatus(STATUS.ERROR);
			setErrorMessage(QUOTA_MESSAGE);
			return;
		}

		if (!objectName) {
			setStatus(STATUS.ERROR);
			setErrorMessage("Không tìm thấy file đã upload. Vui lòng upload lại.");
			return;
		}

		startProcessing(objectName);
	};

	const handleSelectedFile = (file: File) => {
		if (!engagementCode) {
			setStatus(STATUS.ERROR);
			setErrorMessage("Engagement code is required to run the tool.");
			return;
		}
		if (isQuotaBlocked) {
			setStatus(STATUS.ERROR);
			setErrorMessage(QUOTA_MESSAGE);
			return;
		}

		if (!isValidFileName(file.name)) {
			setFileName(file.name);
			setStatus(STATUS.ERROR);
			setErrorMessage(
				`Tên file phải là "${REQUIRED_BASE_NAME}". Vui lòng đổi tên và thử lại.`
			);
			return;
		}

		setFileName(file.name);
		setStatus(STATUS.UPLOADING);
		setErrorMessage(null);
		setObjectName("");

		getUploadUrl(
			{ filename: file.name },
			{
				onSuccess: async (data) => {
					try {
						const response = await fetch(data.upload_url, {
							method: "PUT",
							body: file,
							headers: {
								"Content-Type": file.type || "application/octet-stream"
							}
						});

						if (!response.ok) {
							setStatus(STATUS.ERROR);
							setErrorMessage("Upload thất bại. Vui lòng thử lại.");
							return;
						}

						setObjectName(data.object_name);
						setStatus(STATUS.UPLOADED);
					} catch (error: any) {
						setStatus(STATUS.ERROR);
						setErrorMessage(
							error?.message || "Upload thất bại. Vui lòng thử lại."
						);
					}
				},
				onError: (error: any) => {
					setStatus(STATUS.ERROR);
					setErrorMessage(error?.message || "Không thể lấy upload URL.");
				}
			}
		);
	};

	const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) {
			return;
		}

		handleSelectedFile(file);
	};

	const handleDragOver = (event: DragEvent<HTMLLabelElement>) => {
		event.preventDefault();
		setDragOver(true);
	};

	const handleDragLeave = () => {
		setDragOver(false);
	};

	const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
		event.preventDefault();
		setDragOver(false);

		const file = event.dataTransfer.files?.[0];
		if (!file) {
			return;
		}

		handleSelectedFile(file);
	};

	const handleReset = () => {
		setStatus(STATUS.IDLE);
		setFileName("");
		setObjectName("");
		setTaskId("");
		setObjectName("");
		setDownloadUrl("");
		setErrorMessage(null);
	};

	const handleDownload = () => {
		if (!downloadUrl) {
			return;
		}
		downloadFile(downloadUrl);
	};

	return (
		<div className="flex-1 h-screen overflow-y-auto bg-confident-black">
			<div className="max-w-[90%] px-10 py-12 mx-auto">
				<h1 className="text-3xl font-bold text-yellow-01 mb-8 uppercase">
					Dataset Input{" "}
				</h1>

				<div className="bg-off-black border border-off-white rounded-2xl shadow-xl p-8">
					<div className="flex justify-center">
						<h2 className="text-2xl font-semibold text-white mb-6 border-b-[3px] border-yellow-01">
							Dữ liệu Excel đầu vào
						</h2>
					</div>
					<div className="mb-8">
						<BaseLabel required>Engagement Code</BaseLabel>
						<BaseInput
							value={engagementCode || ""}
							onChange={(event) => setEngagementCode(event.target.value)}
							placeholder="Enter Engagement Code"
							inputClassName="bg-off-black"
							type="password"
						/>
					</div>
					<div className="mt-8">
						{status === STATUS.IDLE && (
							<label
								onDragOver={handleDragOver}
								onDragLeave={handleDragLeave}
								onDrop={handleDrop}
								className={clsx(
									"relative flex flex-col items-center justify-center w-full h-full",
									"border-2 border-dashed border-yellow-01 text-yellow-01 bg-yellow-01/10 rounded-xl cursor-pointer transition-all duration-200"
								)}
							>
								<div
									className={`
										absolute inset-0 bg-confident-black/80
										backdrop-blur-md rounded-xl flex flex-col items-center justify-center
										transition-all duration-300 z-20 pointer-events-none
										${dragOver ? "opacity-100 scale-100" : "opacity-0 scale-95"}
									`}
								>
									<div className="animate-bounce mb-4">
										<Download
											className="w-16 h-16 text-white"
											strokeWidth={2.5}
										/>
									</div>
									<h2 className="text-2xl font-bold text-white mb-2">
										Drop file here to analyze
									</h2>
									<p className="text-white text-sm">
										Release to upload your file
									</p>
								</div>
								<div className="flex flex-col items-center justify-center pt-5 pb-6">
									<Upload className="w-16 h-16 text-yellow-01 mb-4" />
									<p className="mb-2 text-sm">
										<span>Click để upload hoặc kéo thả file</span>
									</p>
									<div className="space-y-4 text-left">
										<div className="bg-yellow-01/5 border-l-4 border-yellow-01 rounded-r-lg p-4">
											<p className="text-white font-semibold text-sm mb-2">
												📋 Chuẩn dữ liệu đầu vào:
											</p>
											<ul className="text-white text-sm space-y-2 ml-6">
												<li className="leading-relaxed">
													• Định dạng excel:{" "}
													<span className="underline font-bold text-yellow-01">
														xlsb
													</span>{" "}
													và{" "}
													<span className="underline font-bold text-yellow-01">
														xlsx
													</span>
													;
												</li>
												<li className="leading-relaxed">
													• Loại bỏ thông tin khách hàng;
												</li>
												<li className="leading-relaxed">
													• Loại bỏ công thức trong file (nếu có);
												</li>
												<li className="leading-relaxed">
													• Định dạng cột dữ liệu:
													<ul className="mt-2 space-y-1 ml-5">
														<li>• Cột A - Commodity Name</li>
														<li>• Cột B - Scientific/Technical Name</li>
														<li>• Cột C - Commodity Description</li>
														<li>• Cột D - Function</li>
														<li>• Cột E - Structure</li>
														<li>• Cột F - Material</li>
														<li>• Cột G - Specifications</li>
														<li>• Cột H - Other Information (optional)</li>
													</ul>
												</li>
												<li className="leading-relaxed">
													• Sửa tên file thành
													<span className="text-yellow-01 font-semibold">
														{'"Public HS data for testing"'}
													</span>
													trước khi upload;
												</li>
											</ul>
										</div>
									</div>
								</div>
								<input
									type="file"
									className="hidden"
									accept=".xlsx,.xlsb"
									onChange={handleFileUpload}
								/>
							</label>
						)}

						{status === STATUS.UPLOADING && (
							<div className="space-y-6">
								<div className="flex items-center gap-4 bg-confident-black/30 border border-off-white rounded-lg p-4">
									<div className="w-12 h-12 bg-yellow-01/10 rounded-lg flex items-center justify-center flex-shrink-0">
										<Upload className="w-6 h-6 text-yellow-01" />
									</div>
									<div className="flex-1 min-w-0">
										<p className="text-sm font-semibold text-white truncate">
											{fileName}
										</p>
										<p className="text-xs text-white">Đang upload file...</p>
									</div>
								</div>
							</div>
						)}

						{status === STATUS.UPLOADED && (
							<div className="space-y-6">
								<div className="flex items-center gap-4 bg-confident-black/30 border border-off-white rounded-lg p-4">
									<div className="w-12 h-12 bg-yellow-01/10 rounded-lg flex items-center justify-center flex-shrink-0">
										<FileText className="w-6 h-6 text-yellow-01" />
									</div>
									<div className="flex-1 min-w-0">
										<p className="text-sm font-semibold text-white truncate">
											{fileName}
										</p>
										<p className="text-xs text-white font-medium">
											Upload thành công. Bạn có thể tiếp tục xử lý hoặc hủy
											upload.
										</p>
									</div>
								</div>

								<BaseButton
									onClick={handleContinueProcessing}
									disabled={!objectName}
									className={`w-full cursor-pointer text-xl bg-yellow-01 text-confident-black font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 ${
										objectName ? "" : "opacity-60 cursor-not-allowed"
									}`}
								>
									Tiếp tục xử lý
								</BaseButton>

								<BaseButton
									onClick={handleReset}
									className="w-full cursor-pointer bg-gray-100 text-confident-black font-medium py-2 px-4 rounded-lg transition-colors duration-200"
								>
									Hủy và upload lại
								</BaseButton>
							</div>
						)}

						{status === STATUS.PROCESSING && (
							<div className="space-y-6">
								<div className="flex items-center gap-4 bg-confident-black/30 border border-off-white rounded-lg p-4">
									<div className="w-12 h-12 bg-yellow-01/10 rounded-lg flex items-center justify-center flex-shrink-0">
										<FileText className="w-6 h-6 text-yellow-01" />
									</div>
									<div className="flex-1 min-w-0">
										<p className="text-sm font-semibold text-white truncate">
											{fileName}
										</p>
										<p className="text-xs text-white font-medium">
											Processing...
										</p>
									</div>
								</div>
								<div className="bg-yellow-01/10 border border-yellow-01/90 rounded-lg p-4">
									<p className="text-sm text-yellow-01 font-semibold text-center">
										Vui lòng đợi trong giây lát. Server đang xử lý file của
										bạn...
									</p>
								</div>
							</div>
						)}

						{status === STATUS.COMPLETED && (
							<div className="space-y-6">
								<div className="flex flex-col items-center justify-center py-6">
									<div className="w-16 h-16 bg-yellow-01/10 rounded-full flex items-center justify-center mb-4">
										<CheckCircle className="w-8 h-8 text-yellow-01" />
									</div>
									<h3 className="text-xl font-semibold text-yellow-01 mb-2">
										Xử lý hoàn tất!
									</h3>
									<p className="text-sm text-white">
										File của bạn đã sẵn sàng để tải xuống
									</p>
								</div>
								<div className="flex items-center gap-4 bg-confident-black/30 border border-off-white rounded-lg p-4">
									<div className="w-12 h-12 bg-yellow-01/10 rounded-lg flex items-center justify-center flex-shrink-0">
										<CheckCircle className="w-6 h-6 text-yellow-01" />
									</div>
									<div className="flex-1 min-w-0">
										<p className="text-sm font-semibold text-white truncate">
											{fileName || "File"}
										</p>
										<p className="text-xs text-white">Đã xử lý thành công</p>
									</div>
								</div>

								<BaseButton
									onClick={handleDownload}
									disabled={!downloadUrl}
									className={`w-full cursor-pointer text-xl bg-yellow-01 text-confident-black font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 ${
										downloadUrl ? "" : "opacity-60 cursor-not-allowed"
									}`}
								>
									<Download size={20} />
									Tải xuống file
								</BaseButton>

								<BaseButton
									onClick={handleReset}
									className="w-full cursor-pointer bg-gray-100 text-confident-black font-medium py-2 px-4 rounded-lg transition-colors duration-200"
								>
									Tải lại file khác
								</BaseButton>
							</div>
						)}

						{status === STATUS.ERROR && (
							<div className="space-y-6">
								<div className="flex items-center gap-4 bg-confident-black/30 border border-off-white rounded-lg p-4">
									<div className="w-12 h-12 bg-red-600/10 rounded-lg flex items-center justify-center flex-shrink-0">
										<FileText className="w-6 h-6 text-red-600" />
									</div>
									<div className="flex-1 min-w-0">
										<p className="text-sm font-semibold text-white truncate">
											{fileName || "File"}
										</p>
										<p className="text-xs text-red-600 font-medium">Error</p>
									</div>
								</div>
								<div className="bg-red-600/10 border border-red-600/90 rounded-lg p-4">
									<p className="text-sm text-red-600 font-semibold text-center">
										{errorMessage ||
											"Đã phát sinh lỗi trong quá trình xử lý. Vui lòng thử lại."}
									</p>
								</div>
								<BaseButton
									type="button"
									onClick={handleReset}
									className="w-full cursor-pointer bg-gray-100 text-confident-black font-medium py-2 px-4 rounded-lg transition-colors duration-200"
								>
									Thử lại
								</BaseButton>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
