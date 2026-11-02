"use client";

import React, { useEffect, useRef, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";

import { yupResolver } from "@hookform/resolvers/yup";
import { Download, LoaderIcon, Plus, Search, Trash2 } from "lucide-react";

import { IBodyHsCodeSearch } from "@/types/requests/e-tariff-classification";
import {
	DEFAULT_IMAGE_FILE_SIZE,
	WHITE_LIST_IMAGE_TYPE_UPLOAD
} from "@/constants";

import { useEngagementStore } from "@/stores/engagement-store";
import { useQuotaStore } from "@/stores/quota-store";
import { eTariffClassificationSchema } from "@/schemas";
import { request } from "@/services/axios";
import { fileToBase64 } from "@/lib/utils";

import { BaseButton } from "@/components/common/button";
import { BaseFormInput, BaseFormInputImage } from "@/components/common/input";
import { BaseLabel } from "@/components/common/label";
import Tabs, { TabItem } from "@/components/common/tabs";
import { BaseFormTextarea } from "@/components/common/textarea";

import { AiConclusion, AiConclusionHandle } from "./AiConclusion";
import { Asean } from "./Asean";
import { Compendium } from "./Compendium";
import { HsDatabase } from "./HSDatabase";
import { HSRuling } from "./HSRuling";
import { WCO } from "./WCO";

interface Props {
	pdfName: string;
	pdfWidth: number;
	setPdfData: (pdfName: string, page: number) => void;
}

export default function HsCodeSearchForm(props: Props) {
	const { pdfName, pdfWidth, setPdfData } = props;

	const [searchExecuted, setSearchExecuted] = useState(false);
	const [wcoLoading, setWcoLoading] = useState(false);
	const [compendiumLoading, setCompendiumLoading] = useState(false);
	const [aseanLoading, setAseanLoading] = useState(false);
	const [hsRulingLoading, setHSRulingLoading] = useState(false);
	const [hsDatabaseLoading, setHSDatabaseLoading] = useState(false);
	const [conclusionLoading, setConclusionLoading] = useState(false);
	const [formData, setFormData] = useState<IBodyHsCodeSearch | null>(null);
	const [imageUrl, setImageUrl] = useState("");
	const isQuotaBlocked = useQuotaStore((state) => state.isQuotaBlocked);
	const setQuotaBlocked = useQuotaStore((state) => state.setQuotaBlocked);
	const engagementCode = useEngagementStore((state) => state.engagementCode);
	const setEngagementCode = useEngagementStore(
		(state) => state.setEngagementCode
	);

	const quotaBlockedMessage =
		"Insufficient LLM credits, please add more tokens to run tool";

	const isQuotaMessage = (value: unknown) => {
		if (typeof value !== "string") {
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

	//refs for classificationsearch
	const resultsRef = useRef<HTMLDivElement | null>(null);
	const wcoRef = useRef<any>(null);
	const compendiumRef = useRef<any>(null);
	const aseanRef = useRef<any>(null);
	const hsRulingRef = useRef<any>(null);
	const hsDatabaseRef = useRef<any>(null);
	const conclusionRef = useRef<AiConclusionHandle | null>(null);

	const isDataLoading =
		wcoLoading ||
		compendiumLoading ||
		aseanLoading ||
		hsRulingLoading ||
		hsDatabaseLoading;

	const { control, setError, getValues, setValue, handleSubmit, clearErrors } =
		useForm({
			resolver: yupResolver(eTariffClassificationSchema),
			// defaultValues: {
			//   // product_name: 'TẤM ỐP LẮP RÁP, ESCN',
			//   // science_name: 'PANEL ASSY, ESCN',
			//   // product_description: ' Mặt hàng là một bộ phận bên trong xe ô tô. Tấm ốp là nắp đậy che phủ bảng điều khiển và cố định mặt trên của cần chuyển số, che phủ và ngăn chặn bụi bẩn, nước hoặc va chạm không mong muốn, từ đó đảm bảo hoạt động mượt mà của hệ thống truyền động tự động.',
			//   // function: 'Để lắp cần chuyển số̉ và che bộ phận điều khiển của xe',
			//   // structure: 'Lắp ráp từ các tấm nhựa dạng panel che phủ, cấu trúc hộp kín.',
			//   // material: 'Plastic',
			//   // specifications: 'Kích thước tùy theo mẫu xe (ví dụ: 200x100x50mm), chịu lực va chạm cơ bản.',
			//   other_information: [{ title: '', description: '' }],
			//   product_name: "Máy chiếu phim gia đình (Home Cinema Projector)",
			//   science_name: "DIGITAL LIGHT PROCESSING (DLP) PROJECTOR, PORTABLE, WITH BUILT-IN SPEAKER AND WI-FI CONNECTIVITY",
			//   product_description: "Máy chiếu sử dụng công nghệ DLP. Tích hợp loa ngoài công suất 10W để phát âm thanh. Tích hợp module Wi-Fi cho phép kết nối mạng không dây và truyền nội dung (chức năng Smart TV). Được đóng gói để bán lẻ như một bộ thiết bị giải trí duy nhất.",
			//   function: "Chiếu hình ảnh và video (chức năng cốt lõi); Phát âm thanh và nhận/truyền dữ liệu qua Wi-Fi (chức năng bổ trợ).",
			//   structure: "Cấu trúc hỗn hợp: Bộ phận chiếu hình ảnh + Loa/Mạch khuếch đại + Module Wi-Fi/Board điều khiển chính.",
			//   specifications: "Độ phân giải: 1920x1080; Công suất loa: 10W; Kết nối Wi-Fi 802.11ac."
			// }
			defaultValues: {
				engagement_code: engagementCode,
				product_name: "",
				science_name: "",
				product_description: "",
				function: "",
				structure: "",
				material: "",
				specifications: "",
				other_information: [{ title: "", description: "" }]
			}
		});

	const { fields, append, remove } = useFieldArray({
		control,
		name: "other_information"
	});

	const handleImageUpload = async (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		const fileInput = event.target;
		if (!fileInput || !fileInput.files || !fileInput.files.length) {
			return;
		}

		const file = fileInput.files[0];
		if (file?.size > DEFAULT_IMAGE_FILE_SIZE) {
			setError("images", {
				message: "Please upload an image file up to 5MB."
			});
			setValue("images", "");
			return;
		}

		if (!WHITE_LIST_IMAGE_TYPE_UPLOAD.exec(file?.name)) {
			setError("images", {
				message:
					"Please upload an image file with the extension .jpg, .jpeg, or .png."
			});
			setValue("images", "");
			return;
		}

		setValue("images", file);
		setImageUrl(await fileToBase64(file));
	};

	const onSubmit = (inputs: any) => {
		if (!inputs.engagement_code) {
			setError("engagement_code", {
				message: "Engagement code is required to run the tool."
			});
			return;
		}

		setEngagementCode(inputs.engagement_code);

		if (isQuotaBlocked) {
			setSearchExecuted(true);
			return;
		}

		if (isDataLoading || conclusionLoading) {
			return;
		}

		const otherInformation = Object.fromEntries(
			inputs.other_information.map((item: any) => [
				item.title,
				item.description
			])
		);
		const data = {
			product_name: inputs.product_name,
			science_name: inputs.science_name,
			product_description: inputs.product_description,
			function: inputs.function,
			structure: inputs.structure,
			material: inputs.material,
			specifications: inputs.specifications,
			other_information: JSON.stringify(otherInformation),
			images: inputs.images
		};
		// const body = new FormData();

		// forEach(Object.keys(data), item => {
		//   body.append(item, data[item as keyof typeof data])
		// });

		//child component refs to classification databases
		setFormData(data);
		setSearchExecuted(true);
		setConclusionLoading(true);

		wcoRef.current && wcoRef.current?.excuteSearch?.(data);
		compendiumRef.current && compendiumRef.current?.excuteSearch?.(data);
		aseanRef.current && aseanRef.current?.excuteSearch?.(data);
		hsRulingRef.current && hsRulingRef.current?.excuteSearch?.(data);
		hsDatabaseRef.current && hsDatabaseRef.current?.excuteSearch?.(data);
	};

	useEffect(() => {
		formData &&
			!isDataLoading &&
			conclusionRef.current &&
			conclusionRef.current?.executeAnalysis?.(formData);
	}, [isDataLoading, formData]);

	const _renderResults = () => {
		const quotaBlockedContent = (
			<div className="border border-yellow-01 rounded-xl bg-off-black px-6 py-5 text-white">
				<p className="text-lg font-semibold">{quotaBlockedMessage}</p>
				<p className="text-sm text-gray-01 mt-2">
					Please add more tokens before running new searches.
				</p>
			</div>
		);

		const tabs: TabItem[] = [
			{
				label: "WCO HS Explanatory Notes 2022",
				value: "wco",
				content: isQuotaBlocked ? (
					quotaBlockedContent
				) : (
					<WCO
						ref={wcoRef}
						wcoLoading={wcoLoading}
						setWcoLoading={setWcoLoading}
						setError={setError}
						getValues={getValues}
						setPdfData={setPdfData}
					/>
				)
			},
			{
				label: "WCO Compendium 2022",
				value: "compendium",
				content: isQuotaBlocked ? (
					quotaBlockedContent
				) : (
					<Compendium
						ref={compendiumRef}
						compendiumLoading={compendiumLoading}
						setCompendiumLoading={setCompendiumLoading}
						setError={setError}
						getValues={getValues}
						setPdfData={setPdfData}
					/>
				)
			},
			{
				label: "SEN AHTN 2022",
				value: "asean",
				content: isQuotaBlocked ? (
					quotaBlockedContent
				) : (
					<Asean
						ref={aseanRef}
						aseanLoading={aseanLoading}
						setAseanLoading={setAseanLoading}
						setError={setError}
						getValues={getValues}
						setPdfData={setPdfData}
					/>
				)
			},
			{
				label: "HS Rulings",
				value: "hs-rulings",
				content: isQuotaBlocked ? (
					quotaBlockedContent
				) : (
					<HSRuling
						ref={hsRulingRef}
						hsRulingLoading={hsRulingLoading}
						setHSRulingLoading={setHSRulingLoading}
						setError={setError}
						getValues={getValues}
					/>
				)
			},
			{
				label: "HS Public Database",
				value: "hs-database",
				content: isQuotaBlocked ? (
					quotaBlockedContent
				) : (
					<HsDatabase
						ref={hsDatabaseRef}
						hsDatabaseLoading={hsDatabaseLoading}
						setHSDatabaseLoading={setHSDatabaseLoading}
						setError={setError}
						getValues={getValues}
					/>
				)
			},
			{
				label: <span className="text-yellow-01 text-lg">AI Conclusion</span>,
				value: "ai-conclusion",
				content: isQuotaBlocked ? (
					quotaBlockedContent
				) : (
					<AiConclusion
						ref={conclusionRef}
						conclusionLoading={conclusionLoading}
						setConclusionLoading={setConclusionLoading}
						hsDatabaseRef={hsDatabaseRef}
						compendiumRef={compendiumRef}
						aseanRef={aseanRef}
						wcoRef={wcoRef}
					/>
				)
			}
		];

		return (
			<Tabs
				tabs={tabs}
				defaultValue="wco"
				onChange={(val) => console.log("Active Tab:", val)}
			/>
		);
	};

	const handleExport = async () => {
		const wcoResult = wcoRef.current?.getSearchResult?.();
		const compendiumResult = compendiumRef.current?.getSearchResult?.();
		const aseanResult = aseanRef.current?.getSearchResult?.();
		const hsRulingResult = hsRulingRef.current?.getSearchResult?.();
		const hsDatabaseResult = hsDatabaseRef.current?.getSearchResult?.();
		const aiResult = conclusionRef.current?.getResult?.();

		const toText = (value: unknown) => {
			if (value === null || value === undefined) return "";
			return String(value).trim();
		};

		const BLOCK_SEPARATOR = "----------------------------------------";

		const joinBlocks = (blocks: string[]) =>
			blocks.filter(Boolean).join(`\n${BLOCK_SEPARATOR}\n`);

		const formatGriUsage = (result: any) => {
			const section = result?.section_classification || {};
			const chapter = result?.chapter_classification || {};
			const heading = result?.heading_classification || {};
			const subheading = result?.subheading_classification || {};
			const combined = [
				section.selected_section?.gir_application,
				chapter.selected_chapter?.gir_application,
				heading.selected_heading?.gir_application,
				subheading.selected_subheading?.gir_application
			].filter((value): value is string => Boolean(value));
			const unique = Array.from(
				new Map(
					combined.map((value: string | number) => [
						String(value).replace(/\s/g, ""),
						String(value)
					])
				).values()
			);
			return unique.filter(Boolean).sort().join(", ");
		};

		const formatWcoNotes = (result: any) => {
			type RejectedId =
				| "section_id"
				| "chapter_id"
				| "heading_id"
				| "subheading_id";
			type RejectedKey =
				| "rejected_sections"
				| "rejected_chapters"
				| "rejected_headings"
				| "rejected_subheadings";
			type WcoBlock = {
				key: string;
				title: string;
				file: string;
				rejectedKey: RejectedKey;
				rejectedId: RejectedId;
			};

			const blocks: WcoBlock[] = [
				{
					key: "section_classification",
					title: "4.1. Section",
					file: "Section",
					rejectedKey: "rejected_sections",
					rejectedId: "section_id"
				},
				{
					key: "chapter_classification",
					title: "4.2. Chapter",
					file: "Chapter",
					rejectedKey: "rejected_chapters",
					rejectedId: "chapter_id"
				},
				{
					key: "heading_classification",
					title: "4.3. Heading",
					file: "Heading",
					rejectedKey: "rejected_headings",
					rejectedId: "heading_id"
				},
				{
					key: "subheading_classification",
					title: "4.4. Sub-Heading",
					file: "Sub-Heading",
					rejectedKey: "rejected_subheadings",
					rejectedId: "subheading_id"
				}
			];

			const formatRejected = (items: any[] | undefined, idKey: RejectedId) =>
				(items || [])
					.map((item) => {
						const identifier = toText(item?.[idKey]);
						const reason = toText(item?.reason);
						if (!identifier && !reason) return "";
						return `${identifier || "N/A"} - ${reason || ""}`.trim();
					})
					.filter(Boolean)
					.join("; ");

			return blocks
				.map(({ key, title, file, rejectedKey, rejectedId }) => {
					const block = result?.[key] || {};
					const selected =
						block.selected_subheading ||
						block.selected_heading ||
						block.selected_chapter ||
						block.selected_section ||
						{};
					const identifier =
						selected.subheading_id ||
						selected.heading_id ||
						selected.chapter_id ||
						selected.section_id ||
						"";
					const headingTitle =
						selected.subheading_title ||
						selected.heading_title ||
						selected.chapter_title ||
						selected.section_title ||
						"";
					const reason = toText(selected.rationale);
					const legalBasis = toText(selected.legal_basis);
					const girApplication = toText(selected.gir_application);
					const productDna = toText(block.product_analysis?.product_dna);
					const keyAttribute = toText(block.product_analysis?.key_attribute);
					const notes = toText(block.content_of_explanatory_notes);
					const pages = (block.source_pages || []).join(", ");
					const rejected = formatRejected(block?.[rejectedKey], rejectedId);

					if (
						!identifier &&
						!headingTitle &&
						!reason &&
						!legalBasis &&
						!girApplication &&
						!productDna &&
						!keyAttribute &&
						!notes &&
						!pages &&
						!rejected
					) {
						return "";
					}

					return [
						title,
						identifier ? `${file}: ${identifier}` : "",
						headingTitle ? `${file} Title: ${headingTitle}` : "",
						reason ? `AI General Explanation: ${reason}` : "",
						legalBasis ? `Legal Basis: ${legalBasis}` : "",
						girApplication ? `GIR Application: ${girApplication}` : "",
						productDna ? `Product DNA: ${productDna}` : "",
						keyAttribute ? `Key Attribute: ${keyAttribute}` : "",
						notes ? `Content Of Explanatory Notes: ${notes}` : "",
						rejected ? `Rejected ${file}s: ${rejected}` : "",
						`Relevant HS Explanatory Notes' files: ${file}.pdf`,
						pages ? `Explanatory Notes Page: ${pages}` : ""
					]
						.filter(Boolean)
						.join("\n");
				})
				.filter(Boolean)
				.join("\n\n");
		};

		const formatCitationItems = (
			items: any[],
			sourceType: "compendium" | "asean"
		) =>
			(items || [])
				.map((item, idx) => {
					const pages = (item.metadata?.source_pages || []).join(", ");
					const fileName =
						sourceType === "compendium"
							? "WCO Compendium of Classification Opinions.pdf"
							: "SEN AHTN 2022 (EN & VN) - Appendix of OL3866 (colour).pdf";
					const fileLabel =
						sourceType === "compendium"
							? "WCO Compendium of Classification Opinions Files"
							: "SEN AHTN 2022 (EN & VN) - Appendix of OL3866 (colour) Files";
					const pageLabel =
						sourceType === "compendium"
							? "WCO Compendium of Classification Opinions Pages"
							: "SEN AHTN 2022 (EN & VN) - Appendix of OL3866 (colour) Pages";

					return [
						`Result ${idx + 1}`,
						item.subheading_ids?.length
							? `HS: ${item.subheading_ids.join(", ")}`
							: "",
						item.reason ? `Reason: ${item.reason}` : "",
						item.content_of_citation
							? `Notes: ${item.content_of_citation}`
							: "",
						`${fileLabel}: ${fileName}`,
						pages ? `${pageLabel}: ${pages}` : ""
					]
						.filter(Boolean)
						.join("\n")
						.trim();
				})
				.filter(Boolean)
				.join("\n\n");

		const formatHsRuling = (result: any) => {
			const results = result?.results || [];
			const sources = result?.sources_queried || [];
			if (!results.length || !sources.length) {
				return "";
			}

			return results
				.map((item: any, idx: number) => {
					const technicalName = toText(item.technical_name);

					const sourceBlocks = sources
						.map((source: any) => {
							const sourceName = toText(source.source_name);
							const sourceUrl = toText(source.source_url);
							const links = (item.links || [])
								.filter((link: any) => toText(link.source) === sourceName)
								.map((link: any) => toText(link.link))
								.filter(Boolean);

							return [
								sourceName ? `Source: ${sourceName}` : "",
								sourceUrl ? `Source URL: ${sourceUrl}` : "",
								"Links:",
								links.length
									? links.map((url: string) => `- ${url}`).join("\n")
									: "- N/A"
							]
								.filter(Boolean)
								.join("\n");
						})
						.filter(Boolean);

					return [
						`Keyword Suggestion ${idx + 1}: "${technicalName}"`,
						joinBlocks(sourceBlocks)
					]
						.filter(Boolean)
						.join("\n");
				})
				.filter(Boolean)
				.join(`\n\n${BLOCK_SEPARATOR}\n\n`);
		};

		const formatHsDatabase = (results: any[]) => {
			const technicalResults = results || [];
			if (!technicalResults.length) {
				return "";
			}

			return technicalResults
				.map((item: any, idx: number) => {
					const technicalName = toText(item.technical_name);
					const sourceBlocks = (item.sources || [])
						.map((source: any) => {
							const sourceName = toText(source.source);
							const sourceUrl = toText(source.source_url);
							const resultUrl = toText(source.result_url);
							const urlsFromHsCodes = (source.hs_codes || [])
								.map((hs: any) => toText(hs.url))
								.filter(Boolean);
							const stats = (source.hs_codes || [])
								.map((hs: any) => {
									const hsCode = toText(hs.hs_code);
									const count = toText(hs.count);
									const total = toText(source.total_count);
									const percentage = toText(hs.percentage);
									return hsCode
										? `- ${hsCode} (${count}/${total}) ~ ${percentage}%`
										: "";
								})
								.filter(Boolean)
								.join("\n");

							const linkBlock =
								toText(sourceUrl).includes("trade-tariff") || !resultUrl
									? [
											"Links:",
											urlsFromHsCodes.length
												? urlsFromHsCodes
														.map((url: string) => `- ${url}`)
														.join("\n")
												: "- N/A"
										].join("\n")
									: `Result URL: ${resultUrl}`;

							return [
								sourceName ? `Source: ${sourceName}` : "",
								sourceUrl ? `Source URL: ${sourceUrl}` : "",
								linkBlock,
								stats ? `Statistics:\n${stats}` : ""
							]
								.filter(Boolean)
								.join("\n");
						})
						.filter(Boolean);

					return [
						`Keyword Suggestion ${idx + 1}: "${technicalName}"`,
						sourceBlocks.length ? joinBlocks(sourceBlocks) : "- N/A"
					]
						.filter(Boolean)
						.join("\n");
				})
				.filter(Boolean)
				.join(`\n\n${BLOCK_SEPARATOR}\n\n`);
		};

		const formatConclusion = (result: any) => {
			if (!result) return "";

			const benchmarkRows = (result.results || [])
				.map((item: any, idx: number) => {
					const sectionChapter = [item.section_info, item.chapter_info]
						.filter(Boolean)
						.join(" / ");
					return [
						`Result ${idx + 1}`,
						item.hs_code ? `HS Sub-heading: ${item.hs_code}` : "",
						item.compatibility_score !== undefined
							? `Score: ${item.compatibility_score}`
							: "",
						item.legal_reasoning ? `Analysis: ${item.legal_reasoning}` : "",
						item.gir_applied ? `GIR Applied: ${item.gir_applied}` : "",
						sectionChapter ? `Section / Chapter: ${sectionChapter}` : ""
					]
						.filter(Boolean)
						.join("\n");
				})
				.filter(Boolean)
				.join("\n\n");

			return [
				"1. Recommended HS Sub-heading",
				result.recommended_hs_code
					? `Recommended HS Code: ${result.recommended_hs_code}`
					: "",
				"",
				"2. Analysis Summary",
				toText(result.executive_summary),
				result.total_hs_codes_analyzed !== undefined
					? `Total HS Codes Analyzed: ${result.total_hs_codes_analyzed}`
					: "",
				"",
				"3. Benchmark",
				benchmarkRows || "No comparison results available."
			]
				.filter((line) => line !== "")
				.join("\n");
		};

		const conclusionText = formatConclusion(aiResult);

		const inputValues = getValues();
		const payload = {
			product_name: toText(inputValues.product_name),
			science_name: toText(inputValues.science_name),
			product_description: toText(inputValues.product_description),
			function: toText(inputValues.function),
			structure: toText(inputValues.structure),
			material: toText(inputValues.material),
			specifications: toText(inputValues.specifications),
			gri: formatGriUsage(wcoResult),
			wco_explanatory_notes: formatWcoNotes(wcoResult),
			wco_compendium: formatCitationItems(compendiumResult || [], "compendium"),
			sen_2022: formatCitationItems(aseanResult || [], "asean"),
			international_hs_ruling: formatHsRuling(hsRulingResult),
			public_hs_database: formatHsDatabase(hsDatabaseResult || []),
			conclusion: conclusionText
		};

		const fileName = `e-tariff-manual-input-${new Date()
			.toISOString()
			.slice(0, 10)}.xlsx`;

		try {
			const blob = await request.post<typeof payload, Blob>(
				"/report/manual-input/export",
				payload,
				{ responseType: "blob" }
			);
			const url = window.URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.download = fileName;
			document.body.appendChild(link);
			link.click();
			link.remove();
			window.URL.revokeObjectURL(url);
		} catch (error) {
			const detail = getQuotaDetail(error);
			if (isQuotaMessage(detail)) {
				setQuotaBlocked(true);
				return;
			}
			console.error("Failed to export manual input", error);
		}
	};

	// Auto scroll to results when search is complete
	useEffect(() => {
		if (searchExecuted && resultsRef && resultsRef.current) {
			setTimeout(() => {
				resultsRef.current &&
					resultsRef.current.scrollIntoView({
						behavior: "smooth",
						block: "start"
					});
			}, 100);
		}
	}, [searchExecuted]);

	return (
		<div
			className="flex-1 overflow-y-auto bg-confident-black"
			style={{ marginRight: pdfName ? `${pdfWidth}px` : 0 }}
		>
			<div className="max-w-[90%] px-10 py-12 mx-auto">
				<h1 className="text-3xl font-bold text-yellow-01 mb-8 uppercase">
					Manual Input{" "}
				</h1>

				<form onSubmit={handleSubmit(onSubmit)}>
					{/* Section 1: Main Information */}
					<div className="bg-off-black rounded-xl shadow-sm border border-off-white p-6">
						<h2 className="text-2xl font-semibold text-white mb-6 inline-block border-b-[3px] border-yellow-01">
							Main Information Inputs
						</h2>

						<div className="space-y-4">
							<div>
								<BaseLabel required>Engagement Code</BaseLabel>
								<BaseFormInput
									name="engagement_code"
									control={control}
									placeholder="Enter Engagement Code"
									type="password"
								/>
							</div>

							<div className="grid grid-cols-[1fr_1fr] gap-8 max-lg:grid-cols-[1fr]">
								<div>
									<BaseLabel required>Commodity Name</BaseLabel>
									<BaseFormInput
										name="product_name"
										control={control}
										placeholder="Enter Commodity Name"
									/>
								</div>

								<div>
									<BaseLabel>Scientific/Technical Name</BaseLabel>
									<BaseFormInput
										name="science_name"
										control={control}
										placeholder="Enter Scientific/Technical Name"
									/>
								</div>
							</div>

							<div>
								<BaseLabel required>Commodity Description</BaseLabel>
								<BaseFormTextarea
									name="product_description"
									control={control}
									placeholder="Enter Commodity Description"
									rows={4}
									resize
								/>
							</div>

							<div className="grid grid-cols-[1fr_1fr] gap-8 max-lg:grid-cols-[1fr]">
								<div>
									<BaseLabel required>Function/Use</BaseLabel>
									<BaseFormTextarea
										name="function"
										control={control}
										placeholder="Enter Function/Use"
										rows={1}
										resize
									/>
								</div>

								<div>
									<BaseLabel>Structure/Consituting components</BaseLabel>
									<BaseFormTextarea
										name="structure"
										control={control}
										placeholder="Enter Structure"
										rows={1}
										resize
									/>
								</div>
							</div>

							<div className="grid grid-cols-[1fr_1fr] gap-8 max-lg:grid-cols-[1fr]">
								<div>
									<BaseLabel>Material/Composition</BaseLabel>
									<BaseFormTextarea
										name="material"
										control={control}
										placeholder="Enter Material/Composition"
										rows={1}
										resize
									/>
								</div>

								<div>
									<BaseLabel>Technical Specification</BaseLabel>
									<BaseFormTextarea
										name="specifications"
										control={control}
										placeholder="Enter Technical Specification"
										rows={1}
										resize
									/>
								</div>
							</div>

							{/* <div>
                <BaseLabel>Image</BaseLabel>
                <BaseFormInputImage name="images" control={control} imageUrl={imageUrl} clearErrors={clearErrors} handleImageUpload={handleImageUpload} />
              </div> */}
						</div>
					</div>

					{/* Section 2: Related Information */}
					<div className="bg-off-black rounded-xl shadow-sm border border-off-white mt-5 p-6">
						<div className="flex items-center justify-between mb-6">
							<h2 className="text-2xl font-semibold text-white mb-6 inline-block border-b-[3px] border-yellow-01">
								Additional Information Inputs
							</h2>
							<BaseButton
								type="button"
								onClick={() => append({ title: "", description: "" })}
								className="flex items-center gap-2 px-4 py-2 bg-yellow-01 text-confident-black rounded-lg transition-colors text-sm font-semibold"
							>
								<Plus size={16} />
								Add Item
							</BaseButton>
						</div>

						<div className="space-y-4">
							{fields.map((field, index) => (
								<div
									key={field.id}
									className="p-4 bg-confident-black/30 rounded-lg border border-off-white"
								>
									<div className="flex items-start justify-end mb-3">
										{fields.length && (
											<BaseButton
												type="button"
												onClick={() => remove(index)}
												className="text-red-500 transition-colors"
											>
												<Trash2 size={18} />
											</BaseButton>
										)}
									</div>

									<div className="space-y-3">
										<div className="grid grid-cols-[1fr_1fr] gap-8 max-lg:grid-cols-[1fr]">
											<div>
												<BaseLabel>Title</BaseLabel>
												<BaseFormInput
													name={`other_information.${index}.title`}
													control={control}
													placeholder="Enter Title"
												/>
											</div>

											<div>
												<BaseLabel>Description</BaseLabel>
												<BaseFormInput
													name={`other_information.${index}.description`}
													control={control}
													placeholder="Enter Description"
												/>
											</div>
										</div>
									</div>
								</div>
							))}
						</div>
					</div>

					{/* Submit Button */}
					<div className="flex justify-end py-6">
						<BaseButton
							type="submit"
							className="flex items-center gap-2 px-6 py-3 bg-yellow-01 text-confident-black rounded-lg transition-colors font-semibold text-xl shadow-sm"
							disabled={isDataLoading || conclusionLoading || isQuotaBlocked}
						>
							{(isDataLoading || conclusionLoading) && !isQuotaBlocked ? (
								<LoaderIcon className="animate-spin-slow" size={20} />
							) : (
								<Search size={20} />
							)}
							Search
						</BaseButton>
					</div>
				</form>

				{/* Section 4: Search Results */}
				<div
					ref={resultsRef}
					hidden={!searchExecuted}
					className="bg-off-black rounded-xl shadow-sm border border-off-white p-6"
				>
					<div className="flex items-center justify-between mb-6">
						<h2 className="text-2xl font-semibold text-white inline-block border-b-[3px] border-yellow-01">
							Possible HS Sub-heading
						</h2>
						{searchExecuted && (
							<BaseButton
								type="button"
								onClick={handleExport}
								disabled={isDataLoading || conclusionLoading}
								className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-semibold bg-yellow-01 text-confident-black ${
									isDataLoading || conclusionLoading
										? "opacity-60 cursor-not-allowed"
										: ""
								}`}
								title={
									isDataLoading || conclusionLoading
										? "Chỉ khả dụng khi tất cả tab đã tải xong"
										: "Export to Excel"
								}
							>
								<Download size={16} />
								Export to Excel
							</BaseButton>
						)}
					</div>

					<div className="space-y-4">
						<div>
							<div className="p-4 bg-confident-black/50 border-off-white rounded-lg border">
								{_renderResults()}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
