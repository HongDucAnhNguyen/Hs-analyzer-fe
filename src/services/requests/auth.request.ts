import { login, logout } from "../api/auth";
import useAppMutation, { AppMutationOptions } from "../hooks/useAppMutation";

export const useLogin = (options?: AppMutationOptions) => {
	return useAppMutation(login, {
		useAppMutationProps: options
	});
};

export const useLogout = (options?: AppMutationOptions) => {
	return useAppMutation(logout, {
		useAppMutationProps: options
	});
};
