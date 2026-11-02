"use client";

import React, { MouseEventHandler, useEffect, useState } from "react";

import { Viewer, Worker } from "@react-pdf-viewer/core";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";
import type { ToolbarProps } from "@react-pdf-viewer/default-layout";
import { FileTextIcon, X } from "lucide-react";

import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";

import { pageNavigationPlugin } from "@react-pdf-viewer/page-navigation";

interface Props {
	pdfName: string;
	pdfWidth: number;
	page?: number;
	startResize: MouseEventHandler<HTMLDivElement> | undefined;
	setPdfData: (pdfName: string, page: number) => void;
}

export default function PdfPreview(props: Props) {
	const { startResize, setPdfData, pdfName, pdfWidth, page } = props;

	const [documentLoaded, setDocumentLoaded] = useState(false);
	const [pdfUrl, setPdfUrl] = useState("");

	const pageNavigationPluginInstance = pageNavigationPlugin();
	const defaultLayoutPluginInstance = defaultLayoutPlugin({
		renderToolbar: (Toolbar: (props: ToolbarProps) => React.ReactElement) => (
			<Toolbar>
				{(slots) => {
					const { CurrentPageInput, ZoomOut, ZoomIn, NumberOfPages } = slots;

					return (
						<div className="flex w-full justify-between items-center">
							<div className="w-[50px]"></div>
							<div className={` flex items-center `}>
								<CurrentPageInput />/ <NumberOfPages />
							</div>
							<div className="flex">
								<ZoomOut />
								<ZoomIn />
							</div>
						</div>
					);
				}}
			</Toolbar>
		),
		sidebarTabs: (defaultTabs) => (true ? [defaultTabs[0]] : [])
	});

	const _renderPdfUrl = () => {
		if (!pdfName) {
			return;
		}

		const baseUrl = process.env.NEXT_PUBLIC_EXPLANATORY_FILE_URL;
		const hasHeading = pdfName.includes("Heading");
		const hasChapter = pdfName.includes("Chapter");
		const hasSection = pdfName.includes("Section");
		const hasCompendium = pdfName.includes("Compendium");
		const hasAsean = pdfName.includes("SEN AHTN 2022");

		if (hasSection && hasChapter && hasHeading) {
			const match = pdfName.match(/Chapter_(\d+)_Section_([A-Z]+)/);
			const chapter = match?.[1];
			const section = match?.[2];
			const url = `${baseUrl}headings/chapters_Section_${section}/headings_output_Chapter_${chapter}_Section_${section}/${pdfName}`;
			setPdfUrl(url);
			return;
		}

		if (hasSection && hasChapter) {
			const match = pdfName.match(/Chapter_(\d+)_Section_([A-Z]+)/);
			const section = match?.[2];
			const url = `${baseUrl}chapters/chapters_Section_${section}/${pdfName}`;
			setPdfUrl(url);
			return;
		}

		if (hasSection) {
			const url = `${baseUrl}sections/${pdfName}`;
			setPdfUrl(url);
			return;
		}

		if (hasCompendium) {
			const url = `${baseUrl}compendium/${pdfName}`;
			setPdfUrl(url);
			return;
		}

		if (hasAsean) {
			const url = `${baseUrl}asean/${pdfName}`;
			setPdfUrl(url);
			return;
		}
	};

	useEffect(() => {
		_renderPdfUrl();
	}, [pdfName]);

	useEffect(() => {
		if (documentLoaded && page !== undefined) {
			const pageIndex = Math.max(0, page - 1);
			pageNavigationPluginInstance.jumpToPage(pageIndex);
		}
	}, [page, documentLoaded, pageNavigationPluginInstance]);

	return (
		<>
			{/* Resize Handle */}
			<div
				onMouseDown={startResize}
				className="absolute top-0 bottom-0 w-1 bg-off-black/30 cursor-col-resize transition-colors z-10"
				style={{ right: `${pdfWidth}px` }}
			/>

			<div
				className="fixed top-0 right-0 bottom-0 bg-confident-black border-l border-off-white shadow-lg flex flex-col"
				style={{ width: `${pdfWidth}px` }}
			>
				<div className="flex items-center justify-between p-4 border-b border-off-white">
					<div className="flex items-center gap-2 text-2xl font-semibold text-white border-b-[3px] border-yellow-01">
						<FileTextIcon size={24} />
						<h3 className="font-semibold">{pdfName}</h3>
					</div>
					<button
						onClick={() => setPdfData("", 0)}
						className="text-white transition-colors cursor-pointer"
					>
						<X size={20} />
					</button>
				</div>

				<div className="flex-1 overflow-auto p-4 bg-off-black">
					<div className="bg-white h-full overflow-hidden text-center">
						<Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
							<div className="h-full overflow-x-auto">
								<Viewer
									fileUrl={pdfUrl}
									plugins={[
										defaultLayoutPluginInstance,
										pageNavigationPluginInstance
									]}
									onDocumentLoad={() => {
										setDocumentLoaded(true);
										if (page !== undefined) {
											const pageIndex = Math.max(0, page - 1);
											pageNavigationPluginInstance.jumpToPage(pageIndex);
										}
									}}
								/>
							</div>
						</Worker>
					</div>
				</div>
			</div>
		</>
	);
}
