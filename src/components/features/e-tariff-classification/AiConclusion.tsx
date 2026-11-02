"use client";

import {
	forwardRef,
	RefObject,
	useEffect,
	useImperativeHandle,
	useState
} from "react";

import { first, orderBy } from "lodash";
import { LoaderIcon } from "lucide-react";

import {
	IBodyHsCodeSearch,
	IHsCodeAnalyzeResponse,
	IResponseHsCode,
	IResponseHsCodeCompendium,
	IResponseHsDatabase
} from "@/types/requests/e-tariff-classification";

import { useQuotaStore } from "@/stores/quota-store";
import { useHsCodeAnalyze } from "@/services/requests/e-tariff-classification.request";

import { BaseTable, Column } from "@/components/common/table";

interface Props {
	conclusionLoading: boolean;
	setConclusionLoading: (value: boolean) => void;
	hsDatabaseRef: RefObject<any>;
	compendiumRef: RefObject<any>;
	aseanRef: RefObject<any>;
	wcoRef: RefObject<any>;
}

export interface AiConclusionHandle {
	executeAnalysis: (formData: IBodyHsCodeSearch) => void;
	getResult: () => IHsCodeAnalyzeResponse | null;
	getError: () => string | null;
}

export const AiConclusion = forwardRef<AiConclusionHandle, Props>(
	(props, ref) => {
		const {
			conclusionLoading,
			setConclusionLoading,
			hsDatabaseRef,
			compendiumRef,
			aseanRef,
			wcoRef
		} = props;

		const [aiResult, setAiResult] = useState<IHsCodeAnalyzeResponse | null>(
			null
		);
		const [aiError, setAiError] = useState<string | null>(null);
		const { mutate } = useHsCodeAnalyze({});
		const setQuotaBlocked = useQuotaStore((state) => state.setQuotaBlocked);

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

		useEffect(() => {
			if (!conclusionLoading) {
				return;
			}
			setAiError(null);
			setAiResult(null);
		}, [conclusionLoading]);

		const HsCodeAnalysisResult = ({
			data
		}: {
			data: IHsCodeAnalyzeResponse;
		}) => {
			const hasResults = data?.results?.length;
			const fallbackRecommended = first(data?.results)?.hs_code;
			const recommendedHsCode = data.recommended_hs_code || fallbackRecommended;
			const columns: Column<IHsCodeAnalyzeResponse["results"][number]>[] = [
				{
					key: "hs_code",
					title: "HS Sub-heading",
					dataIndex: "hs_code",
					align: "center",
					width: "15%",
					render: (value) => <span className="text-white">{value || "-"}</span>
				},
				{
					key: "compatibility_score",
					title: "Score",
					dataIndex: "compatibility_score",
					align: "center",
					width: "10%",
					render: (value) => (
						<span className="text-yellow-01 font-semibold">{value}</span>
					)
				},
				{
					key: "legal_reasoning",
					title: "Analysis",
					dataIndex: "legal_reasoning",
					width: "50%",
					render: (value, record) => (
						<div className="text-white whitespace-pre-line">
							{value || "-"}
							{record.gir_applied && (
								<p className="text-yellow-01 mt-2">
									GIR Applied: {record.gir_applied}
								</p>
							)}
						</div>
					)
				},
				{
					key: "section_chapter",
					title: "Section / Chapter",
					width: "25%",
					render: (_, record) => (
						<p className="text-gray-01">
							{record.section_info || "-"}
							{record.section_info && record.chapter_info && " / "}
							{record.chapter_info || ""}
						</p>
					)
				}
			];

			return (
				<div className="space-y-6">
					<div className="bg-confident-black/50 border border-off-white rounded-lg p-4">
						<h2 className="text-xl font-semibold text-white mb-2 inline-block border-b-[2px] border-yellow-01">
							Recommended HS Sub-heading
						</h2>
						<p className="text-white text-lg">
							<span className="font-semibold text-yellow-01">
								{recommendedHsCode || "N/A"}
							</span>
						</p>
						{data.executive_summary && (
							<p className="text-white mt-3 whitespace-pre-line">
								{data.executive_summary}
							</p>
						)}
					</div>

					<div>
						<h3 className="text-xl font-semibold text-white mb-3 inline-block border-b-[2px] border-yellow-01">
							Benchmark
						</h3>

						{!hasResults && (
							<p className="text-gray-01">No comparison results available.</p>
						)}

						{hasResults && (
							<div className="bg-confident-black/40 border border-off-white rounded-lg">
								<BaseTable
									columns={columns}
									data={data.results}
									emptyText="No comparison results available."
									rowKey={(record) => record.hs_code}
									className="text-white"
									headerClassName="bg-confident-black/60"
									rowClassName="border-off-white"
									bordered
								/>
							</div>
						)}
					</div>
				</div>
			);
		};

		const extractHsCodesFromResults = () => {
			const hsCodesMap = new Map<string, number>();

			const hsDatabaseResults = hsDatabaseRef.current?.getSearchResult?.() as
				| IResponseHsDatabase["result"]["results"]
				| null
				| undefined;

			if (hsDatabaseResults && Array.isArray(hsDatabaseResults)) {
				hsDatabaseResults.forEach((result) => {
					result.sources?.forEach((source) => {
						source.hs_codes?.forEach((hsCode) => {
							const count = hsCodesMap.get(hsCode.hs_code) || 0;
							hsCodesMap.set(hsCode.hs_code, count + hsCode.count);
						});
					});
				});
			}

			const compendiumResults = compendiumRef.current?.getSearchResult?.() as
				| IResponseHsCodeCompendium
				| null
				| undefined;

			if (compendiumResults && Array.isArray(compendiumResults)) {
				compendiumResults.forEach((item) => {
					item.subheading_ids?.forEach((id) => {
						const count = hsCodesMap.get(id) || 0;
						hsCodesMap.set(id, count + 1);
					});
				});
			}

			const aseanResults = aseanRef.current?.getSearchResult?.() as
				| IResponseHsCodeCompendium
				| null
				| undefined;

			if (aseanResults && Array.isArray(aseanResults)) {
				aseanResults.forEach((item) => {
					item.subheading_ids?.forEach((id) => {
						const count = hsCodesMap.get(id) || 0;
						hsCodesMap.set(id, count + 1);
					});
				});
			}

			// Extract WCO Explanatory code before slicing so it is
			// always a candidate regardless of occurrence-count ranking.
			const wcoResult = wcoRef.current?.getSearchResult?.() as
				| IResponseHsCode["result"]
				| null
				| undefined;

			const wcoSubheadingId =
				wcoResult?.subheading_classification?.selected_subheading
					?.subheading_id;

			// Remove WCO code from map temporarily so the top-10 slice
			// is based purely on frequency from the other sources.
			const wcoCountInMap = wcoSubheadingId
				? hsCodesMap.get(wcoSubheadingId) || 0
				: 0;
			if (wcoSubheadingId) {
				hsCodesMap.delete(wcoSubheadingId);
			}

			const mapped = Array.from(hsCodesMap.entries()).map(
				([hs_code, count]) => ({
					hs_code,
					number_of_occurrences: count
				})
			);

			const top10 = orderBy(mapped, ["number_of_occurrences"], ["desc"]).slice(
				0,
				10
			);

			// Always re-insert the WCO code (merged count) so the LLM
			// always considers it, even if it would have been cut off.
			if (wcoSubheadingId) {
				const existingIdx = top10.findIndex(
					(c) => c.hs_code === wcoSubheadingId
				);
				if (existingIdx === -1) {
					top10.push({
						hs_code: wcoSubheadingId,
						number_of_occurrences: wcoCountInMap + 1
					});
				} else {
					top10[existingIdx] = {
						...top10[existingIdx],
						number_of_occurrences: top10[existingIdx].number_of_occurrences + 1
					};
				}
			}

			return top10;
		};

		const executeAnalysis = (formData: IBodyHsCodeSearch) => {
			setAiError(null);
			setAiResult(null);

			const extractedHsCodes = extractHsCodesFromResults();
			if (!extractedHsCodes.length) {
				setAiError(
					"No HS codes were extracted from the existing search results."
				);
				setConclusionLoading(false);
				return;
			}

			const product = {
				product_name: formData.product_name,
				science_name: formData.science_name || null,
				product_description: formData.product_description,
				function: formData.function,
				structure: formData.structure || null,
				material: formData.material || null,
				specifications: formData.specifications || null,
				other_information: formData.other_information || null
			};

			mutate(
				{
					product,
					hs_codes: extractedHsCodes
				},
				{
					onSuccess: (result) => {
						setAiResult(result);
						setConclusionLoading(false);
					},
					onError: (error: any) => {
						const detail = getQuotaDetail(error);
						if (isQuotaMessage(detail)) {
							setQuotaBlocked(true);
							setAiError(
								"Insufficient LLM credits. Please add more tokens to continue."
							);
							setConclusionLoading(false);
							return;
						}
						setAiError(detail || "Failed to analyze HS codes");
						setConclusionLoading(false);
					}
				}
			);
		};

		useImperativeHandle(ref, () => ({
			executeAnalysis,
			getResult: () => aiResult,
			getError: () => aiError
		}));

		return (
			<div className="space-y-3">
				{conclusionLoading && (
					<div className="text-white flex items-center gap-2">
						<LoaderIcon className="animate-spin-slow text-white" size={20} />
					</div>
				)}
				{aiError && <div className="text-red-500">{aiError}</div>}
				{!conclusionLoading && aiResult && (
					<HsCodeAnalysisResult data={aiResult} />
				)}

				{/* default description of tab */}
				{!conclusionLoading && !aiError && !aiResult && (
					<div className="text-gray-01">
						Run a search to generate AI conclusion.
					</div>
				)}
			</div>
		);
	}
);

AiConclusion.displayName = "AiConclusion";
