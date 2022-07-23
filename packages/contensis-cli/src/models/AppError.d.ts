type AppError = (Error & ApiErrorResponse) | ApiErrorResponse;

type InnerDataArray = [
  {
    field: string;
    message: string;
  }
];

type ApiErrorResponse = {
  name?: string;
  error?: { code: string; message: string };
  code?: string;
  type?: string;
  timeout?: number;
  status?: number;
  statusText?: string;
  url?: string;
  data?:
    | {
        logId: string;
        message: string;
        data: InnerDataArray;
        type: string;
      }
    | any;
};

type MappedError = {
  status: number;
  statusText?: string;
  url?: string;
  message: string;
  name?: string;
  code?: string;
  type?: string;
  logId?: string;
  data?: InnerDataArray | any;
  stack?: string;
};
