"use client";

import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { UseFormGetValues, UseFormSetError } from "react-hook-form";

import clsx from "clsx";
import { forEach, orderBy } from "lodash";
import { FileTextIcon, LoaderIcon } from "lucide-react";

import {
	IBodyHsCodeSearch,
	IResponseHsDatabase
} from "@/types/requests/e-tariff-classification";

import { useQuotaStore } from "@/stores/quota-store";
import {
	useHsDatabaseSearchAsync,
	useHsDatabaseSearchAsyncPolling
} from "@/services/requests/e-tariff-classification.request";
import { formatKey, toWordUpperCaseFirst } from "@/lib/utils";

import { BaseTable, Column } from "@/components/common/table";

interface Props {
	hsDatabaseLoading: boolean;
	setHSDatabaseLoading: (p: boolean) => void;
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
		normalized.includes("quota exceeded")
	);
};

export const HsDatabase = forwardRef<{}, Props>((props, ref) => {
	const { hsDatabaseLoading, setHSDatabaseLoading, setError, getValues } =
		props;
	const [searchResult, setSearchResult] = useState<
		IResponseHsDatabase["result"]["results"] | null
	>(null);
	const [taskId, setTaskId] = useState("");
	const setQuotaBlocked = useQuotaStore((state) => state.setQuotaBlocked);

	const { mutate } = useHsDatabaseSearchAsync({ setError, getValues });
	const { mutate: polling } = useHsDatabaseSearchAsyncPolling({
		setError,
		getValues
	});

	const excuteSearch = (data: IBodyHsCodeSearch) => {
		setSearchResult(null);
		setHSDatabaseLoading(true);
		mutate(data, {
			onSuccess: (res) => {
				setTaskId(res.task_id);
			},
			onError() {
				setHSDatabaseLoading(false);
			}
		});
	};

	const getHsDatabaseAsyncPolling = () => {
		if (!taskId) {
			return;
		}

		const interval = setInterval(async () => {
			polling(taskId, {
				onSuccess: (res) => {
					console.log(res);
					const responseError =
						(res as { error?: string } | undefined)?.error ||
						(res as { result?: { error?: string } } | undefined)?.result
							?.error ||
						null;
					if (responseError && isQuotaMessage(responseError)) {
						setQuotaBlocked(true);
						clearInterval(interval);
						setHSDatabaseLoading(false);
						return;
					}
					const normalizedStatus = String(res.status || "").toUpperCase();
					const hasResult = Boolean(res.result);
					if (normalizedStatus === "SUCCESS" || hasResult) {
						clearInterval(interval);
						setHSDatabaseLoading(false);
					}

					setSearchResult(res?.result?.results);
				},
				onError: () => {
					clearInterval(interval);
					setHSDatabaseLoading(false);
				}
			});
		}, 1000);

		return interval;
	};

	const convertData = () => {
		if (!searchResult) {
			return;
		}

		const columns = searchResult.map((item, index) => ({
			key: `${formatKey(item.technical_name)}_${index}`,
			resultIndex: index,
			technical_name: toWordUpperCaseFirst(item.technical_name)
		}));

		const allSources: any[] = [];
		searchResult.forEach((item) => {
			if (!item.sources || !Array.isArray(item.sources)) {
				return;
			}

			item.sources.forEach((sourceItem) => {
				if (
					!sourceItem.source ||
					allSources.map((item) => item.source).includes(sourceItem.source)
				) {
					return;
				}

				allSources.push({
					source: sourceItem.source,
					source_url: sourceItem.source_url
				});
			});
		});

		const tableRows = allSources.map((item: any) => {
			const rowObj: any = {
				source: item?.source,
				source_url: item?.source_url
			};

			columns.forEach((col) => {
				const techItem = searchResult[col.resultIndex];

				const matchingLinks = techItem?.sources.filter(
					(l) => l?.source === item?.source
				);

				rowObj[col.key] = matchingLinks?.[0] || {};
			});

			return rowObj;
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
			width: "30%",
			render: (_: string, record: any) => {
				const data = record[item.key] || null;

				const _renderData = () => {
					if (!data || !data?.hs_codes?.length) {
						return <span className="text-white">N/A</span>;
					}

					if (data.source_url?.includes("trade-tariff")) {
						return data?.hs_codes?.length ? (
							data?.hs_codes?.map((item: any) => (
								<a
									className="text-blue-500 underline"
									target="_blank"
									key={item.hs_code}
									href={item.url}
								>
									{item.url}
								</a>
							))
						) : (
							<span className="text-white">N/A</span>
						);
					}

					return (
						<>
							<a
								className="text-blue-500 underline"
								target="_blank"
								href={data.result_url}
							>
								{data.result_url}
							</a>
							{data?.hs_codes?.length ? (
								<div className="text-white">
									<p>Statistics:</p>
									<div className="w-[80%] h-fit max-h-[154px] overflow-y-hidden [&::-webkit-scrollbar]:w-[6px] [&::-webkit-scrollbar-thumb]:bg-gray-03 [&::-webkit-scrollbar-thumb]:rounded-lg p-3 hover:pr-1.5 hover:overflow-y-auto border-off-white rounded-lg border text-sm">
										{data?.hs_codes?.map((item: any, i: number) => (
											<div key={item.hs_code}>
												<div className="flex justify-between">
													<span className="max-w-56 truncate">
														{item.hs_code} ({item.count}/{data.total_count})
													</span>
													<span className="text-yellow-01 font-semibold">
														~ {item.percentage}%
													</span>
												</div>
												<div
													className={clsx(
														"bg-gradient-to-r from-transparent via-off-white to-transparent h-[1px] my-1 w-full",
														i === data?.hs_codes.length - 1 && "mb-0 hidden"
													)}
												></div>
											</div>
										))}
									</div>
								</div>
							) : (
								""
							)}
						</>
					);
				};

				return <div className="flex gap-0.5 flex-col">{_renderData()}</div>;
			}
		})) as Column<any>[];

		const columns = [
			{
				key: "source",
				dataIndex: "source",
				width: "10%",
				align: "center" as const,
				render: (_: string, record: any) => (
					<a
						className="text-blue-500 underline"
						target="_blank"
						href={record.source_url}
					>
						{record.source}
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
								Dưới đây là các kết quả tìm kiếm được dựa trên&nbsp;
								<span className="font-semibold">ba (03) keywords</span>
								&nbsp;mà chúng tôi gợi ý sử dụng.
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

	useEffect(() => {
		const interval = getHsDatabaseAsyncPolling();

		// Cleanup khi component unmount hoặc taskId đổi
		return () => {
			clearInterval(interval);
		};
	}, [taskId]);

	useEffect(() => {
		if (searchResult) {
			const els = Array.from(document.getElementsByClassName("statistics"));

			const handlers = new Map();

			els.forEach((el) => {
				const handleMouseEnter = () => {
					if (el.clientHeight >= 152) {
						el.classList.add("pr-1.5", "!overflow-y-auto");
					}
				};

				const handleMouseLeave = () => {
					el.classList.remove("pr-1.5", "!overflow-y-auto");
				};

				el.addEventListener("mouseenter", handleMouseEnter);
				el.addEventListener("mouseleave", handleMouseLeave);

				handlers.set(el, { enter: handleMouseEnter, leave: handleMouseLeave });
			});

			return () => {
				els.forEach((el) => {
					const handler = handlers.get(el);
					if (handler) {
						el.removeEventListener("mouseenter", handler.enter);
						el.removeEventListener("mouseleave", handler.leave);
					}
				});
			};
		}
	}, [searchResult]);

	return (
		<>
			{_renderResults()}
			{hsDatabaseLoading && (
				<LoaderIcon className="animate-spin-slow text-white" size={20} />
			)}
		</>
	);
});
