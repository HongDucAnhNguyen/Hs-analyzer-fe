import { IBodyLogin, IResponseLogin } from "@/types/requests/auth";

import { request } from "../axios";

export const login = (body: IBodyLogin) =>
	request.post<IBodyLogin, IResponseLogin>("/auth/login", body);

export const logout = () => request.post<any, any>("/auth/logout");
