"use client";

import React, { useEffect, useState } from "react";

import PdfPreview from "@/components/features/e-tariff-classification/PDFPreview";
import HsCodeSearchForm from "@/components/features/e-tariff-classification/SearchForm";

export default function HsCodeSearchPage() {
	const [pdfName, setPdfName] = useState("");
	const [page, setPage] = useState<number>();
	const [pdfWidth, setPdfWidth] = useState(700);
	const [isResizing, setIsResizing] = useState(false);

	const setPdfData = (pdfName: string, page: number) => {
		setPdfName(pdfName);
		setPage(page);
	};

	const startResize = (e: any) => {
		setIsResizing(true);
		e.preventDefault();
	};

	useEffect(() => {
		const handleMouseMove = (e: MouseEvent) => {
			if (isResizing) {
				const newWidth = window.innerWidth - e.clientX;
				if (newWidth >= 300 && newWidth <= 1200) {
					setPdfWidth(newWidth);
				}
			}
		};

		const handleMouseUp = () => {
			setIsResizing(false);
		};

		if (isResizing) {
			document.addEventListener("mousemove", handleMouseMove);
			document.addEventListener("mouseup", handleMouseUp);
		}

		return () => {
			document.removeEventListener("mousemove", handleMouseMove);
			document.removeEventListener("mouseup", handleMouseUp);
		};
	}, [isResizing]);

	return (
		<div className="flex h-screen bg-confident-black">
			{/* Main Content Area */}
			<HsCodeSearchForm
				pdfName={pdfName}
				pdfWidth={pdfWidth}
				setPdfData={setPdfData}
			/>

			{/* Right Sidebar - PDF Viewer */}
			{pdfName && (
				<PdfPreview
					setPdfData={setPdfData}
					pdfName={pdfName}
					page={page}
					startResize={startResize}
					pdfWidth={pdfWidth}
				/>
			)}
		</div>
	);
}
