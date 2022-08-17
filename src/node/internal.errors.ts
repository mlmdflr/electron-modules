import {
  ArrayIsArray,
  ArrayPrototypeIncludes,
  ArrayPrototypeIndexOf,
  ArrayPrototypeJoin,
  ArrayPrototypePop,
  ArrayPrototypePush,
  ArrayPrototypeSplice,
  MathAbs,
  NumberIsInteger,
  ObjectDefineProperty,
  RegExpPrototypeExec,
  StringPrototypeEndsWith,
  StringPrototypeIncludes,
  StringPrototypeSlice,
  StringPrototypeToLowerCase,
} from "./global.primordials";

const classRegExp = /^([A-Z][a-z0-9]*)+$/;
const kTypes = [
  "string",
  "function",
  "number",
  "object",
  // Accept 'Function' and 'Object' as alternative to the lower cased version.
  "Function",
  "Object",
  "boolean",
  "bigint",
  "symbol",
];

const assert = (value: unknown, message?: string | Error) => {
  if (!value) {
    throw message instanceof Error ? message : new Error(message);
  }
};

export const determineSpecificType = (value: any) => {
  if (value == null) {
    return "" + value;
  }
  if (typeof value === "function" && value.name) {
    return `function ${value.name}`;
  }
  if (typeof value === "object") {
    if (value.constructor?.name) {
      return `an instance of ${value.constructor.name}`;
    }
    return `an object`;
  }
  return `type ${typeof value} `;
};

export const addNumericalSeparator = (val: string) => {
  let res = "";
  let i = val.length;
  const start = val[0] === "-" ? 1 : 0;
  for (; i >= start + 4; i -= 3) {
    res = `_${StringPrototypeSlice(val, i - 3, i)}${res}`;
  }
  return `${StringPrototypeSlice(val, 0, i)}${res}`;
};

export const hideStackFrames = (
  fn: (value: unknown, name: string, options?: any) => void
) => {
  const hidden = "__node_internal_" + fn.name;
  // @ts-ignore
  ObjectDefineProperty(fn, "name", { __proto__: null, value: hidden });
  return fn;
};

export const ERR_INVALID_ARG_VALUE = (
  name: any,
  value: any,
  reason = "is invalid"
) => {
  const type = StringPrototypeIncludes(name, ".") ? "property" : "argument";
  return `The ${type} '${name}' ${reason}.`;
};

export const ERR_INVALID_ARG_TYPE = (
  name: string,
  expected: string | string[],
  actual: any
) => {
  assert(typeof name === "string", "'name' must be a string");
  if (!ArrayIsArray(expected)) {
    expected = [expected];
  }

  let msg = "The ";
  if (StringPrototypeEndsWith(name, " argument")) {
    // For cases like 'first argument'
    msg += `${name} `;
  } else {
    const type = StringPrototypeIncludes(name, ".") ? "property" : "argument";
    msg += `"${name}" ${type} `;
  }
  msg += "must be ";

  const types: string | any[] = [];
  const instances: string | any[] = [];
  const other: string | any[] = [];

  for (const value of expected) {
    assert(
      typeof value === "string",
      "All expected entries have to be of type string"
    );
    if (ArrayPrototypeIncludes(kTypes, value)) {
      ArrayPrototypePush(types, StringPrototypeToLowerCase(value));
    } else if (RegExpPrototypeExec(classRegExp, value) !== null) {
      ArrayPrototypePush(instances, value);
    } else {
      assert(
        value !== "object",
        'The value "object" should be written as "Object"'
      );
      ArrayPrototypePush(other, value);
    }
  }

  // Special handle `object` in case other instances are allowed to outline
  // the differences between each other.
  if (instances.length > 0) {
    const pos = ArrayPrototypeIndexOf(types, "object");
    if (pos !== -1) {
      ArrayPrototypeSplice(types, pos, 1);
      ArrayPrototypePush(instances, "Object");
    }
  }

  if (types.length > 0) {
    if (types.length > 2) {
      const last = ArrayPrototypePop(types);
      msg += `one of type ${ArrayPrototypeJoin(types, ", ")}, or ${last}`;
    } else if (types.length === 2) {
      msg += `one of type ${types[0]} or ${types[1]}`;
    } else {
      msg += `of type ${types[0]}`;
    }
    if (instances.length > 0 || other.length > 0) msg += " or ";
  }

  if (instances.length > 0) {
    if (instances.length > 2) {
      const last = ArrayPrototypePop(instances);
      msg += `an instance of ${ArrayPrototypeJoin(
        instances,
        ", "
      )}, or ${last}`;
    } else {
      msg += `an instance of ${instances[0]}`;
      if (instances.length === 2) {
        msg += ` or ${instances[1]}`;
      }
    }
    if (other.length > 0) msg += " or ";
  }

  if (other.length > 0) {
    if (other.length > 2) {
      const last = ArrayPrototypePop(other);
      msg += `one of ${ArrayPrototypeJoin(other, ", ")}, or ${last}`;
    } else if (other.length === 2) {
      msg += `one of ${other[0]} or ${other[1]}`;
    } else {
      if (StringPrototypeToLowerCase(other[0]) !== other[0]) msg += "an ";
      msg += `${other[0]}`;
    }
  }

  msg += `. Received ${determineSpecificType(actual)}`;

  return msg;
};

export const ERR_OUT_OF_RANGE = (
  str: any,
  range: unknown,
  input: number,
  replaceDefaultBoolean = false
) => {
  assert(range, 'Missing "range" argument');
  let msg = replaceDefaultBoolean
    ? str
    : `The value of "${str}" is out of range.`;
  let received;
  if (NumberIsInteger(input) && MathAbs(input) > 2 ** 32) {
    received = addNumericalSeparator(String(input));
  } else if (typeof input === "bigint") {
    received = String(input);
    if (input > 2n ** 32n || input < -(2n ** 32n)) {
      received = addNumericalSeparator(received);
    }
    received += "n";
  }
  msg += ` It must be ${range}. Received ${received}`;
  return msg;
};

export const ERR_FALSY_VALUE_REJECTION = () =>
  "Promise was rejected with falsy value";
