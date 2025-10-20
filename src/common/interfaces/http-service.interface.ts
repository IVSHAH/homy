import { AxiosInstance, AxiosRequestConfig } from 'axios';

export interface IHttpService {
  instance(config: AxiosRequestConfig): AxiosInstance;
}
