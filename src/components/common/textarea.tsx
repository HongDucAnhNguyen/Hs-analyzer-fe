import React, { forwardRef, TextareaHTMLAttributes } from "react";
import { Control, Controller } from "react-hook-form";

import cn from "clsx";

import { BaseErrorMessage } from "./error";

interface BaseTextareaProps
	extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "ref"> {
	inputClassName?: string;
	resize?: boolean;
}
interface BaseFormTextareaProps extends BaseTextareaProps {
	name: string;
	control: Control<any>;
}

export const BaseTextarea = forwardRef<HTMLTextAreaElement, BaseTextareaProps>(
	({ className, resize = false, inputClassName, ...rest }, ref) => {
		return (
			<div className={className}>
				<textarea
					ref={ref}
					className={cn(
						"w-full px-4 py-2 border rounded-lg outline-none transition-all border-off-white text-white placeholder:text-gray-01",
						"[&::-webkit-resizer]:border-8 [&::-webkit-resizer]:border-solid [&::-webkit-resizer]:border-yellow-01 [&::-webkit-resizer]:border-t-transparent [&::-webkit-resizer]:border-l-transparent [&::-webkit-resizer]:rounded-br-lg",
						inputClassName,
						{ "resize-none": !resize }
					)}
					{...rest}
				/>
			</div>
		);
	}
);

export const BaseFormTextarea = ({
	name,
	control,
	inputClassName,
	...rest
}: BaseFormTextareaProps) => {
	return (
		<Controller
			name={name}
			control={control}
			render={({ field, fieldState }) => (
				<>
					<BaseTextarea
						{...rest}
						{...field}
						inputClassName={cn(
							inputClassName,
							fieldState.invalid ? "!border-red-500" : ""
						)}
					/>
					<BaseErrorMessage message={fieldState.error?.message} />
				</>
			)}
		/>
	);
};

BaseTextarea.displayName = "BaseTextarea";
