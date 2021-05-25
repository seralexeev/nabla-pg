import axios from 'axios';

declare module 'axios' {
    interface AxiosRequestConfig {
        metricKey: string;
        metadata?: {
            startTime: number;
        };
    }
}
