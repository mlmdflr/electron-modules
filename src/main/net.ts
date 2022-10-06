import { URL } from "url";
import { Stream, PassThrough, pipeline as pump, Transform } from "node:stream";
import { net, session as ElectronSession } from "electron";
import { WriteStream } from "node:fs";
import { createHash } from "node:crypto";
import type { Writable, TransformCallback } from "node:stream";
import type {
  Blob,
  Response,
  RequestClient,
  ValidateOptions,
  ResponseOptions,
  ProgressCallback,
  FinallyRequestOptions,
  RequestConstructorOptions,
  NetOptions,
} from "../types";
import type { BinaryToTextEncoding, Hash } from "node:crypto";

const isRedirect = (code: number | undefined) => {
  if (typeof code !== "number") return false;
  return (
    code === 301 || code === 302 || code === 303 || code === 307 || code === 308
  );
};

class BlobImpl implements Blob {
  private buffer: Buffer;
  private closed: boolean;
  private privateType: string = "";

  constructor(blobParts?: BlobPart[], options?: BlobPropertyBag) {
    const buffers: Buffer[] = [];

    if (blobParts) {
      if (
        !blobParts ||
        typeof blobParts !== "object" ||
        blobParts instanceof Date ||
        blobParts instanceof RegExp
      ) {
        throw new TypeError(
          "Blob parts must be objects that are not Dates or RegExps"
        );
      }

      for (let i = 0, l = Number(blobParts.length); i < l; i += 1) {
        const part = blobParts[i];
        let buf: Buffer;

        if (part instanceof Buffer) {
          buf = part;
        } else if (part instanceof ArrayBuffer) {
          buf = Buffer.from(new Uint8Array(part));
        } else if (part instanceof BlobImpl) {
          buf = part.buffer;
        } else if (ArrayBuffer.isView(part)) {
          buf = Buffer.from(
            new Uint8Array(part.buffer, part.byteOffset, part.byteLength)
          );
        } else {
          buf = Buffer.from(typeof part === "string" ? part : String(part));
        }
        buffers.push(buf);
      }
    }

    this.buffer = Buffer.concat(buffers);
    this.closed = false;
    const type =
      options &&
      options.type !== undefined &&
      String(options.type).toLowerCase();

    if (type && !/[^\u0020-\u007E]/.test(type)) {
      this.privateType = type;
    }
  }

  public get size() {
    return this.buffer.length;
  }

  public get type() {
    return this.privateType;
  }

  public get content() {
    return this.buffer;
  }

  public get isClosed() {
    return this.closed;
  }

  public slice(start?: number, end?: number, type?: string) {
    const { size, buffer } = this;

    let relativeStart: number;
    let relativeEnd: number;
    if (start === void 0) {
      relativeStart = 0;
    } else if (start < 0) {
      relativeStart = Math.max(size + start, 0);
    } else {
      relativeStart = Math.min(start, size);
    }
    if (end === void 0) {
      relativeEnd = size;
    } else if (end < 0) {
      relativeEnd = Math.max(size + end, 0);
    } else {
      relativeEnd = Math.min(end, size);
    }
    const span = Math.max(relativeEnd - relativeStart, 0);
    const slicedBuffer = buffer.slice(relativeStart, relativeStart + span);
    const blob = new BlobImpl([], { type: type || this.type });
    blob.buffer = slicedBuffer;
    blob.closed = this.closed;
    return blob;
  }

  public close() {
    this.closed = true;
  }

  public toString() {
    return "[object Blob]";
  }
}

const newError = (message: string, code: string) => {
  const error = new Error(message);
  (error as NodeJS.ErrnoException).code = code;
  return error;
};

class DigestTransform extends Transform {
  private readonly digester: Hash;
  private _actual: string | null = null;
  readonly expected: string;
  private readonly algorithm: string;
  private readonly encoding: BinaryToTextEncoding;
  isValidateOnEnd = true;

  // noinspection JSUnusedGlobalSymbols
  get actual() {
    return this._actual;
  }

  constructor(options: ValidateOptions) {
    super();
    const { expected, algorithm = "md5", encoding = "base64" } = options;
    this.expected = expected;
    this.algorithm = algorithm;
    this.encoding = encoding;
    this.digester = createHash(algorithm);
  }

  // noinspection JSUnusedGlobalSymbols
  _transform(
    chunk: Buffer,
    encoding: BufferEncoding,
    callback: TransformCallback
  ) {
    this.digester.update(chunk);
    callback(null, chunk);
  }

