import React from "react";

import LeftSidebar from "@/components/layout/LeftSidebar";

interface HomeLayoutProps {
	children: React.ReactNode;
}

export default function HomeLayout({ children }: HomeLayoutProps) {
	return (
		<div className="flex h-screen bg-confident-black">
			<LeftSidebar />
			<main className="flex-1">{children}</main>
		</div>
	);
}
