"use client";

import { forwardRef, useImperativeHandle, useState } from "react";
import { UseFormGetValues, UseFormSetError } from "react-hook-form";

import clsx from "clsx";
import { uniqBy } from "lodash";
import { FileTextIcon, LoaderIcon } from "lucide-react";

import {
	IBodyHsCodeSearch,
	IResponseHsCodeCompendium
} from "@/types/requests/e-tariff-classification";

import { useQuotaStore } from "@/stores/quota-store";
import { useHsCodeSearchCompendium } from "@/services/requests/e-tariff-classification.request";

interface Props {
	compendiumLoading: boolean;
	setCompendiumLoading: (p: boolean) => void;
	setError: UseFormSetError<any>;
	getValues: UseFormGetValues<any>;
	setPdfData: (pdfName: string, page: number) => void;
}

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

export const Compendium = forwardRef<unknown, Props>((props, ref) => {
	const {
		compendiumLoading,
		setCompendiumLoading,
		setError,
		getValues,
		setPdfData
	} = props;
	const [searchResult, setSearchResult] =
		useState<IResponseHsCodeCompendium | null>(null);
	const setQuotaBlocked = useQuotaStore((state) => state.setQuotaBlocked);

	const { mutate } = useHsCodeSearchCompendium({ setError, getValues });

	const excuteSearch = (data: IBodyHsCodeSearch) => {
		setSearchResult(null);
		setCompendiumLoading(true);
		mutate(data, {
			onSuccess: (res) => {
				setSearchResult(res);
				setCompendiumLoading(false);
			},
			onError(error: any) {
				const detail = getQuotaDetail(error);
				if (isQuotaMessage(detail)) {
					setQuotaBlocked(true);
				}
				setCompendiumLoading(false);
			}
		});
	};

	useImperativeHandle(ref, () => ({
		excuteSearch: excuteSearch,
		getSearchResult: () => searchResult
	}));

	const _renderResults = () => {
		if (!searchResult) {
			return;
		}

		return (
			<>
				{searchResult && (
					<div className="mb-3">
						<p className="text-yellow-01">
							Dưới đây là các kết quả tìm kiếm có bản chất&nbsp;
							<span className="font-semibold">giống</span>
							&nbsp;/&nbsp;
							<span className="font-semibold">gần giống</span>
							&nbsp;nhất so với hàng hoá đang được xét đến.
						</p>
					</div>
				)}

				{searchResult.map((item, i) => {
					const validPages = (item.metadata?.source_pages || []).filter(
						(page) => typeof page === "number" && page > 0
					);

					return (
						<div key={item.subheading_ids.join(", ")}>
							<div className="mb-6">
								{/* <h3 className="text-lg font-semibold text-white mb-1 inline-block border-b-[2px] border-yellow-01">4.4. Sub-Heading</h3> */}
								<p className="text-white">
									<span className="font-semibold">HS Sub-Heading:</span>{" "}
									{item.subheading_ids.join(", ")}
								</p>
								{/* <p className="text-white"><span className="font-semibold">Heading Title:</span> {dataContentSubHeading.subheading_title}</p> */}
								<p className="text-white">
									<span className="font-semibold">Rationale:</span>{" "}
									{item.reason}
								</p>
								<p className="text-white">
									<span className="font-semibold">
										Content Of Explanatory Notes:
									</span>{" "}
									{item.content_of_citation}
								</p>
								<p className="text-white flex">
									<span className="font-semibold">
										WCO Compendium of Classification Opinions Files:&nbsp;
									</span>
									<span
										className="flex gap-1 w-fit items-center cursor-pointer underline"
										onClick={() =>
											setPdfData(
												"WCO Compendium of Classification Opinions.pdf",
												1
											)
										}
									>
										<FileTextIcon size={16} className="text-white" />{" "}
										{"WCO Compendium of Classification Opinions.pdf"}
									</span>
								</p>
								<div className="text-white flex">
									<span className="font-semibold">
										WCO Compendium of Classification Opinions Pages:&nbsp;
									</span>
									{validPages.length ? (
										<div className="flex gap-2 w-fit items-center cursor-pointer underline">
											{validPages.map((page) => (
												<span
													key={page}
													onClick={() =>
														setPdfData(
															"WCO Compendium of Classification Opinions.pdf",
															page
														)
													}
												>
													{page}
												</span>
											))}
										</div>
									) : (
										<span>No reference pages available.</span>
									)}
								</div>
							</div>

							<div
								className={clsx(
									"bg-gradient-to-r from-transparent via-off-white to-transparent h-[1px] w-full mb-6",
									i === searchResult.length - 1 && "mb-0 hidden"
								)}
							></div>
						</div>
					);
				})}
			</>
		);
	};

	return (
		<>
			{_renderResults()}
			{compendiumLoading && (
				<LoaderIcon className="animate-spin-slow text-white" size={20} />
			)}
		</>
	);
});
