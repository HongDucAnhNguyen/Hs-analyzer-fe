import React, { forwardRef } from "react";

// Types
export interface Column<T = any> {
	key: string;
	title?: string | React.ReactNode;
	dataIndex?: string;
	render?: (value: any, record: T, index: number) => React.ReactNode;
	width?: string | number;
	align?: "left" | "center" | "right";
	className?: string;
}

interface BaseTableProps<T = any> {
	columns: Column<T>[];
	data: T[];
	loading?: boolean;
	emptyText?: string;
	rowKey?: string | ((record: T) => string);
	onRowClick?: (record: T, index: number) => void;
	className?: string;
	headerClassName?: string;
	rowClassName?: string | ((record: T, index: number) => string);
	striped?: boolean;
	bordered?: boolean;
	hoverable?: boolean;
}

export const BaseTable = forwardRef<HTMLTableElement, BaseTableProps>(
	(
		{
			columns,
			data,
			loading = false,
			emptyText = "Không có dữ liệu",
			rowKey = "id",
			onRowClick,
			className = "",
			headerClassName = "",
			rowClassName = "",
			striped = false,
			bordered = true,
			hoverable = false
		},
		ref
	) => {
		const getRowKey = (record: any, index: number): string => {
			if (typeof rowKey === "function") {
				return rowKey(record);
			}
			return record[rowKey] || index.toString();
		};

		const getRowClassName = (record: any, index: number): string => {
			let classes = "transition-colors";

			if (striped && index % 2 === 1) {
				classes += " bg-gray-50";
			}

			if (hoverable) {
				classes += " hover:bg-blue-50";
			}

			if (onRowClick) {
				classes += " cursor-pointer";
			}

			if (typeof rowClassName === "function") {
				classes += ` ${rowClassName(record, index)}`;
			} else if (rowClassName) {
				classes += ` ${rowClassName}`;
			}

			return classes;
		};

		const getCellValue = (column: Column, record: any) => {
			if (column.dataIndex) {
				return record[column.dataIndex];
			}
			return record[column.key];
		};

		const renderCell = (column: Column, record: any, index: number) => {
			if (column.render) {
				return column.render(getCellValue(column, record), record, index);
			}
			return getCellValue(column, record);
		};

		const getAlignClass = (align?: string) => {
			switch (align) {
				case "center":
					return "text-center";
				case "right":
					return "text-right";
				default:
					return "text-left";
			}
		};

		return (
			<div className="w-full overflow-x-auto">
				<table
					ref={ref}
					className={`w-full ${bordered ? "border border-off-white" : ""} ${className}`}
				>
					<thead className={`border-off-white ${headerClassName}`}>
						<tr>
							{columns.map((column) => (
								<th
									key={column.key}
									className={`px-4 py-3 font-semibold text-white ${bordered ? "border-b border-off-white" : ""} ${getAlignClass(column.align)} ${column.className || ""}`}
									style={{ width: column.width }}
								>
									{column.title}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{loading ? (
							<tr>
								<td
									colSpan={columns.length}
									className="px-4 py-8 text-center text-white"
								>
									<div className="flex items-center justify-center">
										<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-off-white"></div>
										<span className="ml-3">Loading...</span>
									</div>
								</td>
							</tr>
						) : data.length === 0 ? (
							<tr>
								<td
									colSpan={columns.length}
									className="px-4 py-8 text-center text-white"
								>
									{emptyText}
								</td>
							</tr>
						) : (
							data.map((record, index) => (
								<tr
									key={getRowKey(record, index)}
									className={getRowClassName(record, index)}
									onClick={() => onRowClick?.(record, index)}
								>
									{columns.map((column) => (
										<td
											key={column.key}
											className={`px-4 py-3 ${bordered ? "border-b border-off-white" : ""} ${column.className || ""}`}
											style={{ width: column.width }}
										>
											{renderCell(column, record, index)}
										</td>
									))}
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>
		);
	}
);

BaseTable.displayName = "BaseTable";
