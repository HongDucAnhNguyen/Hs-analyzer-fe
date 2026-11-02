import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export const sleep = (ms: number) => {
	return new Promise((resolve) => setTimeout(resolve, ms));
};

export const fileToBase64 = (file: File): Promise<string> => {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.readAsDataURL(file);
		reader.onload = () => resolve(reader.result as string);
		reader.onerror = (error) => reject(error);
	});
};

export const formatKey = (str: string) => {
	if (!str) return "";
	return str.toLowerCase().trim().replace(/\s+/g, "_");
};

export const toWordUpperCaseFirst = (str: string) => {
	if (!str) return "";
	return str
		.trim()
		.split(/\s+/)
		.map((word) => {
			return word.charAt(0).toUpperCase() + word.slice(1);
		})
		.join(" ");
};

export const downloadFile = (url: string) => {
	const fileLink = document.createElement("a");

	fileLink.href = url;
	// fileLink.setAttribute('download', fileName)
	document.body.appendChild(fileLink);
	fileLink.click();

	document.body.removeChild(fileLink);
};
