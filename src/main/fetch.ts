import { entrances, RequestOpt } from "../comm/fetch.inside";
import { session as sess, Session } from "electron";

export const request = <T>(
  url: string,
  param: RequestOpt & { session?: Session | string } = {},
) => {
  if (param.session) {
    if (typeof param.session === "string")
      return entrances<T>(sess.fromPartition(param.session).fetch, url, param);
    return entrances<T>(param.session.fetch, url, param);
  }
  return entrances<T>(sess.defaultSession.fetch, url, param);
};
