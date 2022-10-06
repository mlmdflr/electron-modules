import {
  ArrayIsArray,
  ArrayPrototypeIncludes,
  ArrayPrototypeJoin,
  ArrayPrototypeMap,
  ArrayBufferIsView,
  NumberIsInteger,
  NumberIsNaN,
  NumberMAX_SAFE_INTEGER,
  NumberMIN_SAFE_INTEGER,
  NumberParseInt,
  ObjectPrototypeHasOwnProperty,
  RegExpPrototypeExec,
  StringPrototypeTrim,
} from "./global.primordials.inside";

import {
  hideStackFrames,
  ERR_INVALID_ARG_VALUE,
  ERR_INVALID_ARG_TYPE,
  ERR_OUT_OF_RANGE,
} from "./internal.errors.inside";

import { normalizeEncoding } from "./internal.util.inside";

function isInt32(value: number) {
  return value === (value | 0);
}

function isUint32(value: number) {
  return value === value >>> 0;
}

const octalReg = /^[0-7]+$/;
const modeDesc = "must be a 32-bit unsigned integer or an octal string";

/**
 * Parse and validate values that will be converted into mode_t (the S_*
 * constants). Only valid numbers and octal strings are allowed. They could be
 * converted to 32-bit unsigned integers or non-negative signed integers in the
 * C++ land, but any value higher than 0o777 will result in platform-specific
 * behaviors.
 *
 * @param {*} value Values to be validated
 * @param {string} name Name of the argument
 * @param {number} [def] If specified, will be returned for invalid values
 * @returns {number}
 */
function parseFileMode(value: any, name: string, def: number): number {
  value ??= def;
  if (typeof value === "string") {
    if (RegExpPrototypeExec(octalReg, value) === null) {
      throw ERR_INVALID_ARG_VALUE(name, value, modeDesc);
    }
    value = NumberParseInt(value, 8);
  }

  validateUint32(value, name);
  return value;
}

const validateInteger = hideStackFrames(
  (
    value: unknown,
    name: string,
    min = NumberMIN_SAFE_INTEGER,
    max = NumberMAX_SAFE_INTEGER
  ) => {
    if (typeof value !== "number")
      throw ERR_INVALID_ARG_TYPE(name, "number", value);
    if (!NumberIsInteger(value))
      throw ERR_OUT_OF_RANGE(name, "an integer", value);
    if (value < min || value > max)
      throw ERR_OUT_OF_RANGE(name, `>= ${min} && <= ${max}`, value);
  }
);

const validateInt32 = hideStackFrames(
  (value: unknown, name: string, min = -2147483648, max = 2147483647) => {
    // The defaults for min and max correspond to the limits of 32-bit integers.
    if (typeof value !== "number") {
      throw ERR_INVALID_ARG_TYPE(name, "number", value);
    }
    if (!NumberIsInteger(value)) {
      throw ERR_OUT_OF_RANGE(name, "an integer", value);
    }
    if (value < min || value > max) {
      throw ERR_OUT_OF_RANGE(name, `>= ${min} && <= ${max}`, value);
    }
  }
);

const validateUint32 = hideStackFrames(
  (value: unknown, name: string, positive: boolean) => {
    if (typeof value !== "number") {
      throw ERR_INVALID_ARG_TYPE(name, "number", value);
    }
    if (!NumberIsInteger(value)) {
      throw ERR_OUT_OF_RANGE(name, "an integer", value);
    }
    const min = positive ? 1 : 0;
    // 2 ** 32 === 4294967296
    const max = 4_294_967_295;
    if (value < min || value > max) {
      throw ERR_OUT_OF_RANGE(name, `>= ${min} && <= ${max}`, value);
    }
  }
);

function validateString(value: unknown, name: string) {
  if (typeof value !== "string")
    throw ERR_INVALID_ARG_TYPE(name, "string", value);
}

function validateNumber(
  value: unknown,
  name: string,
  min?: number,
  max?: number
) {
  if (typeof value !== "number")
    throw ERR_INVALID_ARG_TYPE(name, "number", value);

  if (
    (min != null && value < min) ||
    (max != null && value > max) ||
    ((min != null || max != null) && NumberIsNaN(value))
  ) {
    throw ERR_OUT_OF_RANGE(
      name,
      `${min != null ? `>= ${min}` : ""}${
        min != null && max != null ? " && " : ""
      }${max != null ? `<= ${max}` : ""}`,
      value
    );
  }
}
const validateOneOf = hideStackFrames(
  (value: unknown, name: string, oneOf: unknown[]) => {
    if (!ArrayPrototypeIncludes(oneOf, value)) {
      const allowed = ArrayPrototypeJoin(
        ArrayPrototypeMap(oneOf, (v: any) =>
          typeof v === "string" ? `'${v}'` : String(v)
        ),
        ", "
      );
      const reason = "must be one of: " + allowed;
      throw ERR_INVALID_ARG_VALUE(name, value, reason);
    }
  }
);

