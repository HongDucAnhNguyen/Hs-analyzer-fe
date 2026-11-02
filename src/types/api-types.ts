import { AxiosResponse } from "axios";

export type PaginationParams = {
  page?: number;
  size?: number;
  order?: 'asc' | 'desc';
  };
  
  export type MetaData = {
  total?: number;
  page?: number;
  size?: number;
  total_pages?: number;
  };
  
  export type ResponseData<T> = MetaData & {
  data: T;
  success: boolean;
  message?: string;
  };
  
  export type ResponseDataError = {
  detail: [
    {
    loc: Array<string | number>;
    msg: string;
    type: string;
    }
  ];
  page: number;
  size: number;
  total: number;
  total_pages: number;
  };
  
  export type PaginationResponse = {
  page: number;
  size: number;
  total: number;
  total_pages: number;
  };
  
  export interface ResponseDataList<T> extends PaginationResponse {
  data: T[];
  }
  
  export type APIError = {
  code: string;
  message: string;
  };
  
  export type BusinessError = {
  detail: {
    key: string;
    message: string;
  };
  };
  
  export type ValidationError = {
  detail: {
    [key: string]: {
    field: string;
    key: string;
    message: string;
    };
  };
  };
  
  export type ApiError = AxiosResponse<BusinessError | ValidationError>;
  
  export type ToastType = 'success' | 'warning' | 'error' | 'info';
  
  export type ResponseDataUpdate = {
  success: boolean;
  message: string;
  meta?: string | null;
  data?: string | null;
  };