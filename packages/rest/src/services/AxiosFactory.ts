import { InternalError } from '@flstk/rest/errors';
import { AppLogger } from '@flstk/rest/logger';
import { pick } from '@flstk/utils';
import Axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { Histogram } from 'prom-client';
import { singleton } from 'tsyringe';

@singleton()
export class AxiosClientFactory {
    public constructor(private logger: AppLogger) {}
    
    public create = (name: string, defaultConfig?: Partial<AxiosRequestConfig>) => {
        return new AxiosClient(name, this.logger, defaultConfig);
    };
}

export class AxiosClient {
    private static counter = new Histogram({
        name: 'api_axios_duration',
        help: 'Axios request duration',
        labelNames: ['name', 'status', 'path', 'method', 'success'],
        buckets: [1, 5, 15, 50, 100, 500, 1000, 3000],
    });

    private axios;

    public constructor(private name: string, private logger: AppLogger, defaultConfig?: Partial<AxiosRequestConfig>) {
        this.axios = Axios.create(defaultConfig as any);
        this.axios.interceptors.request.use(this.onRequest);
        this.axios.interceptors.response.use(this.onFulfilled, this.onRejected);
    }

    public request = <T>(config: AxiosRequestConfig): Promise<T> => {
        return this.axios.request<T>(config).then((x) => x.data);
    };

    public raw = <T>(config: AxiosRequestConfig) => this.axios.request<T>(config);

    private onRequest = (config: AxiosRequestConfig) => {
        config.metadata = { startTime: new Date().getTime() };
        return config;
    };

    private onFulfilled = (res: AxiosResponse) => {
        const duration = new Date().getTime() - (res.config.metadata?.startTime ?? 0);
        const labels = this.getLabels(true, res.config, res.status);
        AxiosClient.counter.observe(labels, duration);
        this.logger.info({ ...labels, url: res.config.url }, 'Axios request succeeded');

        return res;
    };

    private onRejected = (error: any) => {
        const config: AxiosRequestConfig = 'isAxiosError' in error ? error.config : {};
        const duration = new Date().getTime() - (config?.metadata?.startTime ?? 0);
        const labels = this.getLabels(false, config, error.response?.status);
        AxiosClient.counter.observe(labels, duration);

        let response: any = undefined;
        if (error.response) {
            response = pick(error.response, ['status', 'statusText', 'headers', 'data']);
        }

        let request: any = undefined;
        if (error.request) {
            request = pick(error.request, ['method', 'path', 'headers', 'data']);
        }

        throw new InternalError('Axios error', {
            error: pick(error, ['name', 'message', 'stack']),
            internal: { response, request },
        });
    };

    private getLabels = (success: boolean, config: AxiosRequestConfig, status: number = 0) => {
        return {
            name: this.name,
            success: String(success),
            method: config.method,
            path: config.metricKey ?? config.url,
            status: status ?? 0,
        };
    };
}
