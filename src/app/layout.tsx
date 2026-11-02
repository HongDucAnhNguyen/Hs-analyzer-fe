import React from "react";

import { Providers } from "@/providers";

import "./globals.css";

interface RootLayoutProps {
	children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
	return (
		<html lang="vi" suppressHydrationWarning>
			<head>
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
			</head>
			<body className="antialiased flex flex-col min-h-screen w-full">
				<Providers>{children}</Providers>
			</body>
		</html>
	);
}
