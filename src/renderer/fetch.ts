import { entrances, RequestOpt } from "../comm/fetch.inside";

export const request = <T>(url: string, param: RequestOpt = {}) =>
  entrances<T>(fetch, url, param);