  // noinspection JSUnusedGlobalSymbols
  _flush(callback: TransformCallback): void {
    this._actual = this.digester.digest(this.encoding);

    if (this.isValidateOnEnd) {
      try {
        this.validate();
      } catch (e) {
        callback(e as Error);
        return;
      }
    }

    callback(null);
  }

  validate() {
    if (this._actual == null) {
      throw newError("Not finished yet", "ERR_STREAM_NOT_FINISHED");
    }

    if (this._actual !== this.expected) {
      throw newError(
        `${this.algorithm} checksum mismatch, expected ${this.expected}, got ${this._actual}`,
        "ERR_CHECKSUM_MISMATCH"
      );
    }

    return null;
  }
}

class ProgressCallbackTransform extends Transform {
  private start = Date.now();
  private transferred = 0;
  private delta = 0;
  private readonly total: number;
  private readonly onProgress: ProgressCallback;

  private nextUpdate = this.start + 1000;

  constructor(total: number, onProgress: ProgressCallback) {
    super();
    this.total = total;
    this.onProgress = onProgress;
  }

  _transform(
    chunk: Buffer,
    encoding: BufferEncoding,
    callback: TransformCallback
  ) {
    const chunkLength = chunk.length;
    this.transferred += chunkLength;
    this.delta += chunkLength;

    if (this.total >= this.transferred) {
      const now = Date.now();
      if (now >= this.nextUpdate) {
        this.nextUpdate = now + 1000;
        this.onProgress({
          total: this.total,
          delta: this.delta,
          transferred: this.transferred,
          percent: (this.transferred / this.total) * 100,
          bytesPerSecond: Math.round(
            this.transferred / ((now - this.start) / 1000)
          ),
        });
        this.delta = 0;
      }
    }

    callback(null, chunk);
  }

  _flush(callback: TransformCallback): void {
    const { total, transferred } = this;
    const totalChunk = transferred > total ? transferred : total;

    this.onProgress({
      total: totalChunk,
      delta: this.delta,
      transferred: totalChunk,
      percent: 100,
      bytesPerSecond: Math.round(
        this.transferred / ((Date.now() - this.start) / 1000)
      ),
    });
    this.delta = 0;

    callback(null);
  }
}

class ResponseImpl implements Response {
  private disturbed: boolean;
  private body: Stream;
  private config: ResponseOptions;

  constructor(body: Stream, options: ResponseOptions) {
    this.body = body;
    this.config = options;
    this.disturbed = false;
  }

  private consumeResponse = (): Promise<Buffer> => {
    const { requestURL, size, headers } = this.config;

    if (this.disturbed) {
      return Promise.reject(
        new Error(`Response used already for: ${requestURL}`)
      );
    }

    this.disturbed = true;

    // body is null
    if (this.body === null) {
      return Promise.resolve(Buffer.alloc(0));
    }

    // body is string
    if (typeof this.body === "string") {
      return Promise.resolve(Buffer.from(this.body));
    }

    // body is blob
    if (this.body instanceof BlobImpl) {
      return Promise.resolve(this.body.content);
    }

    // body is buffer
    if (Buffer.isBuffer(this.body)) {
      return Promise.resolve(this.body);
    }

    if (!(this.body instanceof Stream)) {
      return Promise.resolve(Buffer.alloc(0));
    }

    // body is stream
    // get ready to actually consume the body
    const accum: Buffer[] = [];
    let accumBytes = 0;
    let abort = false;

    return new Promise((resolve, reject) => {
      // handle stream error, such as incorrect content-encoding
      this.body.on("error", (err) => {
        reject(
          new Error(
            `Invalid response body while trying to fetch ${requestURL}: ${err.message}`
          )
        );
      });

      this.body.on("data", (chunk: Buffer) => {
        if (abort || chunk === null) {
          return;
        }

        if (size && accumBytes + chunk.length > size) {
          abort = true;
          reject(
            new Error(`Content size at ${requestURL} over limit: ${size}`)
          );
          this.body.emit("cancel-request");
          return;
        }

        accumBytes += chunk.length;
        accum.push(chunk);
      });

      this.body.on("end", () => {
        if (abort) return;
        resolve(Buffer.concat(accum, accumBytes));
      });
    });
  };

  /**
   * Whether the response was successful (status in the range 200-299)
   */
  get ok(): boolean {
    const { statusCode } = this.config;
    return statusCode >= 200 && statusCode < 300;
  }

