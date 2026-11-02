export type IBodyLogin = {
	username: string;
	password: string;
};

export type IResponseLogin = {
	access_token: string;
	refresh_token: string;
	token_type: string;
	expires_in: number;
};
