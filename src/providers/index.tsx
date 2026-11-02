"use client";

import { ReactNode } from "react";
import { ThemeProvider } from "next-themes";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { Toaster } from "@/components/common/sonner";

const queryClient = new QueryClient();

export function Providers({ children }: { children: ReactNode }) {
	return (
		<ThemeProvider attribute="class">
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
			<Toaster />
		</ThemeProvider>
	);
}
