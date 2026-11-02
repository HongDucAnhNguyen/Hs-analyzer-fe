"use client";

import { forwardRef, useImperativeHandle, useState } from "react";
import { UseFormGetValues, UseFormSetError } from "react-hook-form";

import { LoaderIcon } from "lucide-react";

import {
	IBodyHsCodeSearch,
	IResponseHsRuling
} from "@/types/requests/e-tariff-classification";

import { useQuotaStore } from "@/stores/quota-store";
import { useHsRulingSearch } from "@/services/requests/e-tariff-classification.request";
import { formatKey, toWordUpperCaseFirst } from "@/lib/utils";

import { BaseTable, Column } from "@/components/common/table";

interface Props {
	hsRulingLoading: boolean;
	setHSRulingLoading: (p: boolean) => void;
	setError: UseFormSetError<any>;
	getValues: UseFormGetValues<any>;
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

export const HSRuling = forwardRef<unknown, Props>((props, ref) => {
	const { hsRulingLoading, setHSRulingLoading, setError, getValues } = props;
	const [searchResult, setSearchResult] = useState<IResponseHsRuling | null>(
		null
	);
	const setQuotaBlocked = useQuotaStore((state) => state.setQuotaBlocked);

	const { mutate } = useHsRulingSearch({ setError, getValues });

	const excuteSearch = (data: IBodyHsCodeSearch) => {
		setSearchResult(null);
		setHSRulingLoading(true);
		mutate(data, {
			onSuccess: (res) => {
				setSearchResult(res);
				setHSRulingLoading(false);
			},
			onError(error: any) {
				const detail = getQuotaDetail(error);
				if (isQuotaMessage(detail)) {
					setQuotaBlocked(true);
				}
				setHSRulingLoading(false);
			}
		});
	};

	const convertData = () => {
		if (!searchResult) {
			return;
		}

		const results = searchResult.results;
		const allSources: any[] = searchResult.sources_queried;

		const columns = results.map((item, index) => ({
			key: `${formatKey(item.technical_name)}_${index}`,
			resultIndex: index,
			technical_name: toWordUpperCaseFirst(item.technical_name)
		}));

		const tableRows = allSources.map((item: any) => {
			columns.forEach((col) => {
				const techItem = results[col.resultIndex];

				const matchingLinks = techItem?.links
					.filter((l) => l?.source === item?.source_name)
					.map((l) => l.link);

				item[col.key] = matchingLinks;
			});

			return item;
		});

		return {
			headers: [...columns],
			rows: tableRows
		};
	};

	useImperativeHandle(ref, () => ({
		excuteSearch: excuteSearch,
		getSearchResult: () => searchResult
	}));

	const _renderResults = () => {
		if (!searchResult) {
			return;
		}

		const data = convertData();

		const technicalColumns = data?.headers.map((item, i) => ({
			key: item.key,
			title: (
				<span>
					Keyword Suggestion {i + 1}:&nbsp;&quot;
					<span className="underline italic">{item.technical_name}</span>&quot;
				</span>
			),
			dataIndex: item.key,
			align: "center" as const,
			width: "25%",
			render: (_: string, record: any) => (
				<div className="flex gap-0.5 flex-col w-fit">
					{record[item.key].length ? (
						record[item.key].map((link: string) => (
							<a
								className="text-blue-500 underline"
								target="_blank"
								key={link}
								href={link}
							>
								{link}
							</a>
						))
					) : (
						<span className="text-white">N/A</span>
					)}
				</div>
			)
		})) as Column<any>[];

		const columns = [
			{
				key: "source_name",
				dataIndex: "source_name",
				width: "25%",
				align: "center" as const,
				render: (_: string, record: any) => (
					<a
						className="text-blue-500 underline"
						target="_blank"
						href={record.source_url}
					>
						{record.source_name}
					</a>
				)
			},
			...technicalColumns
		];

		return (
			<>
				{searchResult && (
					<>
						<div className="mb-3">
							<p className="text-yellow-01">
								Dưới đây là các kết quả tìm kiếm có bản chất&nbsp;
								<span className="font-semibold">giống</span>
								&nbsp;/&nbsp;
								<span className="font-semibold">gần giống</span>
								&nbsp;nhất so với hàng hoá đang được xét đến từ năm 2012 trở lại
								đây.
							</p>
						</div>

						<div className="mb-6">
							<BaseTable columns={columns} data={data?.rows as any[]} />
						</div>
					</>
				)}
			</>
		);
	};

	return (
		<>
			{_renderResults()}
			{hsRulingLoading && (
				<LoaderIcon className="animate-spin-slow text-white" size={20} />
			)}
		</>
	);
});