  get headers() {
    return this.config.headers.raw();
  }

  /**
   * Download file to destination
   * @param {WriteStream} fileOut  Download write stream
   * @param {ProgressCallback=} onProgress Download progress callback
   */
  public download = async (
    fileOut: Writable,
    onProgress?: ProgressCallback,
    validateOptions?: ValidateOptions
  ): Promise<void> => {
    const feedStreams: Writable[] = [];

    if (typeof onProgress === "function") {
      const contentLength = Number(this.config.headers.get("content-length"));
      feedStreams.push(
        new ProgressCallbackTransform(contentLength, onProgress)
      );
    }

    if (validateOptions) {
      feedStreams.push(new DigestTransform(validateOptions));
    }

    feedStreams.push(fileOut);

    return new Promise((resolve, reject) => {
      let lastStream = this.stream;
      for (const stream of feedStreams) {
        stream.on("error", (error: Error) => {
          reject(error);
        });
        lastStream = lastStream.pipe(stream);
      }

      fileOut.once("finish", () => {
        if (
          fileOut instanceof WriteStream &&
          typeof fileOut.close === "function"
        ) {
          fileOut.close();
        }
        resolve();
      });
    });
  };

  /**
   * Return origin stream
   */
  get stream(): Stream {
    if (this.disturbed) {
      throw new Error(`Response used already for: ${this.config.requestURL}`);
    }
    return this.body;
  }

  /**
   * Decode response as ArrayBuffer
   */
  arrayBuffer = async (): Promise<ArrayBuffer> => {
    const buf = await this.consumeResponse();
    return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  };

  /**
   * Decode response as Blob
   */
  blob = async (): Promise<BlobImpl> => {
    const contentType = this.config.headers.get("content-Type") || "";
    const buffer = await this.consumeResponse();
    const blob = new BlobImpl([buffer], {
      type: contentType.toLowerCase(),
    });
    return blob;
  };

  /**
   * Decode response as text
   */
  text = async (encoding?: BufferEncoding): Promise<string> => {
    const buffer = await this.consumeResponse();
    return buffer.toString(encoding);
  };

  /**
   * Decode response as json
   */
  json = async <T>(encoding?: BufferEncoding): Promise<T> => {
    const buffer = await this.consumeResponse();
    const text = buffer.toString(encoding);
    try {
      return JSON.parse(text);
    } catch {
      throw new Error(text);
    }
  };

  /**
   * Decode response as buffer
   */
  buffer = (): Promise<Buffer> => {
    return this.consumeResponse();
  };
}

const isValidTokenChar = (ch: number) => {
  if (ch >= 94 && ch <= 122) {
    return true;
  }
  if (ch >= 65 && ch <= 90) {
    return true;
  }
  if (ch === 45) {
    return true;
  }
  if (ch >= 48 && ch <= 57) {
    return true;
  }
  if (ch === 34 || ch === 40 || ch === 41 || ch === 44) {
    return false;
  }
  if (ch >= 33 && ch <= 46) {
    return true;
  }
  if (ch === 124 || ch === 126) {
    return true;
  }
  return false;
};

const checkIsHttpToken = (val: unknown) => {
  if (typeof val !== "string" || val.length === 0) {
    return false;
  }
  if (!isValidTokenChar(val.charCodeAt(0))) {
    return false;
  }
  const len = val.length;
  if (len > 1) {
    if (!isValidTokenChar(val.charCodeAt(1))) {
      return false;
    }
    if (len > 2) {
      if (!isValidTokenChar(val.charCodeAt(2))) {
        return false;
      }
      if (len > 3) {
        if (!isValidTokenChar(val.charCodeAt(3))) {
          return false;
        }
        for (let i = 4; i < len; i += 1) {
          if (!isValidTokenChar(val.charCodeAt(i))) {
            return false;
          }
        }
      }
    }
  }
  return true;
};

const checkInvalidHeaderChar = (val: string) => {
  if (val.length < 1) {
    return false;
  }
  let c = val.charCodeAt(0);
  if ((c <= 31 && c !== 9) || c > 255 || c === 127) {
    return true;
  }
  if (val.length < 2) {
    return false;
  }
  c = val.charCodeAt(1);
  if ((c <= 31 && c !== 9) || c > 255 || c === 127) {
    return true;
  }
  if (val.length < 3) {
    return false;
  }
  c = val.charCodeAt(2);
  if ((c <= 31 && c !== 9) || c > 255 || c === 127) {
    return true;
  }
  for (let i = 3; i < val.length; i += 1) {
    c = val.charCodeAt(i);
    if ((c <= 31 && c !== 9) || c > 255 || c === 127) {
      return true;
    }
  }
  return false;
};

