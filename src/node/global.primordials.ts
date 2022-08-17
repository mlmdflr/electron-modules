const ArrayIsArray = Array.isArray;
const ArrayFrom = Array.from;

const ArrayPrototypeFilter = <T>(that: Array<T>, ...args: any) =>
  Array.prototype.filter.apply(that, args);
const ArrayPrototypeForEach = <T>(that: Array<T>, ...args: any) =>
  Array.prototype.forEach.apply(that, args);
const ArrayPrototypePush = <T>(that: Array<T>, ...args: any) =>
  Array.prototype.push.apply(that, args);
const ArrayPrototypePop = <T>(that: Array<T>, ...args: any) =>
  Array.prototype.pop.apply(that, args);
const ArrayPrototypePushApply = <T>(that: Array<T>, ...args: any) =>
  Array.prototype.push.apply(that, args);
const ArrayPrototypeSort = <T>(that: Array<T>, ...args: any) =>
  Array.prototype.sort.apply(that, args);
const ArrayPrototypeUnshift = <T>(that: Array<T>, ...args: any) =>
  Array.prototype.unshift.apply(that, args);
const ArrayPrototypeIncludes = <T>(that: Array<T>, ...args: any) =>
  Array.prototype.includes.apply(that, args);
const ArrayPrototypeIndexOf = <T>(that: Array<T>, ...args: any) =>
  Array.prototype.indexOf.apply(that, args);
const ArrayPrototypeJoin = <T>(that: Array<T>, ...args: any) =>
  Array.prototype.join.apply(that, args);
const ArrayPrototypeMap = <T>(that: Array<T>, ...args: any) =>
  Array.prototype.map.apply(that, args);
const ArrayPrototypeSlice = <T>(that: Array<T>, ...args: any) =>
  Array.prototype.slice.apply(that, args);
const ArrayPrototypeSplice = <T>(that: Array<T>, ...args: any) =>
  Array.prototype.splice.apply(that, args);

const ArrayBufferIsView = ArrayBuffer.isView;

const BigIntPrototypeValueOf = (that: BigInt, ...args: any) =>
  BigInt.prototype.valueOf.apply(that, args);
const BooleanPrototypeValueOf = (that: Boolean, ...args: any) =>
  Boolean.prototype.valueOf.apply(that, args);

const DatePrototypeGetTime = (that: Date, ...args: any) =>
  Date.prototype.getTime.apply(that, args);
const DatePrototypeToISOString = (that: Date, ...args: any) =>
  Date.prototype.toISOString.apply(that, args);
const DatePrototypeToString = (that: Date, ...args: any) =>
  Date.prototype.toString.apply(that, args);

const ErrorPrototypeToString = (that: Error, ...args: any) =>
  Error.prototype.toString.apply(that, args);
const ErrorCaptureStackTrace = Error.captureStackTrace;

const FunctionPrototypeCall = (that: Function, ...args: any) =>
  Function.prototype.call.apply(that, args);

const FunctionPrototypeBind = (that: Function, ...args: any) =>
  Function.prototype.bind.apply(that, args);

const FunctionPrototypeToString = (that: Function, ...args: any) =>
  Function.prototype.toString.apply(that, args);

const JSONStringify = JSON.stringify;
const JSONParse = JSON.parse;

const SafeMap = Map;
const MapPrototypeGetSize = <K, V>(mp: Map<K, V>) => mp.size;
const MapPrototypeEntries = <K, V>(mp: Map<K, V>) => mp.entries();
const MapPrototypeGet = <K, V>(that: Map<K, V>, ...args: any) =>
  Map.prototype.get.apply(that, args);

const SafeWeakMap = WeakMap;

const SafeArrayIterator = Array.prototype[Symbol.iterator];

const SafeSet = Set;
const SetPrototypeGetSize = <K>(st: Set<K>) => st.size;
const SetPrototypeValues = <K>(st: Set<K>) => st.values();

const MathFloor = Math.floor;
const MathMax = Math.max;
const MathMin = Math.min;
const MathRound = Math.round;
const MathSqrt = Math.sqrt;
const MathAbs = Math.abs;

