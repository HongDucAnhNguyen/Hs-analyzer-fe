"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";

import { cookieStorageHelper } from "@/helpers/store-helper";
import { yupResolver } from "@hookform/resolvers/yup";
import { Eye, EyeOff, LoaderIcon, Lock, LogIn, Mail } from "lucide-react";

import { IBodyLogin } from "@/types/requests/auth";

import { loginSchema } from "@/schemas";
import { useLogin } from "@/services/requests/auth.request";

import { BaseButton } from "@/components/common/button";
import { BaseFormInput } from "@/components/common/input";
import { BaseLabel } from "@/components/common/label";

export default function LoginPage() {
	const router = useRouter();

	const [showPassword, setShowPassword] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const { control, handleSubmit, setError, getValues } = useForm({
		resolver: yupResolver(loginSchema),
		defaultValues: {
			username: "",
			password: ""
		}
	});

	const { mutate } = useLogin({ setError, getValues });

	const onSubmit = (inputs: IBodyLogin) => {
		if (isLoading) {
			return;
		}

		setIsLoading(true);

		mutate(inputs, {
			onSuccess: (res) => {
				cookieStorageHelper.set("access_token", res.access_token);
				setIsLoading(false);
				router.push("/e-tariff-classification/manual-input");
			},
			onError: (error) => {
				setIsLoading(false);
			}
		});
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-confident-black p-4">
			<div className="w-full max-w-md">
				{/* Card */}
				<div className="bg-off-black rounded-2xl shadow-xl p-8 space-y-6">
					{/* Header */}
					<div className="text-center space-y-2">
						<div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-01/10 rounded-full mb-2">
							<LogIn className="w-8 h-8 text-yellow-01" />
						</div>
						<h1 className="text-3xl font-bold text-white">Log-in</h1>
						<p className="text-white">Welcome back !</p>
					</div>

					<form onSubmit={handleSubmit(onSubmit)} autoComplete="off">
						<div className="grid gap-8 mb-10">
							<div>
								<BaseLabel required>Username</BaseLabel>
								<BaseFormInput
									name="username"
									control={control}
									placeholder="Enter Username"
									autoComplete="new-username"
									startAdornment={<Mail className="h-5 w-5 text-yellow-01" />}
								/>
							</div>

							<div>
								<BaseLabel required>Password</BaseLabel>
								<BaseFormInput
									name="password"
									control={control}
									placeholder="Enter Password"
									autoComplete="new-password"
									type={showPassword ? "text" : "password"}
									startAdornment={<Lock className="h-5 w-5 text-yellow-01" />}
									endAdornment={
										<BaseButton
											type="button"
											onClick={() => setShowPassword(!showPassword)}
											className="absolute inset-y-0 right-0 pr-3 flex items-center"
										>
											{showPassword ? (
												<Eye className="h-5 w-5 text-yellow-01 cursor-pointer" />
											) : (
												<EyeOff className="h-5 w-5 text-yellow-01 cursor-pointer" />
											)}
										</BaseButton>
									}
								/>
							</div>
						</div>

						{/* Submit Button */}
						<div className="w-full">
							<BaseButton
								type="submit"
								className="flex justify-center items-center w-full gap-2 px-6 py-3 bg-yellow-01 text-confident-black rounded-lg transition-colors font-semibold text-xl shadow-sm"
								disabled={isLoading}
							>
								{isLoading ? (
									<LoaderIcon className="animate-spin-slow" size={20} />
								) : (
									""
								)}
								Log-in
							</BaseButton>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
}