const sanitizeKey = (name: string) => {
  if (!checkIsHttpToken(name)) {
    throw new TypeError(`${name} is not a legal HTTP header name`);
  }
  return name.toLowerCase();
};

const sanitizeValue = (value: string) => {
  if (checkInvalidHeaderChar(value)) {
    throw new TypeError(`${value} is not a legal HTTP header value`);
  }
  return value;
};

class HeadersImpl {
  private map: Map<string, string | string[]> = new Map();

  constructor(init: Record<string, string | string[] | undefined> = {}) {
    for (const [key, value] of Object.entries(init)) {
      if (value) {
        this.set(key, value);
      }
    }
  }

  public raw = () => {
    const result: Record<string, string | string[]> = {};
    for (const [key, value] of this.map.entries()) {
      result[key] = value;
    }
    return result;
  };

  public append = (key: string, value: string) => {
    const prev = this.get(key);
    if (!prev) {
      this.set(key, value);
    } else {
      this.set(key, Array.isArray(prev) ? [...prev, value] : [prev, value]);
    }
  };

  public get = (key: string) => {
    const value = this.map.get(sanitizeKey(key));
    if (typeof value === "string") {
      return value;
    }
    if (Array.isArray(value)) {
      return value.join(",");
    }
    return null;
  };

  public has = (key: string) => this.map.has(sanitizeKey(key));

  public set = (key: string, value: string | string[]) => {
    const data = Array.isArray(value)
      ? value.map(sanitizeValue)
      : sanitizeValue(value);
    this.map.set(sanitizeKey(key), data);
  };

  public delete = (key: string) => {
    this.map.delete(sanitizeKey(key));
  };
}

const extractContentType = (body: unknown): string | null => {
  if (typeof body === "string") {
    return "text/plain;charset=UTF-8";
  }
  return null;
};

const getRequestOptions = (
  constructorOptions: RequestConstructorOptions
): FinallyRequestOptions => {
  const options = {
    method: "GET",
    body: null,
    followRedirect: true,
    maxRedirectCount: 20,
    timeout: 1000 * 60,
    size: 0,
    useSessionCookies: true,
    useNative: false,
    ...constructorOptions,
  };

  const method = options.method.toUpperCase();
  const { body, requestURL, query, headers: headerOptions } = options;

  if (body !== null && (method === "GET" || method === "HEAD"))
    throw new TypeError("Request with GET/HEAD method cannot have body");
  const parsedURL = new URL(requestURL);
  if (!parsedURL.protocol || !parsedURL.hostname)
    throw new TypeError("Only absolute URLs are supported");
  if (!/^https?:$/.test(parsedURL.protocol))
    throw new TypeError("Only HTTP(S) protocols are supported");
  if (query)
    for (const [queryKey, queryValue] of Object.entries(query))
      parsedURL.searchParams.append(queryKey, queryValue);
  const headers = new HeadersImpl(headerOptions);
  // User cannot set content-length themself as per fetch spec
  headers.delete("content-length");
  // Add compression header
  headers.set("accept-encoding", ["gzip", "deflate", "br"].join(","));
  // Add accept header
  if (!headers.has("accept")) {
    headers.set("accept", "*/*");
  }
  // Add connection header
  if (!headers.has("connection")) {
    headers.set("connection", "close");
  }
  // Add content type header
  if (body && !headers.has("content-Type")) {
    const contentType = extractContentType(body);
    if (contentType) {
      headers.append("content-Type", contentType);
    }
  }

  return {
    ...options,
    method,
    parsedURL,
    headers,
  };
};

class ElectronRequestClient implements RequestClient {
  private options: FinallyRequestOptions;
  private redirectCount: number = 0;
  private timeoutId: NodeJS.Timeout | null = null;

  constructor(options: FinallyRequestOptions) {
    this.options = options;
  }

  private clearRequestTimeout = () => {
    if (this.timeoutId === null) return;
    clearTimeout(this.timeoutId);
    this.timeoutId = null;
  };