const NumberIsNaN = Number.isNaN;
const NumberParseFloat = Number.parseFloat;
const NumberParseInt = Number.parseInt;
const NumberPrototypeValueOf = (that: string, ...args: any) =>
  Number.prototype.valueOf.apply(that, args);
const NumberIsInteger = Number.isInteger;
const NumberMAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER;
const NumberMIN_SAFE_INTEGER = Number.MIN_SAFE_INTEGER;

const ObjectAssign = Object.assign;
const ObjectCreate = Object.create;
const ObjectDefineProperty = Object.defineProperty;
const ObjectDefineProperties = Object.defineProperties;
const ObjectGetOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
const ObjectGetOwnPropertyDescriptors = Object.getOwnPropertyDescriptors;
const ObjectGetOwnPropertyNames = Object.getOwnPropertyNames;
const ObjectGetOwnPropertySymbols = Object.getOwnPropertySymbols;
const ObjectGetPrototypeOf = Object.getPrototypeOf;
const ObjectFreeze = Object.freeze;
const ObjectIs = Object.is;
const ObjectIsExtensible = Object.isExtensible;
const ObjectKeys = Object.keys;
const ObjectPrototypeHasOwnProperty = (that: Object, ...args: any) =>
  Object.prototype.hasOwnProperty.apply(that, args);
const ObjectPrototypePropertyIsEnumerable = Object.propertyIsEnumerable;
const ObjectSeal = Object.seal;
const ObjectSetPrototypeOf = Object.setPrototypeOf;

const ReflectOwnKeys = Reflect.ownKeys;
const ReflectApply = Reflect.apply;
const ReflectConstruct = Reflect.construct;

const RegExpPrototypeTest = (that: RegExp, ...args: any) =>
  RegExp.prototype.test.apply(that, args);
const RegExpPrototypeExec = (that: RegExp, ...args: any) =>
  RegExp.prototype.exec.apply(that, args);
const RegExpPrototypeToString = (that: RegExp, ...args: any) =>
  RegExp.prototype.toString.apply(that, args);

const SafeStringIterator = String;
const StringPrototypeCharCodeAt = (that: String, ...args: any) =>
  String.prototype.charCodeAt.apply(that, args);
const StringPrototypeCodePointAt = (that: String, ...args: any) =>
  String.prototype.codePointAt.apply(that, args);
const StringPrototypeIncludes = (that: String, ...args: any) =>
  String.prototype.includes.apply(that, args);
const StringPrototypeNormalize = (that: String, ...args: any) =>
  String.prototype.normalize.apply(that, args);
const StringPrototypePadEnd = (that: String, ...args: any) =>
  String.prototype.padEnd.apply(that, args);
const StringPrototypePadStart = (that: String, ...args: any) =>
  String.prototype.padStart.apply(that, args);
const StringPrototypeRepeat = (that: String, ...args: any) =>
  String.prototype.repeat.apply(that, args);
const StringPrototypeReplace = (that: String, ...args: any) =>
  String.prototype.replace.apply(that, args);
const StringPrototypeSlice = (that: String, ...args: any) =>
  String.prototype.slice.apply(that, args);
const StringPrototypeSplit = (that: String, ...args: any) =>
  String.prototype.split.apply(that, args);
const StringPrototypeToLowerCase = (that: String, ...args: any) =>
  String.prototype.toLowerCase.apply(that, args);
const StringPrototypeToUpperCase = (that: String, ...args: any) =>
  String.prototype.toUpperCase.apply(that, args);
const StringPrototypeTrim = (that: String, ...args: any) =>
  String.prototype.trim.apply(that, args);
const StringPrototypeValueOf = (that: String, ...args: any) =>
  String.prototype.valueOf.apply(that, args);
const StringPrototypeEndsWith = (that: String, ...args: any) =>
  String.prototype.endsWith.apply(that, args);
const StringPrototypeStartsWith = (that: String, ...args: any) =>
  String.prototype.startsWith.apply(that, args);
const StringPrototypeMatch = (that: String, ...args: any) =>
  String.prototype.match.apply(that, args);
const StringPrototypeLastIndexOf = (that: String, ...args: any) =>
  String.prototype.lastIndexOf.apply(that, args);
const StringPrototypeIndexOf = (that: String, ...args: any) =>
  String.prototype.indexOf.apply(that, args);

