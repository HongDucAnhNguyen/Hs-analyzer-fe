import React, { useState } from "react";

import clsx from "clsx";

export interface TabItem {
	label: React.ReactNode | string;
	value: string;
	content: React.ReactNode;
}

interface TabsProps {
	tabs: TabItem[];
	defaultValue?: string;
	onChange?: (value: string) => void;
	className?: string;
	tabListClassName?: string;
	tabButtonClassName?: string;
	contentClassName?: string;
}

const Tabs: React.FC<TabsProps> = ({
	tabs,
	defaultValue,
	onChange,
	className,
	tabListClassName,
	tabButtonClassName,
	contentClassName
}) => {
	const [active, setActive] = useState(defaultValue || tabs[0]?.value);

	const handleTabClick = (value: string) => {
		setActive(value);
		onChange?.(value);
	};

	const activeTab = tabs.find((t) => t.value === active);

	return (
		<div className={clsx("w-full", className)}>
			{/* Tab Header */}
			<div
				className={clsx(
					"flex border-b border-off-white overflow-hidden",
					tabListClassName
				)}
			>
				{tabs.map((tab) => (
					<button
						key={tab.value}
						onClick={() => handleTabClick(tab.value)}
						className={clsx(
							"px-4 py-2 text-sm transition-colors whitespace-nowrap cursor-pointer font-semibold",
							"border-b-2 -mb-px",
							active === tab.value
								? "border-yellow-01 text-white"
								: "border-transparent text-gray-01 hover:text-white",
							tabButtonClassName
						)}
					>
						{tab.label}
					</button>
				))}
			</div>

			{/* Tab Content */}
			{tabs.map((tab) => (
				<div
					key={tab.value}
					hidden={tab.value !== activeTab?.value}
					className={clsx("mt-3", contentClassName)}
				>
					{tab?.content}
				</div>
			))}
		</div>
	);
};

export default Tabs;
