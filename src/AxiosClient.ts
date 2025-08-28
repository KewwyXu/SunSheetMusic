import axios from 'axios';

const isProduction = false;

const baseURL = isProduction ? '/api' : 'http://localhost:3000/api';

export const AxiosClient = axios.create({
   baseURL: baseURL, // 所有请求会自动在前面加上 /api
   timeout: 10000,
});
