import { ChangeEvent, forwardRef, InputHTMLAttributes, useEffect } from "react";
import {
	Control,
	Controller,
	ControllerRenderProps,
	UseFormClearErrors
} from "react-hook-form";

import cn from "clsx";
import { UploadIcon } from "lucide-react";

import { BaseErrorMessage } from "./error";

interface BaseInputProps
	extends Omit<InputHTMLAttributes<HTMLInputElement>, "ref"> {
	inputClassName?: string;
	startAdornment?: React.ReactNode;
	endAdornment?: React.ReactNode;
}

interface BaseFormInputProps extends Omit<BaseInputProps, "onChange"> {
	name: string;
	className?: string;
	control: Control<any>;
	imageUrl?: string;
	onChange?: (
		e: ChangeEvent<HTMLInputElement>,
		field?: ControllerRenderProps<any, string>
	) => void;
	handleImageUpload?: (e: ChangeEvent<HTMLInputElement>) => void;
	clearErrors?: UseFormClearErrors<any>;
}

export const BaseInput = forwardRef<HTMLInputElement, BaseInputProps>(
	(
		{ className, inputClassName, startAdornment, endAdornment, ...rest },
		ref
	) => {
		useEffect(() => {
			const handleFocus = (e: any) => {
				if (e.target.type === "number") {
					e.target.addEventListener("wheel", disableScroll);
				}
			};

			const handleBlur = (e: any) => {
				if (e.target.type === "number") {
					e.target.removeEventListener("wheel", disableScroll);
				}
			};

			const disableScroll = (e: any) => {
				e.preventDefault();
			};

			document.addEventListener("focus", handleFocus, true);
			document.addEventListener("blur", handleBlur, true);

			return () => {
				document.removeEventListener("focus", handleFocus, true);
				document.removeEventListener("blur", handleBlur, true);
			};
		}, []);
		return (
			<div className={cn(className, "relative")}>
				{/* startAdornment */}
				<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
					{startAdornment}
				</div>
				{/* endAdornment */}
				<div className="absolute inset-y-0 right-0 pr-3 flex items-center">
					{endAdornment}
				</div>
				<input
					ref={ref}
					className={cn(
						"w-full px-4 py-2 border rounded-lg outline-none transition-all border-off-white text-white placeholder:text-gray-01",
						inputClassName,
						startAdornment && "pl-10",
						endAdornment && "pr-12"
					)}
					{...rest}
				/>
			</div>
		);
	}
);

export const BaseFormInput = ({
	name,
	control,
	className,
	inputClassName,
	onChange,
	...rest
}: BaseFormInputProps) => {
	useEffect(() => {
		const handleFocus = (e: any) => {
			if (e.target.type === "number") {
				e.target.addEventListener("wheel", disableScroll);
			}
		};

		const handleBlur = (e: any) => {
			if (e.target.type === "number") {
				e.target.removeEventListener("wheel", disableScroll);
			}
		};

		const disableScroll = (e: any) => {
			e.preventDefault();
		};

		document.addEventListener("focus", handleFocus, true);
		document.addEventListener("blur", handleBlur, true);

		return () => {
			document.removeEventListener("focus", handleFocus, true);
			document.removeEventListener("blur", handleBlur, true);
		};
	}, []);
	return (
		<Controller
			name={name}
			control={control}
			render={({ field, fieldState }) => (
				<>
					<BaseInput
						{...rest}
						{...field}
						className={className}
						inputClassName={cn(
							inputClassName,
							fieldState.invalid ? "!border-red-500" : ""
						)}
						onChange={(e) => {
							field.onChange(e);
							onChange && onChange(e, field);
						}}
					/>
					<BaseErrorMessage message={fieldState.error?.message} />
				</>
			)}
		/>
	);
};

BaseInput.displayName = "BaseInput";

export const BaseFormInputImage = ({
	name,
	control,
	imageUrl,
	handleImageUpload,
	clearErrors
}: BaseFormInputProps) => {
	return (
		<Controller
			name={name}
			control={control}
			render={({ field, fieldState }) => (
				<>
					<div className="flex flex-col items-center">
						{imageUrl ? (
							<label htmlFor="iconUpload">
								<img
									src={imageUrl}
									alt=""
									className="w-96 h-auto object-cover aspect-square cursor-pointer"
								/>
							</label>
						) : (
							<label
								htmlFor="iconUpload"
								className={`${
									fieldState.error?.message
										? "border-red-500 !bg-red-500/10"
										: "border-yellow-01 "
								}  border-[1px] border-dashed w-full h-[60px] cursor-pointer text-off-black bg-yellow-01/10 rounded-[8px] transition duration-300 ease-in-out flex justify-center items-center`}
							>
								<span className="w-8 h-8 rounded-full bg-yellow-01 flex items-center justify-center">
									<UploadIcon className="w-5 h-5" strokeWidth={2} />
								</span>
								<div className="ml-3 text-sm font-semibold leading-snug text-yellow-01">
									Please choose an image.
								</div>
							</label>
						)}
						<BaseInput
							type="file"
							id="iconUpload"
							className="hidden"
							accept="image/*"
							onChange={handleImageUpload}
							onClick={() => clearErrors && clearErrors(name)}
						/>
					</div>
					<BaseErrorMessage message={fieldState.error?.message} />
				</>
			)}
		/>
	);
};
