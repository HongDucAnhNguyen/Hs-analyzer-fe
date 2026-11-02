"use client";

import { useState, type MouseEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { cookieStorageHelper } from "@/helpers/store-helper";
import {
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	DatabaseIcon,
	FileSpreadsheet,
	LogOutIcon,
	PencilLine,
	SearchIcon
} from "lucide-react";

import { useLogout } from "@/services/requests/auth.request";

import { BaseButton } from "../common/button";

type SubMenuItem = {
	icon: typeof SearchIcon;
	label: string;
	path: string;
	disabled?: boolean;
};

type MenuItem = {
	icon: typeof SearchIcon;
	label: string;
	path: string;
	subItems?: SubMenuItem[];
	subLabel?: string;
};

const menuItems: MenuItem[] = [
	{
		icon: SearchIcon,
		label: "E-tariff classification",
		path: "/e-tariff-classification/manual-input",
		subItems: [
			{
				icon: PencilLine,
				label: "Manual Input",
				path: "/e-tariff-classification/manual-input"
			},
			{
				icon: FileSpreadsheet,
				label: "Dataset Input",
				path: "/e-tariff-classification/dataset-input"
			}
		]
	},
	{
		icon: DatabaseIcon,
		label: "Customs Health Check",
		path: "/customs-health-check"
	}
];

export default function LeftSidebar() {
	const pathname = usePathname();
	const router = useRouter();
	const [collapsed, setCollapsed] = useState(false);
	const [tariffExpanded, setTariffExpanded] = useState(true);
	const showSubmenu = !collapsed && tariffExpanded;

	const { mutate } = useLogout();

	const handleLogout = () => {
		mutate(undefined, {
			onSuccess: () => {
				cookieStorageHelper.remove("access_token");
				router.push("/login");
			}
		});
	};

	return (
		<div className="flex h-screen">
			{/* Sidebar */}
			<aside
				className={`${
					collapsed ? "w-[70px]" : "w-64"
				} bg-confident-black border-r border-gray-01/20 transition-all duration-300 ease-in-out flex flex-col`}
			>
				{/* Header */}
				<div className="h-16 flex items-center justify-between px-4 border-b border-white">
					<h1
						className={`text-yellow-01 uppercase font-bold text-[16px] whitespace-nowrap overflow-hidden transition-[opacity,transform,max-width] duration-300 ease-in-out origin-left ${
							collapsed
								? "opacity-0 -translate-x-2 max-w-0 pointer-events-none delay-0"
								: "opacity-100 translate-x-0 max-w-[220px] delay-75"
						}`}
						aria-hidden={collapsed}
					>
						GLOBAL TRADE TOOLS
					</h1>
					<button
						onClick={() => setCollapsed(!collapsed)}
						className="p-2 cursor-pointer rounded-lg "
					>
						{collapsed ? (
							<ChevronRight className="w-5 h-5 text-yellow-01 " />
						) : (
							<ChevronLeft className="w-5 h-5 text-yellow-01 " />
						)}
					</button>
				</div>

				{/* Menu Items */}
				<nav className="flex-1 py-4">
					<ul className="space-y-4 px-3">
						{menuItems.map((item) => {
							const Icon = item.icon;
							const hasSubmenu = Boolean(item.subItems?.length);
							const isGroupActive = item.path
								? pathname.startsWith(item.path.replace("/manual-input", ""))
								: false;

							return (
								<li key={item.label}>
									<div className="flex items-center justify-between">
										<Link
											href={item.path}
											className={`flex items-center gap-3 px-2 py-3 rounded-lg transition-all duration-200 flex-1 ${
												isGroupActive
													? "bg-yellow-01 text-confident-black font-medium"
													: "text-yellow-01 hover:bg-confident-black"
											} ${collapsed ? "justify-center group relative" : ""}`}
											onClick={(event: MouseEvent<HTMLAnchorElement>) => {
												const target = event.target as HTMLElement;
												if (target.closest("button")) {
													event.preventDefault();
												}
											}}
										>
											<Icon
												className={`w-5 h-5 flex-shrink-0 ${
													isGroupActive
														? "text-confident-black"
														: "text-yellow-01"
												}`}
											/>
											{!collapsed && (
												<span className="truncate">{item.label}</span>
											)}
											{collapsed && (
												<span className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded-md border border-yellow-01/40 bg-confident-black px-3 py-1 text-xs text-yellow-01 opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100">
													{item.label}
												</span>
											)}
											{!collapsed && hasSubmenu && (
												<button
													onClick={(event: MouseEvent<HTMLButtonElement>) => {
														event.preventDefault();
														setTariffExpanded((prev) => !prev);
													}}
													className="ml-auto p-1 rounded-md flex-shrink-0"
													title={tariffExpanded ? "Collapse" : "Expand"}
												>
													<ChevronDown
														className={`w-4 h-4 transition-transform duration-200 ${
															tariffExpanded ? "-rotate-180" : "rotate-0"
														} ${
															isGroupActive
																? "text-confident-black"
																: "text-yellow-01"
														}`}
													/>
												</button>
											)}
										</Link>
									</div>
									{!collapsed && hasSubmenu && (
										<div
											className={`overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out ${
												showSubmenu
													? "max-h-40 opacity-100"
													: "max-h-0 opacity-0"
											}`}
										>
											<ul className="mt-1 space-y-1 pl-7">
												{item.subItems?.map((subItem) => {
													const SubIcon = subItem.icon;
													const isActive =
														!subItem.disabled &&
														(pathname === subItem.path ||
															pathname.startsWith(`${subItem.path}/`));

													return (
														<li key={subItem.path} title={subItem.label}>
															{subItem.disabled ? (
																<div className="flex items-center gap-2 px-2 py-1.5 text-yellow-01/50 cursor-not-allowed">
																	<span className="mt-[2px] h-1.5 w-1.5 rounded-full bg-yellow-01/50" />
																	<span className="truncate text-[13px] font-medium">
																		{subItem.label}
																	</span>
																</div>
															) : (
																<Link
																	href={subItem.path}
																	className={`flex items-center gap-2 px-2 py-1.5 rounded-md transition-all duration-200 ${
																		isActive
																			? "bg-yellow-01/10 text-yellow-01 font-semibold"
																			: "text-yellow-01/70 hover:text-yellow-01 hover:bg-white/5"
																	}`}
																>
																	<SubIcon className="w-4 h-4 flex-shrink-0 text-yellow-01" />
																	<span className="truncate text-[13px] font-medium">
																		{subItem.label}
																	</span>
																</Link>
															)}
														</li>
													);
												})}
											</ul>
										</div>
									)}
								</li>
							);
						})}
					</ul>
				</nav>

				{/* Footer */}
				<div className="p-4 border-t border-white">
					<BaseButton
						onClick={handleLogout}
						className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 text-red-600 hover:bg-red-50 cursor-pointer font-medium ${
							collapsed ? "justify-center group relative" : ""
						}`}
						title={collapsed ? "Log-out" : ""}
					>
						<LogOutIcon className="w-5 h-5 flex-shrink-0" />
						<span
							className={`whitespace-nowrap overflow-hidden transition-[opacity,transform,max-width] duration-300 ease-in-out origin-left ${
								collapsed
									? "opacity-0 -translate-x-2 max-w-0 pointer-events-none delay-0"
									: "opacity-100 translate-x-0 max-w-[120px] delay-75"
							}`}
							aria-hidden={collapsed}
						>
							Log-out
						</span>
					</BaseButton>
				</div>
			</aside>
		</div>
	);
}