function validateBoolean(value: any, name: string) {
  if (typeof value !== "boolean")
    throw ERR_INVALID_ARG_TYPE(name, "boolean", value);
}

function getOwnPropertyValueOrDefault(
  options: { [key: string]: any },
  key: any,
  defaultValue: any
) {
  return options == null || !ObjectPrototypeHasOwnProperty(options, key)
    ? defaultValue
    : options[key];
}

/**
 * @param {unknown} value
 * @param {string} name
 * @param {{
 *   allowArray?: boolean,
 *   allowFunction?: boolean,
 *   nullable?: boolean
 * }} [options]
 */
const validateObject = hideStackFrames(
  (value: unknown, name: string, options: any) => {
    const allowArray = getOwnPropertyValueOrDefault(
      options,
      "allowArray",
      false
    );
    const allowFunction = getOwnPropertyValueOrDefault(
      options,
      "allowFunction",
      false
    );
    const nullable = getOwnPropertyValueOrDefault(options, "nullable", false);
    if (
      (!nullable && value === null) ||
      (!allowArray && ArrayIsArray(value)) ||
      (typeof value !== "object" &&
        (!allowFunction || typeof value !== "function"))
    ) {
      throw ERR_INVALID_ARG_TYPE(name, "Object", value);
    }
  }
);

const validateArray = hideStackFrames(
  (value: unknown, name: string, minLength = 0) => {
    if (!ArrayIsArray(value)) {
      throw ERR_INVALID_ARG_TYPE(name, "Array", value);
    }
    if (value.length < minLength) {
      const reason = `must be longer than ${minLength}`;
      throw ERR_INVALID_ARG_VALUE(name, value, reason);
    }
  }
);

const validateBuffer = hideStackFrames((buffer: any, name = "buffer") => {
  if (!ArrayBufferIsView(buffer)) {
    throw ERR_INVALID_ARG_TYPE(
      name,
      ["Buffer", "TypedArray", "DataView"],
      buffer
    );
  }
});

function validateEncoding(data: string | any[], encoding: any) {
  const normalizedEncoding = normalizeEncoding(encoding);
  const length = data.length;

  if (normalizedEncoding === "hex" && length % 2 !== 0) {
    throw ERR_INVALID_ARG_VALUE(
      "encoding",
      encoding,
      `is invalid for data of length ${length}`
    );
  }
}

// Check that the port number is not NaN when coerced to a number,
// is an integer and that it falls within the legal range of port numbers.
function validatePort(port: number, name = "Port", allowZero = true) {
  if (
    (typeof port !== "number" && typeof port !== "string") ||
    (typeof port === "string" && StringPrototypeTrim(port).length === 0) ||
    +port !== +port >>> 0 ||
    port > 0xffff ||
    (port === 0 && !allowZero)
  ) {
    if (typeof allowZero !== "boolean")
      throw "The 'allowZero' argument must be of type boolean.";
    const operator = allowZero ? ">=" : ">";
    throw `${name} should be ${operator} 0 and < 65536. Received ${port}.`;
  }

  return port | 0;
}

const validateAbortSignal = hideStackFrames((signal: unknown, name: string) => {
  if (
    signal !== undefined &&
    (signal === null || typeof signal !== "object" || !("aborted" in signal))
  ) {
    throw ERR_INVALID_ARG_TYPE(name, "AbortSignal", signal);
  }
});

const validateFunction = hideStackFrames((value: unknown, name: string) => {
  if (typeof value !== "function")
    throw ERR_INVALID_ARG_TYPE(name, "Function", value);
});

const validateUndefined = hideStackFrames((value: unknown, name: string) => {
  if (value !== undefined) throw ERR_INVALID_ARG_TYPE(name, "undefined", value);
});

function validateUnion(value: unknown, name: string, union: unknown[]) {
  if (!ArrayPrototypeIncludes(union, value)) {
    throw ERR_INVALID_ARG_TYPE(
      name,
      `('${ArrayPrototypeJoin(union, "|")}')`,
      value
    );
  }
}

export {
  isInt32,
  isUint32,
  parseFileMode,
  validateArray,
  validateBoolean,
  validateBuffer,
  validateEncoding,
  validateFunction,
  validateInt32,
  validateInteger,
  validateNumber,
  validateObject,
  validateOneOf,
  validatePort,
  validateString,
  validateUint32,
  validateUndefined,
  validateUnion,
  validateAbortSignal,
  getOwnPropertyValueOrDefault,
};
