"use client";

import { useCallback, useEffect, useState } from "react";

import clsx from "clsx";
import { CheckCircle, Download, FileText, Upload } from "lucide-react";
import { toast } from "sonner";

import { IResponsePresignedUrl } from "@/types/requests/customs-health-check";

import { useEngagementStore } from "@/stores/engagement-store";
import { useQuotaStore } from "@/stores/quota-store";
import {
	useGetPresignedUrl,
	useProcessConsistencyAnalysisAsync,
	useProcessConsistencyAnalysisAsyncPolling
} from "@/services/requests/customs-health-check.request";
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

// Các tùy chọn xử lý file Excel
const processingOptions = [
	{
		id: "item_code_generator",
		label: "Item Code Generator",
		description: "Generate cho các dòng hàng thiếu Mã NPL/SP",
		icon: "✨"
	},
	{
		id: "exim_statistics",
		label: "EXIM Statistics",
		description: "Trực quan hóa thống kê số liệu XNK",
		icon: "📊"
	},
	{
		id: "tariff_classification",
		label: "Tariff Classification Testing",
		description: "Rà soát tính thống nhất và chính xác của mã HS",
		icon: "📋"
	},
	{
		id: "customs_valuation",
		label: "Customs Valuation Testing",
		description: "Rà soát biên độ và tính hợp lý của giá trị hải quan",
		icon: "💰"
	},
	{
		id: "non_tariff_measures",
		label: "Non-tariff Measures Testing",
		description:
			"Rà soát việc áp dụng và tuân thủ các biện pháp phi thuế quan (vd: giấy phép, hợp chuẩn - hợp quy, khai báo hoá chất, kiếm tra chất lượng, v.v...)",
		icon: "🔍"
	}
];

