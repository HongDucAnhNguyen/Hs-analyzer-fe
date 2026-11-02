"use client";

import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { UseFormGetValues, UseFormSetError } from "react-hook-form";

import { uniqBy } from "lodash";
import { FileTextIcon, LoaderIcon } from "lucide-react";

import {
	IBodyHsCodeSearch,
	IResponseHsCode
} from "@/types/requests/e-tariff-classification";

import { useQuotaStore } from "@/stores/quota-store";
import {
	useHsCodeSearchAsync,
	useHsCodeSearchAsyncPolling
} from "@/services/requests/e-tariff-classification.request";

interface Props {
	wcoLoading: boolean;
	setWcoLoading: (p: boolean) => void;
	setError: UseFormSetError<any>;
	getValues: UseFormGetValues<any>;
	setPdfData: (pdfName: string, page: number) => void;
}

type SearchResults = IResponseHsCode["result"];

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

export const WCO = forwardRef<{}, Props>((props, ref) => {
	const { wcoLoading, setWcoLoading, setError, getValues, setPdfData } = props;
	const [searchResult, setSearchResult] = useState<SearchResults | null>(null);
	const [taskId, setTaskId] = useState("");
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const setQuotaBlocked = useQuotaStore((state) => state.setQuotaBlocked);

	const { mutate } = useHsCodeSearchAsync({ setError, getValues });
	const { mutate: hsCodeSearchAsyncPolling } = useHsCodeSearchAsyncPolling({
		setError,
		getValues
	});

	const excuteSearch = (data: IBodyHsCodeSearch) => {
		setSearchResult(null);
		setErrorMessage(null);
		setWcoLoading(true);
		mutate(data, {
			onSuccess: (res) => {
				setTaskId(res.task_id);
			},
			onError() {
				setWcoLoading(false);
			}
		});
	};

	const getHsCodeSearchAsyncPolling = () => {
		if (!taskId) {
			return;
		}

		const interval = setInterval(async () => {
			hsCodeSearchAsyncPolling(taskId, {
				onSuccess: (res) => {
					console.log(res);
					const resultError = (res.result as { error?: string } | undefined)
						?.error;
					const combinedError = res.error || resultError || null;
					if (combinedError) {
						setErrorMessage(combinedError);
						if (isQuotaMessage(combinedError)) {
							setQuotaBlocked(true);
							clearInterval(interval);
							setWcoLoading(false);
							return;
						}
					}
					const normalizedStatus = String(res.status || "").toUpperCase();
					const hasResult = Boolean(res.result);
					if (normalizedStatus === "SUCCESS" || hasResult) {
						clearInterval(interval);
						setWcoLoading(false);
						setSearchResult((res.result as SearchResults | undefined) || null);
					}
				},
				onError: () => {
					clearInterval(interval);
					setWcoLoading(false);
				}
			});
		}, 1000);

		return interval;
	};

	useImperativeHandle(ref, () => ({
		excuteSearch: excuteSearch,
		getSearchResult: () => searchResult
	}));

	const _renderResults = () => {
		if (!searchResult) {
			if (errorMessage) {
				return (
					<p className="text-white">Không thể phân loại: {errorMessage}</p>
				);
			}
			return;
		}

		const dataContentSection = searchResult["section_classification"];
		const dataContentChapter = searchResult["chapter_classification"];
		const dataContentHeading = searchResult["heading_classification"];
		const dataContentSubHeading = searchResult["subheading_classification"];

		const selectedSection = dataContentSection?.selected_section;
		const selectedChapter = dataContentChapter?.selected_chapter;
		const selectedHeading = dataContentHeading?.selected_heading;
		const selectedSubHeading = dataContentSubHeading?.selected_subheading;

		const hsCode =
			selectedSubHeading?.subheading_id || selectedHeading?.heading_id;
		const hsTitle =
			selectedSubHeading?.subheading_title || selectedHeading?.heading_title;

		const productAnalysis = dataContentSection?.product_analysis;
		const productAnalysisLines = productAnalysis?.product_dna
			? productAnalysis.product_dna.split("\n")
			: [];
		const girApplications = uniqBy(
			[
				selectedSection?.gir_application,
				selectedChapter?.gir_application,
				selectedHeading?.gir_application,
				selectedSubHeading?.gir_application
			].filter((value): value is string => Boolean(value)),
			(value: string) => value.replace(/\s/g, "")
		).sort();

		const hasAnyDetails = Boolean(
			dataContentSection ||
				dataContentChapter ||
				dataContentHeading ||
				dataContentSubHeading
		);
		if (!hasAnyDetails) {
			return (
				<p className="text-white">
					{errorMessage
						? `Không thể phân loại: ${errorMessage}`
						: "Không có dữ liệu giải trình cho WCO Explanatory Notes."}
				</p>
			);
		}

		const _renderFileName = (
			type: "section" | "chapter" | "heading" | "sub-heading"
		) => {
			switch (type) {
				case "section":
					return selectedSection?.section_id
						? `Section_${selectedSection.section_id}.pdf`
						: "";
				case "chapter":
					return selectedChapter?.chapter_id && selectedSection?.section_id
						? `Chapter_${selectedChapter.chapter_id}_Section_${selectedSection.section_id}.pdf`
						: "";
				case "heading":
				case "sub-heading":
					return selectedHeading?.heading_id &&
						selectedChapter?.chapter_id &&
						selectedSection?.section_id
						? `Heading_${selectedHeading.heading_id}_Chapter_${selectedChapter.chapter_id}_Section_${selectedSection.section_id}.pdf`
						: "";
				default:
					return "";
			}
		};

		const renderRejectedList = (
			items: any[] | undefined,
			label: string,
			idKey: "section_id" | "chapter_id" | "heading_id" | "subheading_id"
		) => {
			if (!items || items.length === 0) {
				return null;
			}

			return (
				<p className="text-white">
					<span className="font-semibold">{label}:</span>{" "}
					{items
						.map((item) => {
							const identifier = item?.[idKey];
							const reason = item?.reason;
							if (!identifier && !reason) {
								return "";
							}
							return `${identifier || "N/A"} - ${reason || ""}`.trim();
						})
						.filter(Boolean)
						.join("; ")}
				</p>
			);
		};

		const renderSourcePages = (pages: number[], fileName: string) => {
			if (!pages || pages.length === 0) {
				return <span>No reference pages available.</span>;
			}
			return (
				<span className="flex gap-2 w-fit items-center cursor-pointer underline">
					{pages.map((page) => (
						<span key={page} onClick={() => setPdfData(fileName, page)}>
							{page}
						</span>
					))}
				</span>
			);
		};

		return (
			<>
				{hsCode && hsTitle && (
					<div className="mb-6">
						<h2 className="text-xl font-semibold text-white mb-1 inline-block border-b-[2px] border-yellow-01">
							1. Classification Result
						</h2>
						<p className="text-white">
							<span className="font-semibold">
								{dataContentSubHeading ? "HS Sub-heading" : "HS Heading"}:
							</span>{" "}
							{hsCode} {hsTitle}
						</p>
					</div>
				)}

				{(productAnalysisLines.length > 0 ||
					productAnalysis?.key_attribute) && (
					<div className="mb-6">
						<h2 className="text-xl font-semibold text-white mb-1 inline-block border-b-[2px] border-yellow-01">
							2. Overview On Product Analysis
						</h2>
						{productAnalysisLines.map((item, i) => (
							<p
								key={`productAnalysis_${i}`}
								className="text-white"
								dangerouslySetInnerHTML={{ __html: item }}
							></p>
						))}
						{productAnalysis?.key_attribute && (
							<p className="text-white">
								<span className="font-semibold">Key Attribute:</span>{" "}
								{productAnalysis.key_attribute}
							</p>
						)}
					</div>
				)}

				{girApplications.length > 0 && (
					<div className="mb-3">
						<h2 className="text-xl font-semibold text-white mb-1 inline-block border-b-[2px] border-yellow-01">
							3. General Interpretative Rules (GIR)
						</h2>
						<p className="text-white">
							<span className="font-semibold">GIR Application:</span>{" "}
							{girApplications.join(", ")}
						</p>
					</div>
				)}

				{hasAnyDetails && (
					<>
						<div className="bg-gradient-to-r from-transparent via-off-white to-transparent h-[1px] w-full"></div>

						<h2 className="text-xl font-semibold text-white mb-1 mt-3 inline-block border-b-[2px] border-yellow-01">
							4. Detailed Explanation
						</h2>
					</>
				)}

				{dataContentSection && selectedSection && (
					<div className="mb-6">
						<h3 className="text-lg font-semibold text-white mb-1 inline-block border-b-[2px] border-yellow-01">
							4.1. Section
						</h3>
						<p className="text-white">
							<span className="font-semibold">Section:</span>{" "}
							{selectedSection.section_id}
						</p>
						<p className="text-white">
							<span className="font-semibold">Section Title:</span>{" "}
							{selectedSection.section_title}
						</p>
						<p className="text-white">
							<span className="font-semibold">Rationale:</span>{" "}
							{selectedSection.rationale}
						</p>
						<p className="text-white">
							<span className="font-semibold">Legal Basis:</span>{" "}
							{selectedSection.legal_basis}
						</p>
						<p className="text-white">
							<span className="font-semibold">GIR Application:</span>{" "}
							{selectedSection.gir_application}
						</p>
						<p className="text-white">
							<span className="font-semibold">
								Content Of Explanatory Notes:
							</span>{" "}
							{dataContentSection.content_of_explanatory_notes}
						</p>
						{renderRejectedList(
							dataContentSection.rejected_sections,
							"Rejected Sections",
							"section_id"
						)}
						<p className="text-white flex">
							<span className="font-semibold">
								Relevant HS Explanatory Notes' files:&nbsp;
							</span>
							<span
								className="flex gap-1 w-fit items-center cursor-pointer underline"
								onClick={() => setPdfData(_renderFileName("section"), 1)}
							>
								<FileTextIcon size={16} className="text-white" />{" "}
								{_renderFileName("section")}
							</span>
						</p>
						<p className="text-white flex">
							<span className="font-semibold">
								Explanatory Notes Page:&nbsp;
							</span>
							{renderSourcePages(
								dataContentSection.source_pages || [],
								_renderFileName("section")
							)}
						</p>
					</div>
				)}

				{dataContentChapter && selectedChapter && (
					<div className="mb-6">
						<h3 className="text-lg font-semibold text-white mb-1 inline-block border-b-[2px] border-yellow-01">
							4.2. Chapter
						</h3>
						<p className="text-white">
							<span className="font-semibold">Chapter:</span>{" "}
							{selectedChapter.chapter_id}
						</p>
						<p className="text-white">
							<span className="font-semibold">Chapter Title:</span>{" "}
							{selectedChapter.chapter_title}
						</p>
						<p className="text-white">
							<span className="font-semibold">Rationale:</span>{" "}
							{selectedChapter.rationale}
						</p>
						<p className="text-white">
							<span className="font-semibold">Legal Basis:</span>{" "}
							{selectedChapter.legal_basis}
						</p>
						<p className="text-white">
							<span className="font-semibold">GIR Application:</span>{" "}
							{selectedChapter.gir_application}
						</p>
						<p className="text-white">
							<span className="font-semibold">
								Content Of Explanatory Notes:
							</span>{" "}
							{dataContentChapter.content_of_explanatory_notes}
						</p>
						{renderRejectedList(
							dataContentChapter.rejected_chapters,
							"Rejected Chapters",
							"chapter_id"
						)}
						<p className="text-white flex">
							<span className="font-semibold">
								Relevant HS Explanatory Notes' files:&nbsp;
							</span>
							<span
								className="flex gap-1 w-fit items-center cursor-pointer underline"
								onClick={() => setPdfData(_renderFileName("chapter"), 1)}
							>
								<FileTextIcon size={16} className="text-white" />{" "}
								{_renderFileName("chapter")}
							</span>
						</p>
						<p className="text-white flex">
							<span className="font-semibold">
								Explanatory Notes Page:&nbsp;
							</span>
							{renderSourcePages(
								dataContentChapter.source_pages || [],
								_renderFileName("chapter")
							)}
						</p>
					</div>
				)}

				{dataContentHeading && selectedHeading && (
					<div className="mb-6">
						<h3 className="text-lg font-semibold text-white mb-1 inline-block border-b-[2px] border-yellow-01">
							4.3. Heading
						</h3>
						<p className="text-white">
							<span className="font-semibold">Heading:</span>{" "}
							{selectedHeading.heading_id}
						</p>
						<p className="text-white">
							<span className="font-semibold">Heading Title:</span>{" "}
							{selectedHeading.heading_title}
						</p>
						<p className="text-white">
							<span className="font-semibold">Rationale:</span>{" "}
							{selectedHeading.rationale}
						</p>
						<p className="text-white">
							<span className="font-semibold">Legal Basis:</span>{" "}
							{selectedHeading.legal_basis}
						</p>
						<p className="text-white">
							<span className="font-semibold">GIR Application:</span>{" "}
							{selectedHeading.gir_application}
						</p>
						<p className="text-white">
							<span className="font-semibold">
								Content Of Explanatory Notes:
							</span>{" "}
							{dataContentHeading.content_of_explanatory_notes}
						</p>
						{renderRejectedList(
							dataContentHeading.rejected_headings,
							"Rejected Headings",
							"heading_id"
						)}
						<p className="text-white flex">
							<span className="font-semibold">
								Relevant HS Explanatory Notes' files:&nbsp;
							</span>
							<span
								className="flex gap-1 w-fit items-center cursor-pointer underline"
								onClick={() => setPdfData(_renderFileName("heading"), 1)}
							>
								<FileTextIcon size={16} className="text-white" />{" "}
								{_renderFileName("heading")}
							</span>
						</p>
						<p className="text-white flex">
							<span className="font-semibold">
								Explanatory Notes Page:&nbsp;
							</span>
							{renderSourcePages(
								dataContentHeading.source_pages || [],
								_renderFileName("heading")
							)}
						</p>
					</div>
				)}

				{dataContentSubHeading && selectedSubHeading && (
					<div className="mb-6">
						<h3 className="text-lg font-semibold text-white mb-1 inline-block border-b-[2px] border-yellow-01">
							4.4. Sub-Heading
						</h3>
						<p className="text-white">
							<span className="font-semibold">Sub-Heading:</span>{" "}
							{selectedSubHeading.subheading_id}
						</p>
						<p className="text-white">
							<span className="font-semibold">Sub-Heading Title:</span>{" "}
							{selectedSubHeading.subheading_title}
						</p>
						<p className="text-white">
							<span className="font-semibold">Rationale:</span>{" "}
							{selectedSubHeading.rationale}
						</p>
						<p className="text-white">
							<span className="font-semibold">Legal Basis:</span>{" "}
							{selectedSubHeading.legal_basis}
						</p>
						<p className="text-white">
							<span className="font-semibold">GIR Application:</span>{" "}
							{selectedSubHeading.gir_application}
						</p>
						{dataContentSubHeading.gir6_hierarchy_analysis && (
							<>
								<p className="text-white">
									<span className="font-semibold">GIR 6 (One Dash):</span>{" "}
									{
										dataContentSubHeading.gir6_hierarchy_analysis
											.selected_one_dash
									}
								</p>
								<p className="text-white">
									<span className="font-semibold">GIR 6 Reasoning:</span>{" "}
									{
										dataContentSubHeading.gir6_hierarchy_analysis
											.reasoning_one_dash
									}
								</p>
							</>
						)}
						<p className="text-white">
							<span className="font-semibold">
								Content Of Explanatory Notes:
							</span>{" "}
							{dataContentSubHeading.content_of_explanatory_notes}
						</p>
						{renderRejectedList(
							dataContentSubHeading.rejected_subheadings,
							"Rejected Sub-Headings",
							"subheading_id"
						)}
						<p className="text-white flex">
							<span className="font-semibold">
								Relevant HS Explanatory Notes' files:&nbsp;
							</span>
							<span
								className="flex gap-1 w-fit items-center cursor-pointer underline"
								onClick={() => setPdfData(_renderFileName("sub-heading"), 1)}
							>
								<FileTextIcon size={16} className="text-white" />{" "}
								{_renderFileName("sub-heading")}
							</span>
						</p>
						<p className="text-white flex">
							<span className="font-semibold">
								Explanatory Notes Page:&nbsp;
							</span>
							{renderSourcePages(
								dataContentSubHeading.source_pages || [],
								_renderFileName("sub-heading")
							)}
						</p>
					</div>
				)}
			</>
		);
	};

	useEffect(() => {
		const interval = getHsCodeSearchAsyncPolling();

		// Cleanup khi component unmount hoặc taskId đổi
		return () => {
			clearInterval(interval);
		};
	}, [taskId]);

	return (
		<>
			{_renderResults()}
			{wcoLoading && (
				<LoaderIcon className="animate-spin-slow text-white" size={20} />
			)}
		</>
	);
});