  private createRequest = async () => {
    const {
      requestURL,
      parsedURL: { protocol, host, hostname, port, pathname, origin, search },
      method,
      session,
      useSessionCookies,
      headers,
    } = this.options;

    const options = {
      method,
      url: `${requestURL}`,
      path: `${pathname}${search || ""}`,
      session: session || ElectronSession.defaultSession,
      useSessionCookies,
      protocol,
      host,
      hostname,
      origin,
      port: Number(port),
    };
    // console.log('options: ', options);
    const clientRequest = net.request(options);

    for (const [key, value] of Object.entries(headers.raw())) {
      if (Array.isArray(value)) {
        for (const v of value) {
          clientRequest.setHeader(key, v);
        }
      } else {
        clientRequest.setHeader(key, value);
      }
    }

    return clientRequest;
  };

  public send = async () => {
    const {
      method,
      followRedirect,
      maxRedirectCount,
      requestURL,
      parsedURL,
      size,
      username,
      password,
      timeout,
      body: requestBody,
    } = this.options;

    /** Create electron request */
    const clientRequest = await this.createRequest();
    /** Cancel electron request */
    const cancelRequest = () => {
      // In electron, `request.destroy()` does not send abort to server
      clientRequest.abort();
    };
    /** Write body to electron request */
    const writeToRequest = () => {
      if (requestBody === null) {
        clientRequest.end();
      } else if (requestBody instanceof Stream) {
        // TODO remove as
        requestBody
          .pipe(new PassThrough())
          .pipe(clientRequest as unknown as Writable);
      } else {
        clientRequest.write(requestBody);
        clientRequest.end();
      }
    };
    /** Bind electron request event */
    const bindRequestEvent = (
      onFulfilled: (value: Response | PromiseLike<Response>) => void,
      onRejected: (reason: Error) => void
    ) => {
      /** Set electron request timeout */
      if (timeout) {
        this.timeoutId = setTimeout(() => {
          onRejected(new Error(`Electron request timeout in ${timeout} ms`));
        }, timeout);
      }

      /** Bind electron request error event */
      clientRequest.on("error", onRejected);

      /** Bind electron request abort event */
      clientRequest.on("abort", () => {
        onRejected(new Error("Electron request was aborted by the server"));
      });

      /** Bind electron request login event */
      clientRequest.on("login", (authInfo, callback) => {
        if (username && password) {
          callback(username, password);
        } else {
          onRejected(
            new Error(
              `Login event received from ${authInfo.host} but no credentials provided`
            )
          );
        }
      });

      /** Bind electron request response event */
      clientRequest.on("response", (res) => {
        this.clearRequestTimeout();

        const { statusCode = 200, headers: responseHeaders } = res;
        const headers = new HeadersImpl(responseHeaders);
        if (isRedirect(statusCode) && followRedirect) {
          if (maxRedirectCount && this.redirectCount >= maxRedirectCount) {
            onRejected(new Error(`Maximum redirect reached at: ${requestURL}`));
          }

          if (!headers.get("location")) {
            onRejected(
              new Error(`Redirect location header missing at: ${requestURL}`)
            );
          }

          if (
            statusCode === 303 ||
            ((statusCode === 301 || statusCode === 302) && method === "POST")
          ) {
            this.options.method = "GET";
            this.options.body = null;
            this.options.headers.delete("content-length");
          }

          this.redirectCount += 1;
          this.options.parsedURL = new URL(
            String(headers.get("location")),
            parsedURL.toString()
          );
          onFulfilled(this.send());
        }

        const responseBody = pump(res as any, new PassThrough(), (error) => {
          if (error !== null) {
            onRejected(error);
          }
        });

        responseBody.on("cancel-request", cancelRequest);

        onFulfilled(
          new ResponseImpl(responseBody, {
            requestURL,
            statusCode,
            headers,
            size,
          })
        );
      });
    };

    return new Promise<Response>((resolve, reject) => {
      const onRejected = (reason: Error) => {
        this.clearRequestTimeout();
        cancelRequest();
        reject(reason);
      };
      bindRequestEvent(resolve, onRejected);
      writeToRequest();
    });
  };
}

class Request {
  private client: RequestClient;
  constructor(constructorOptions: RequestConstructorOptions) {
    const options = getRequestOptions(constructorOptions);
    this.client = new ElectronRequestClient(options);
  }
  public send = () => this.client.send();
}

export const request = (
  requestURL: string,
  options: NetOptions = {}
): Promise<Response> => {
  const request = new Request({ requestURL, ...options });
  return request.send();
};