export const CustomsHealthCheck = () => {
	const [status, setStatus] = useState(STATUS.IDLE); // idle, uploading, uploaded, processing, completed, error
	const [fileName, setFileName] = useState("");
	const [objectName, setObjectName] = useState("");
	const [selectedOptions, setSelectedOptions] = useState<any[]>([]);
	const [downloadUrl, setDownloadUrl] = useState("");
	const [dragOver, setDragOver] = useState(false);
	const [taskId, setTaskId] = useState("");
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const engagementCode = useEngagementStore((state) => state.engagementCode);
	const setEngagementCode = useEngagementStore(
		(state) => state.setEngagementCode
	);
	const setQuotaBlocked = useQuotaStore((state) => state.setQuotaBlocked);
	const isQuotaBlocked = useQuotaStore((state) => state.isQuotaBlocked);

	const REQUIRED_BASE_NAME = "Public ECUS data for testing";

	const isValidFileName = (name: string) => {
		const lastDotIndex = name.lastIndexOf(".");
		const baseName = lastDotIndex >= 0 ? name.slice(0, lastDotIndex) : name;
		return baseName === REQUIRED_BASE_NAME;
	};

	const { mutate: getPresignedUrl } = useGetPresignedUrl();
	const { mutate: processConsistencyAnalysisAsync } =
		useProcessConsistencyAnalysisAsync();
	const { mutate: processConsistencyAnalysisAsyncPolling } =
		useProcessConsistencyAnalysisAsyncPolling();

	const handleProcessConsistencyAnalysis = () => {
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

		setStatus(STATUS.PROCESSING);
		setErrorMessage(null);

		processConsistencyAnalysisAsync(
			{
				object_name: objectName,
				input_sections: selectedOptions
					.filter((option) => option?.id !== "item_code_generator")
					.map((option) => option?.id),
				prefill_mode: selectedOptions.some(
					(option) => option?.id == "item_code_generator"
				)
					? "llm"
					: "none"
			},
			{
				onSuccess: (res) => {
					setTaskId(res.task_id);
				},
				onError(error: any) {
					const detail = getQuotaDetail(error);
					if (isQuotaMessage(detail)) {
						setQuotaBlocked(true);
						setTaskId("");
						toast.error(QUOTA_MESSAGE);
						setErrorMessage(QUOTA_MESSAGE);
						setStatus(STATUS.ERROR);
						return;
					}
					setStatus(STATUS.ERROR);
					setErrorMessage("Không thể xử lý file. Vui lòng thử lại.");
				}
			}
		);
	};

	const getProcessConsistencyAnalysisAsyncPolling = useCallback(() => {
		if (!taskId || isQuotaBlocked) {
			return;
		}

		const stopPolling = (interval: ReturnType<typeof setInterval>) => {
			clearInterval(interval);
		};

		const pollOnce = () => {
			processConsistencyAnalysisAsyncPolling(taskId, {
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
								res.error ||
									"Đã phát sinh lỗi trong quá trình xử lý. Vui lòng thử lại."
							);
						}
						setStatus(STATUS.ERROR);
						return;
					}
					if (res.status === "SUCCESS") {
						stopPolling(interval);
						setStatus(STATUS.COMPLETED);
					}

					setDownloadUrl(res?.result?.download_url);
				},
				onError: (error: any) => {
					const detail = getQuotaDetail(error);
					if (isQuotaMessage(detail)) {
						stopPolling(interval);
						setQuotaBlocked(true);
						setTaskId("");
						toast.error(QUOTA_MESSAGE);
						setErrorMessage(QUOTA_MESSAGE);
						setStatus(STATUS.ERROR);
						return;
					}
					stopPolling(interval);
					setStatus(STATUS.ERROR);
					setErrorMessage(
						"Đã phát sinh lỗi trong quá trình xử lý. Vui lòng thử lại."
					);
				}
			});
		};

		const interval = setInterval(pollOnce, 2000);
		pollOnce();

		return interval;
	}, [
		isQuotaBlocked,
		processConsistencyAnalysisAsyncPolling,
		setQuotaBlocked,
		taskId
	]);

	const handleUploadFileIntoMinIO = async (
		file: File,
		data: IResponsePresignedUrl
	) => {
		try {
			const response = await fetch(data.upload_url, {
				method: "PUT",
				body: file,
				headers: {
					"Content-Type": file.type
				}
			});

			if (response.ok) {
				setObjectName(data.object_name);
				setStatus(STATUS.UPLOADED);
			} else {
				setStatus(STATUS.ERROR);
				setErrorMessage("Upload thất bại. Vui lòng thử lại.");
			}
		} catch {
			setStatus(STATUS.ERROR);
			setErrorMessage("Upload thất bại. Vui lòng thử lại.");
		}
	};

	const handleSelectedFile = (file: File) => {
		if (!engagementCode) {
			setStatus(STATUS.ERROR);
			setErrorMessage("Engagement code is required to run the tool.");
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

		getPresignedUrl(
			{ filename: file.name },
			{
				onSuccess: (res) => {
					handleUploadFileIntoMinIO(file, res);
				},
				onError() {
					setStatus(STATUS.ERROR);
					setErrorMessage("Không thể lấy upload URL.");
				}
			}
		);
	};

	// Giả lập upload file
	const handleFileUpload = async (e: any) => {
		const file = e.target.files?.[0] || e.dataTransfer.files[0];
		if (!file) return;

		handleSelectedFile(file);
	};

	const handleDownload = () => {
		downloadFile(downloadUrl);
	};

	const handleReset = () => {
		setStatus(STATUS.IDLE);
		setSelectedOptions([]);
		setFileName("");
		setObjectName("");
		setTaskId("");
		setDownloadUrl("");
		setErrorMessage(null);
	};

	// Xử lý chọn option
	const toggleOption = (option: any) => {
		setSelectedOptions((prev) => {
			const ids = prev.map((item) => item?.id);
			if (ids.includes(option?.id)) {
				return prev.filter((item) => item?.id !== option?.id);
			} else {
				return [...prev, option];
			}
		});
	};

	// Xử lý Select All
	const handleSelectAll = () => {
		if (selectedOptions.length === processingOptions.length) {
			// Nếu đã chọn hết thì bỏ chọn tất cả
			setSelectedOptions([]);
		} else {
			// Chọn tất cả
			setSelectedOptions(processingOptions);
		}
	};

	const isAllSelected = selectedOptions.length === processingOptions.length;

	const handleDragOver = (e: any) => {
		e.preventDefault();
		setDragOver(true);
	};

	const handleDragLeave = () => {
		setDragOver(false);
	};

	const handleDrop = (e: any) => {
		e.preventDefault();
		setDragOver(false);

		const file = e.dataTransfer.files?.[0];
		if (!file) {
			return;
		}

		handleSelectedFile(file);
	};

	useEffect(() => {
		const interval = getProcessConsistencyAnalysisAsyncPolling();

		return () => {
			if (interval) {
				clearInterval(interval);
			}
		};
	}, [getProcessConsistencyAnalysisAsyncPolling]);

	return (
		<div className="flex-1 h-screen overflow-y-auto bg-confident-black">
			<div className="max-w-[90%] px-10 py-12 mx-auto">
				<h1 className="text-3xl font-bold text-yellow-01 mb-8 uppercase">
					Customs Health Check
				</h1>

				{/* Card chính */}
				<div className="bg-off-black border border-off-white rounded-2xl shadow-xl p-8">
					<div className="flex justify-center">
						<h2 className="text-2xl font-semibold text-white mb-6 border-b-[3px] border-yellow-01 ">
							Dữ liệu VNACCs đầu vào
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
					{/* State: Idle - Upload Button */}
					{status === STATUS.IDLE && (
						<div className="space-y-4">
							<label
								onDragOver={handleDragOver}
								onDragLeave={handleDragLeave}
								onDrop={handleDrop}
								className={clsx(
									"relative flex flex-col items-center justify-center w-full h-full",
									"border-2 border-dashed border-yellow-01 text-yellow-01 bg-yellow-01/10 rounded-xl cursor-pointer transition-all duration-200"
								)}
							>
								{/* Drag Overlay */}
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
											className="w-20 h-20 text-white"
											strokeWidth={2.5}
										/>
									</div>
									<h2 className="text-3xl font-bold text-white mb-2">
										Drop file here to analyze
									</h2>
									<p className="text-white text-lg">
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
													• Loại bỏ công thức trong file (nếu có);
												</li>
												<li className="leading-relaxed">
													• Loại bỏ thông tin khách hàng tại
													<span className="text-yellow-01 font-semibold">
														&nbsp; Phần &quot;Thông tin chung&quot;&nbsp;
													</span>
													và
													<span className="text-yellow-01 font-semibold">
														&nbsp; Cột &quot;Tên doanh nghiệp&quot;;
													</span>
													<br />
													&nbsp;&nbsp;Đối với các thông tin phải xóa, chỉ xóa
													thông tin bên trong cột,
													<span className="text-yellow-01 font-semibold">
														&nbsp; không &quot;Delete column&quot; &nbsp;
													</span>
													để tránh bị lệch hàm excel;
												</li>
												<li className="leading-relaxed">
													•{" "}
													<span className="text-yellow-01 font-semibold">
														Cột &quot;Ngày ĐK &quot;:
													</span>{" "}
													Đưa về đúng{" "}
													<span className="text-yellow-01 font-semibold">
														định dạng ngày
													</span>{" "}
													trước khi upload;
												</li>
												<li className="leading-relaxed">
													•{" "}
													<span className="text-yellow-01 font-semibold">
														Cột &quot;Đơn giá tính thuế &quot;:
													</span>{" "}
													Đưa về đúng{" "}
													<span className="text-yellow-01 font-semibold">
														định dạng số
													</span>{" "}
													trước khi upload;
												</li>
												<li className="leading-relaxed">
													• Sửa tên file thành
													<span className="text-yellow-01 font-semibold">
														&nbsp; &quot;Public ECUS data for
														testing&quot;&nbsp;
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
									onChange={handleFileUpload}
									accept=".xlsx,.xlsb"
								/>
							</label>
						</div>
					)}

					{/* State: Uploading */}
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

					{/* State: Uploaded */}
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
										Upload thành công
									</p>
								</div>
							</div>
							<div className="space-y-3">
								<div className="flex items-center justify-between">
									<label className="text-sm font-semibold text-yellow-01">
										Lựa chọn khoản mục bạn cần kiểm tra:
									</label>
									<BaseButton
										onClick={handleSelectAll}
										className="text-sm font-semibold text-off-white hover:text-white cursor-pointer transition-colors duration-200"
									>
										{isAllSelected ? "✓ Bỏ chọn tất cả" : "Chọn tất cả"}
									</BaseButton>
								</div>
								<div className="grid grid-cols-1 gap-3">
									{processingOptions.map((option) => {
										const isSelected = selectedOptions
											.map((option) => option?.id)
											.includes(option.id);
										return (
											<BaseButton
												key={option.id}
												onClick={() => toggleOption(option)}
												className={`flex items-start cursor-pointer gap-3 p-4 rounded-lg border transition-all duration-200 text-confident-black ${
													isSelected
														? "border-yellow-01 bg-yellow-01/60 shadow-md"
														: "border-off-white bg-yellow-01/20 hover:border-yellow-01 hover:bg-yellow-01/60"
												}`}
											>
												<span className="text-2xl flex-shrink-0">
													{option.icon}
												</span>
												<div className="flex-1 text-left">
													<p className="text-sm font-semibold">
														{option.label}
													</p>
													<p className="text-xs mt-1">{option.description}</p>
												</div>
												<div className="flex-shrink-0 self-center">
													<div
														className={`w-5 h-5 rounded border flex items-center justify-center ${
															isSelected
																? "bg-yellow-01 border-yellow-01"
																: "border-off-white"
														}`}
													>
														{isSelected && (
															<CheckCircle className="w-4 h-4 text-white" />
														)}
													</div>
												</div>
											</BaseButton>
										);
									})}
								</div>
							</div>

							<BaseButton
								onClick={handleProcessConsistencyAnalysis}
								disabled={selectedOptions.length === 0}
								className={`w-full font-semibold py-4 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 text-confident-black ${
									selectedOptions.length > 0
										? "bg-yellow-01"
										: "bg-off-white cursor-not-allowed"
								}`}
							>
								<span>
									Bắt đầu kiểm tra&nbsp;
									{selectedOptions.length > 0
										? `[${selectedOptions.length} khoản mục]`
										: ""}
								</span>
							</BaseButton>

							<BaseButton
								onClick={handleReset}
								className="w-full cursor-pointer bg-gray-100 text-confident-black font-medium py-2 px-4 rounded-lg transition-colors duration-200"
							>
								Hủy và upload lại
							</BaseButton>
						</div>
					)}

					{/* State: Processing */}
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
									Vui lòng đợi trong giây lát. Server đang xử lý file của bạn...
								</p>
							</div>
						</div>
					)}

					{/* State: Completed */}
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
										{fileName}
									</p>
									<p className="text-xs text-white">Đã xử lý thành công</p>
								</div>
							</div>

							<BaseButton
								onClick={handleDownload}
								className="w-full cursor-pointer text-xl bg-yellow-01 text-confident-black font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
							>
								<Download size={20} />
								Tải xuống file
							</BaseButton>

							<BaseButton
								onClick={handleReset}
								className="w-full cursor-pointer bg-gray-100 text-confident-black font-medium py-2 px-4 rounded-lg transition-colors duration-200"
							>
								Upload file mới
							</BaseButton>
						</div>
					)}

					{/* State: Error */}
					{status === STATUS.ERROR && (
						<div className="space-y-6">
							<div className="flex items-center gap-4 bg-confident-black/30 border border-off-white rounded-lg p-4">
								<div className="w-12 h-12 bg-red-600/10 rounded-lg flex items-center justify-center flex-shrink-0">
									<FileText className="w-6 h-6 text-red-600" />
								</div>
								<div className="flex-1 min-w-0">
									<p className="text-sm font-semibold text-white truncate">
										{fileName}
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
								onClick={handleReset}
								className="w-full cursor-pointer bg-gray-100 text-confident-black font-medium py-2 px-4 rounded-lg transition-colors duration-200"
							>
								Try again
							</BaseButton>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};