const SymbolFor = Symbol.for;
const SymbolPrototypeToString = (that: Symbol, ...args: any) =>
  Symbol.prototype.toString.apply(that, args);
const SymbolPrototypeValueOf = (that: Symbol, ...args: any) =>
  Symbol.prototype.toString.valueOf.apply(that, args);
const SymbolToStringTag = Symbol.toStringTag;
const SymbolIterator = Symbol.iterator;

const TypedArrayPrototypeGetLength = (tarr: NodeJS.TypedArray) => tarr.length;

const TypedArrayPrototypeGetSymbolToStringTag = (tarr: NodeJS.TypedArray) =>
  tarr[Symbol.toStringTag];

const uncurryThis = (func: Function) => (thisArg: any, args: ArrayLike<any>) =>
  Reflect.apply(func, thisArg, args);

export {
  ArrayIsArray,
  ArrayPrototypeFilter,
  ArrayPrototypeForEach,
  ArrayPrototypePush,
  ArrayPrototypePushApply,
  ArrayPrototypeSort,
  ArrayPrototypeUnshift,
  ArrayFrom,
  ArrayPrototypeIncludes,
  ArrayPrototypeIndexOf,
  ArrayPrototypeJoin,
  ArrayPrototypeMap,
  ArrayPrototypePop,
  ArrayPrototypeSlice,
  ArrayPrototypeSplice,
  ArrayBufferIsView,
  BigIntPrototypeValueOf,
  BooleanPrototypeValueOf,
  DatePrototypeGetTime,
  DatePrototypeToISOString,
  DatePrototypeToString,
  ErrorPrototypeToString,
  ErrorCaptureStackTrace,
  FunctionPrototypeCall,
  FunctionPrototypeBind,
  FunctionPrototypeToString,
  JSONStringify,
  JSONParse,
  MathFloor,
  MathMax,
  MathMin,
  MathRound,
  MathSqrt,
  MathAbs,
  NumberIsNaN,
  NumberParseFloat,
  NumberParseInt,
  NumberPrototypeValueOf,
  NumberIsInteger,
  NumberMAX_SAFE_INTEGER,
  NumberMIN_SAFE_INTEGER,
  ObjectAssign,
  ObjectCreate,
  ObjectDefineProperty,
  ObjectDefineProperties,
  ObjectGetOwnPropertyDescriptor,
  ObjectGetOwnPropertyDescriptors,
  ObjectGetOwnPropertyNames,
  ObjectGetOwnPropertySymbols,
  ObjectGetPrototypeOf,
  ObjectFreeze,
  ObjectIs,
  ObjectIsExtensible,
  ObjectKeys,
  ObjectPrototypeHasOwnProperty,
  ObjectPrototypePropertyIsEnumerable,
  ObjectSeal,
  ObjectSetPrototypeOf,
  ReflectOwnKeys,
  ReflectApply,
  ReflectConstruct,
  RegExpPrototypeTest,
  RegExpPrototypeExec,
  RegExpPrototypeToString,
  SafeStringIterator,
  SafeMap,
  MapPrototypeGetSize,
  MapPrototypeEntries,
  MapPrototypeGet,
  SafeSet,
  SafeWeakMap,
  SafeArrayIterator,
  SetPrototypeGetSize,
  SetPrototypeValues,
  StringPrototypeCharCodeAt,
  StringPrototypeCodePointAt,
  StringPrototypeIncludes,
  StringPrototypeNormalize,
  StringPrototypePadEnd,
  StringPrototypePadStart,
  StringPrototypeRepeat,
  StringPrototypeReplace,
  StringPrototypeSlice,
  StringPrototypeSplit,
  StringPrototypeToLowerCase,
  StringPrototypeToUpperCase,
  StringPrototypeTrim,
  StringPrototypeValueOf,
  StringPrototypeEndsWith,
  StringPrototypeMatch,
  StringPrototypeStartsWith,
  StringPrototypeLastIndexOf,
  StringPrototypeIndexOf,
  SymbolPrototypeToString,
  SymbolPrototypeValueOf,
  SymbolIterator,
  SymbolToStringTag,
  SymbolFor,
  TypedArrayPrototypeGetLength,
  TypedArrayPrototypeGetSymbolToStringTag,
  uncurryThis,
};
