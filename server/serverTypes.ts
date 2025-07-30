export interface HealthResponse {
  status: string;
  message: string;
  timestamp: string;
  version: string;
  uptime: number;
}

export interface StatusResponse {
  message: string;
  environment: string;
  port: string;
  timestamp: string;
  apiVersion: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  timestamp: string;
}

export interface ErrorResponse {
  error: string;
  message: string;
  timestamp: string;
  stack?: string;
}