import { Stream, Writable } from "stream";
import { BinaryToTextEncoding } from "crypto";
import { Session } from "electron";

// main/net.ts
export interface NetOptions {
  /**
   * Request method
   * @default 'GET'
   */
  method?: string;
  /**
   * Request body
   * @default null
   */
  body?: string | null | Buffer | Stream;
  /**
   * Request headers
   */
  headers?: Record<string, string | string[]>;
  /**
   * Request query
   */
  query?: Record<string, string>;
  /**
   * Allow redirect
   * @default true
   */
  followRedirect?: boolean;
  /**
   * Maximum redirect count. 0 to not follow redirect
   * @default 20
   */
  maxRedirectCount?: number;
  /**
   * Request/Response timeout in ms. 0 to disable
   * @default 0
   */
  timeout?: number;
  /**
   * Maximum response body size in bytes. 0 to disable
   * @default 0
   */
  size?: number;

  // Docs: https://www.electronjs.org/docs/api/client-request#new-clientrequestoptions

  /**
   * Only in Electron. When use authenticated HTTP proxy, username to use to authenticate
   */
  username?: string;
  /**
   * Only in Electron. When use authenticated HTTP proxy, password to use to authenticate
   */
  password?: string;
  /**
   * Only in Electron. Whether to send cookies with this request from the provided session
   * @default true
   */
  useSessionCookies?: boolean;
  /**
   * Only in Electron. The Session instance with which the request is associated
   * @default electron.session.defaultSession
   */
  session?: Session;
}

export interface ProgressInfo {
  /** Total file bytes */
  total: number;
  /** Delta file bytes */
  delta: number;
  /** Transferred file bytes */
  transferred: number;
  /** Transferred percentage */
  percent: number;
  /** Bytes transferred per second */
  bytesPerSecond: number;
}

export type ProgressCallback = (progressInfo: ProgressInfo) => void;

export interface ValidateOptions {
  /** Expected hash */
  expected: string;
  /**
   * Algorithm: first parameter of crypto.createHash
   * @default 'md5'
   */
  algorithm?: string;
  /**
   * Encoding: first parameter of Hash.digest
   * @default 'base64'
   */
  encoding?: BinaryToTextEncoding;
}

export interface ResponseOptions {
  requestURL: string;
  statusCode: number;
  headers: NetHeaders;
  size: number;
}

export interface Response {
  /** Whether the response was successful (status in the range 200-299) */
  ok: boolean;
  /** Response headers */
  headers: Record<string, string | string[]>;
  /** Return origin stream */
  stream: Stream;
  /** Decode response as ArrayBuffer */
  arrayBuffer(): Promise<ArrayBuffer>;
  /** Decode response as Blob */
  blob(): Promise<Blob>;
  /** Decode response as text */
  text(encoding?: BufferEncoding): Promise<string>;
  /** Decode response as json */
  json<T>(encoding?: BufferEncoding): Promise<T>;
  /** Decode response as buffer */
  buffer(): Promise<Buffer>;
  /**
   * Download file to destination
   * @param {Writable} destination Writable destination stream
   * @param {ProgressCallback=} onProgress Download progress callback
   * @param {ValidateOptions=} validateOptions Validate options
   */
  download: (
    destination: Writable,
    onProgress?: ProgressCallback,
    validateOptions?: ValidateOptions,
  ) => Promise<void>;
}

export interface RequestClient {
  send(): Promise<Response>;
}

export interface DefaultOptions {
  method: string;
  body: string | null | Buffer | Stream;
  followRedirect: boolean;
  maxRedirectCount: number;
  timeout: number;
  size: number;
  useNative: boolean;
  useSessionCookies: boolean;
}

export interface RequestConstructorOptions extends NetOptions {
  requestURL: string;
}

export interface Blob {
  size: number;
  type: string;
  isClosed: boolean;
  content: Buffer;
  slice(start?: number, end?: number, type?: string): Blob;
  close(): void;
  toString(): string;
}

export type NetHeaders = Omit<Headers, "forEach"> & {
  raw: () => Record<string, string | string[]>;
};

export interface RequestOptions
  extends Omit<RequestConstructorOptions, keyof DefaultOptions>,
    DefaultOptions {
  parsedURL: URL;
}

export type FinallyRequestOptions = Omit<RequestOptions, "headers"> & {
  headers: NetHeaders;
};
