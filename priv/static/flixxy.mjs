// build/dev/javascript/prelude.mjs
var CustomType = class {
  withFields(fields) {
    let properties = Object.keys(this).map(
      (label) => label in fields ? fields[label] : this[label]
    );
    return new this.constructor(...properties);
  }
};
var List = class {
  static fromArray(array3, tail) {
    let t = tail || new Empty();
    for (let i = array3.length - 1; i >= 0; --i) {
      t = new NonEmpty(array3[i], t);
    }
    return t;
  }
  [Symbol.iterator]() {
    return new ListIterator(this);
  }
  toArray() {
    return [...this];
  }
  // @internal
  atLeastLength(desired) {
    let current = this;
    while (desired-- > 0 && current) current = current.tail;
    return current !== void 0;
  }
  // @internal
  hasLength(desired) {
    let current = this;
    while (desired-- > 0 && current) current = current.tail;
    return desired === -1 && current instanceof Empty;
  }
  // @internal
  countLength() {
    let current = this;
    let length4 = 0;
    while (current) {
      current = current.tail;
      length4++;
    }
    return length4 - 1;
  }
};
function prepend(element3, tail) {
  return new NonEmpty(element3, tail);
}
function toList(elements, tail) {
  return List.fromArray(elements, tail);
}
var ListIterator = class {
  #current;
  constructor(current) {
    this.#current = current;
  }
  next() {
    if (this.#current instanceof Empty) {
      return { done: true };
    } else {
      let { head, tail } = this.#current;
      this.#current = tail;
      return { value: head, done: false };
    }
  }
};
var Empty = class extends List {
};
var NonEmpty = class extends List {
  constructor(head, tail) {
    super();
    this.head = head;
    this.tail = tail;
  }
};
var BitArray = class {
  /**
   * The size in bits of this bit array's data.
   *
   * @type {number}
   */
  bitSize;
  /**
   * The size in bytes of this bit array's data. If this bit array doesn't store
   * a whole number of bytes then this value is rounded up.
   *
   * @type {number}
   */
  byteSize;
  /**
   * The number of unused high bits in the first byte of this bit array's
   * buffer prior to the start of its data. The value of any unused high bits is
   * undefined.
   *
   * The bit offset will be in the range 0-7.
   *
   * @type {number}
   */
  bitOffset;
  /**
   * The raw bytes that hold this bit array's data.
   *
   * If `bitOffset` is not zero then there are unused high bits in the first
   * byte of this buffer.
   *
   * If `bitOffset + bitSize` is not a multiple of 8 then there are unused low
   * bits in the last byte of this buffer.
   *
   * @type {Uint8Array}
   */
  rawBuffer;
  /**
   * Constructs a new bit array from a `Uint8Array`, an optional size in
   * bits, and an optional bit offset.
   *
   * If no bit size is specified it is taken as `buffer.length * 8`, i.e. all
   * bytes in the buffer make up the new bit array's data.
   *
   * If no bit offset is specified it defaults to zero, i.e. there are no unused
   * high bits in the first byte of the buffer.
   *
   * @param {Uint8Array} buffer
   * @param {number} [bitSize]
   * @param {number} [bitOffset]
   */
  constructor(buffer, bitSize, bitOffset) {
    if (!(buffer instanceof Uint8Array)) {
      throw globalThis.Error(
        "BitArray can only be constructed from a Uint8Array"
      );
    }
    this.bitSize = bitSize ?? buffer.length * 8;
    this.byteSize = Math.trunc((this.bitSize + 7) / 8);
    this.bitOffset = bitOffset ?? 0;
    if (this.bitSize < 0) {
      throw globalThis.Error(`BitArray bit size is invalid: ${this.bitSize}`);
    }
    if (this.bitOffset < 0 || this.bitOffset > 7) {
      throw globalThis.Error(
        `BitArray bit offset is invalid: ${this.bitOffset}`
      );
    }
    if (buffer.length !== Math.trunc((this.bitOffset + this.bitSize + 7) / 8)) {
      throw globalThis.Error("BitArray buffer length is invalid");
    }
    this.rawBuffer = buffer;
  }
  /**
   * Returns a specific byte in this bit array. If the byte index is out of
   * range then `undefined` is returned.
   *
   * When returning the final byte of a bit array with a bit size that's not a
   * multiple of 8, the content of the unused low bits are undefined.
   *
   * @param {number} index
   * @returns {number | undefined}
   */
  byteAt(index5) {
    if (index5 < 0 || index5 >= this.byteSize) {
      return void 0;
    }
    return bitArrayByteAt(this.rawBuffer, this.bitOffset, index5);
  }
  /** @internal */
  equals(other) {
    if (this.bitSize !== other.bitSize) {
      return false;
    }
    const wholeByteCount = Math.trunc(this.bitSize / 8);
    if (this.bitOffset === 0 && other.bitOffset === 0) {
      for (let i = 0; i < wholeByteCount; i++) {
        if (this.rawBuffer[i] !== other.rawBuffer[i]) {
          return false;
        }
      }
      const trailingBitsCount = this.bitSize % 8;
      if (trailingBitsCount) {
        const unusedLowBitCount = 8 - trailingBitsCount;
        if (this.rawBuffer[wholeByteCount] >> unusedLowBitCount !== other.rawBuffer[wholeByteCount] >> unusedLowBitCount) {
          return false;
        }
      }
    } else {
      for (let i = 0; i < wholeByteCount; i++) {
        const a = bitArrayByteAt(this.rawBuffer, this.bitOffset, i);
        const b = bitArrayByteAt(other.rawBuffer, other.bitOffset, i);
        if (a !== b) {
          return false;
        }
      }
      const trailingBitsCount = this.bitSize % 8;
      if (trailingBitsCount) {
        const a = bitArrayByteAt(
          this.rawBuffer,
          this.bitOffset,
          wholeByteCount
        );
        const b = bitArrayByteAt(
          other.rawBuffer,
          other.bitOffset,
          wholeByteCount
        );
        const unusedLowBitCount = 8 - trailingBitsCount;
        if (a >> unusedLowBitCount !== b >> unusedLowBitCount) {
          return false;
        }
      }
    }
    return true;
  }
  /**
   * Returns this bit array's internal buffer.
   *
   * @deprecated Use `BitArray.byteAt()` or `BitArray.rawBuffer` instead.
   *
   * @returns {Uint8Array}
   */
  get buffer() {
    bitArrayPrintDeprecationWarning(
      "buffer",
      "Use BitArray.byteAt() or BitArray.rawBuffer instead"
    );
    if (this.bitOffset !== 0 || this.bitSize % 8 !== 0) {
      throw new globalThis.Error(
        "BitArray.buffer does not support unaligned bit arrays"
      );
    }
    return this.rawBuffer;
  }
  /**
   * Returns the length in bytes of this bit array's internal buffer.
   *
   * @deprecated Use `BitArray.bitSize` or `BitArray.byteSize` instead.
   *
   * @returns {number}
   */
  get length() {
    bitArrayPrintDeprecationWarning(
      "length",
      "Use BitArray.bitSize or BitArray.byteSize instead"
    );
    if (this.bitOffset !== 0 || this.bitSize % 8 !== 0) {
      throw new globalThis.Error(
        "BitArray.length does not support unaligned bit arrays"
      );
    }
    return this.rawBuffer.length;
  }
};
function bitArrayByteAt(buffer, bitOffset, index5) {
  if (bitOffset === 0) {
    return buffer[index5] ?? 0;
  } else {
    const a = buffer[index5] << bitOffset & 255;
    const b = buffer[index5 + 1] >> 8 - bitOffset;
    return a | b;
  }
}
var UtfCodepoint = class {
  constructor(value2) {
    this.value = value2;
  }
};
var isBitArrayDeprecationMessagePrinted = {};
function bitArrayPrintDeprecationWarning(name, message2) {
  if (isBitArrayDeprecationMessagePrinted[name]) {
    return;
  }
  console.warn(
    `Deprecated BitArray.${name} property used in JavaScript FFI code. ${message2}.`
  );
  isBitArrayDeprecationMessagePrinted[name] = true;
}
function bitArraySlice(bitArray, start4, end) {
  end ??= bitArray.bitSize;
  bitArrayValidateRange(bitArray, start4, end);
  if (start4 === end) {
    return new BitArray(new Uint8Array());
  }
  if (start4 === 0 && end === bitArray.bitSize) {
    return bitArray;
  }
  start4 += bitArray.bitOffset;
  end += bitArray.bitOffset;
  const startByteIndex = Math.trunc(start4 / 8);
  const endByteIndex = Math.trunc((end + 7) / 8);
  const byteLength = endByteIndex - startByteIndex;
  let buffer;
  if (startByteIndex === 0 && byteLength === bitArray.rawBuffer.byteLength) {
    buffer = bitArray.rawBuffer;
  } else {
    buffer = new Uint8Array(
      bitArray.rawBuffer.buffer,
      bitArray.rawBuffer.byteOffset + startByteIndex,
      byteLength
    );
  }
  return new BitArray(buffer, end - start4, start4 % 8);
}
function bitArraySliceToInt(bitArray, start4, end, isBigEndian, isSigned) {
  bitArrayValidateRange(bitArray, start4, end);
  if (start4 === end) {
    return 0;
  }
  start4 += bitArray.bitOffset;
  end += bitArray.bitOffset;
  const isStartByteAligned = start4 % 8 === 0;
  const isEndByteAligned = end % 8 === 0;
  if (isStartByteAligned && isEndByteAligned) {
    return intFromAlignedSlice(
      bitArray,
      start4 / 8,
      end / 8,
      isBigEndian,
      isSigned
    );
  }
  const size2 = end - start4;
  const startByteIndex = Math.trunc(start4 / 8);
  const endByteIndex = Math.trunc((end - 1) / 8);
  if (startByteIndex == endByteIndex) {
    const mask2 = 255 >> start4 % 8;
    const unusedLowBitCount = (8 - end % 8) % 8;
    let value2 = (bitArray.rawBuffer[startByteIndex] & mask2) >> unusedLowBitCount;
    if (isSigned) {
      const highBit = 2 ** (size2 - 1);
      if (value2 >= highBit) {
        value2 -= highBit * 2;
      }
    }
    return value2;
  }
  if (size2 <= 53) {
    return intFromUnalignedSliceUsingNumber(
      bitArray.rawBuffer,
      start4,
      end,
      isBigEndian,
      isSigned
    );
  } else {
    return intFromUnalignedSliceUsingBigInt(
      bitArray.rawBuffer,
      start4,
      end,
      isBigEndian,
      isSigned
    );
  }
}
function intFromAlignedSlice(bitArray, start4, end, isBigEndian, isSigned) {
  const byteSize = end - start4;
  if (byteSize <= 6) {
    return intFromAlignedSliceUsingNumber(
      bitArray.rawBuffer,
      start4,
      end,
      isBigEndian,
      isSigned
    );
  } else {
    return intFromAlignedSliceUsingBigInt(
      bitArray.rawBuffer,
      start4,
      end,
      isBigEndian,
      isSigned
    );
  }
}
function intFromAlignedSliceUsingNumber(buffer, start4, end, isBigEndian, isSigned) {
  const byteSize = end - start4;
  let value2 = 0;
  if (isBigEndian) {
    for (let i = start4; i < end; i++) {
      value2 *= 256;
      value2 += buffer[i];
    }
  } else {
    for (let i = end - 1; i >= start4; i--) {
      value2 *= 256;
      value2 += buffer[i];
    }
  }
  if (isSigned) {
    const highBit = 2 ** (byteSize * 8 - 1);
    if (value2 >= highBit) {
      value2 -= highBit * 2;
    }
  }
  return value2;
}
function intFromAlignedSliceUsingBigInt(buffer, start4, end, isBigEndian, isSigned) {
  const byteSize = end - start4;
  let value2 = 0n;
  if (isBigEndian) {
    for (let i = start4; i < end; i++) {
      value2 *= 256n;
      value2 += BigInt(buffer[i]);
    }
  } else {
    for (let i = end - 1; i >= start4; i--) {
      value2 *= 256n;
      value2 += BigInt(buffer[i]);
    }
  }
  if (isSigned) {
    const highBit = 1n << BigInt(byteSize * 8 - 1);
    if (value2 >= highBit) {
      value2 -= highBit * 2n;
    }
  }
  return Number(value2);
}
function intFromUnalignedSliceUsingNumber(buffer, start4, end, isBigEndian, isSigned) {
  const isStartByteAligned = start4 % 8 === 0;
  let size2 = end - start4;
  let byteIndex = Math.trunc(start4 / 8);
  let value2 = 0;
  if (isBigEndian) {
    if (!isStartByteAligned) {
      const leadingBitsCount = 8 - start4 % 8;
      value2 = buffer[byteIndex++] & (1 << leadingBitsCount) - 1;
      size2 -= leadingBitsCount;
    }
    while (size2 >= 8) {
      value2 *= 256;
      value2 += buffer[byteIndex++];
      size2 -= 8;
    }
    if (size2 > 0) {
      value2 *= 2 ** size2;
      value2 += buffer[byteIndex] >> 8 - size2;
    }
  } else {
    if (isStartByteAligned) {
      let size3 = end - start4;
      let scale = 1;
      while (size3 >= 8) {
        value2 += buffer[byteIndex++] * scale;
        scale *= 256;
        size3 -= 8;
      }
      value2 += (buffer[byteIndex] >> 8 - size3) * scale;
    } else {
      const highBitsCount = start4 % 8;
      const lowBitsCount = 8 - highBitsCount;
      let size3 = end - start4;
      let scale = 1;
      while (size3 >= 8) {
        const byte = buffer[byteIndex] << highBitsCount | buffer[byteIndex + 1] >> lowBitsCount;
        value2 += (byte & 255) * scale;
        scale *= 256;
        size3 -= 8;
        byteIndex++;
      }
      if (size3 > 0) {
        const lowBitsUsed = size3 - Math.max(0, size3 - lowBitsCount);
        let trailingByte = (buffer[byteIndex] & (1 << lowBitsCount) - 1) >> lowBitsCount - lowBitsUsed;
        size3 -= lowBitsUsed;
        if (size3 > 0) {
          trailingByte *= 2 ** size3;
          trailingByte += buffer[byteIndex + 1] >> 8 - size3;
        }
        value2 += trailingByte * scale;
      }
    }
  }
  if (isSigned) {
    const highBit = 2 ** (end - start4 - 1);
    if (value2 >= highBit) {
      value2 -= highBit * 2;
    }
  }
  return value2;
}
function intFromUnalignedSliceUsingBigInt(buffer, start4, end, isBigEndian, isSigned) {
  const isStartByteAligned = start4 % 8 === 0;
  let size2 = end - start4;
  let byteIndex = Math.trunc(start4 / 8);
  let value2 = 0n;
  if (isBigEndian) {
    if (!isStartByteAligned) {
      const leadingBitsCount = 8 - start4 % 8;
      value2 = BigInt(buffer[byteIndex++] & (1 << leadingBitsCount) - 1);
      size2 -= leadingBitsCount;
    }
    while (size2 >= 8) {
      value2 *= 256n;
      value2 += BigInt(buffer[byteIndex++]);
      size2 -= 8;
    }
    if (size2 > 0) {
      value2 <<= BigInt(size2);
      value2 += BigInt(buffer[byteIndex] >> 8 - size2);
    }
  } else {
    if (isStartByteAligned) {
      let size3 = end - start4;
      let shift = 0n;
      while (size3 >= 8) {
        value2 += BigInt(buffer[byteIndex++]) << shift;
        shift += 8n;
        size3 -= 8;
      }
      value2 += BigInt(buffer[byteIndex] >> 8 - size3) << shift;
    } else {
      const highBitsCount = start4 % 8;
      const lowBitsCount = 8 - highBitsCount;
      let size3 = end - start4;
      let shift = 0n;
      while (size3 >= 8) {
        const byte = buffer[byteIndex] << highBitsCount | buffer[byteIndex + 1] >> lowBitsCount;
        value2 += BigInt(byte & 255) << shift;
        shift += 8n;
        size3 -= 8;
        byteIndex++;
      }
      if (size3 > 0) {
        const lowBitsUsed = size3 - Math.max(0, size3 - lowBitsCount);
        let trailingByte = (buffer[byteIndex] & (1 << lowBitsCount) - 1) >> lowBitsCount - lowBitsUsed;
        size3 -= lowBitsUsed;
        if (size3 > 0) {
          trailingByte <<= size3;
          trailingByte += buffer[byteIndex + 1] >> 8 - size3;
        }
        value2 += BigInt(trailingByte) << shift;
      }
    }
  }
  if (isSigned) {
    const highBit = 2n ** BigInt(end - start4 - 1);
    if (value2 >= highBit) {
      value2 -= highBit * 2n;
    }
  }
  return Number(value2);
}
function bitArrayValidateRange(bitArray, start4, end) {
  if (start4 < 0 || start4 > bitArray.bitSize || end < start4 || end > bitArray.bitSize) {
    const msg = `Invalid bit array slice: start = ${start4}, end = ${end}, bit size = ${bitArray.bitSize}`;
    throw new globalThis.Error(msg);
  }
}
var Result = class _Result extends CustomType {
  // @internal
  static isResult(data) {
    return data instanceof _Result;
  }
};
var Ok = class extends Result {
  constructor(value2) {
    super();
    this[0] = value2;
  }
  // @internal
  isOk() {
    return true;
  }
};
var Error = class extends Result {
  constructor(detail) {
    super();
    this[0] = detail;
  }
  // @internal
  isOk() {
    return false;
  }
};
function isEqual(x, y) {
  let values3 = [x, y];
  while (values3.length) {
    let a = values3.pop();
    let b = values3.pop();
    if (a === b) continue;
    if (!isObject(a) || !isObject(b)) return false;
    let unequal = !structurallyCompatibleObjects(a, b) || unequalDates(a, b) || unequalBuffers(a, b) || unequalArrays(a, b) || unequalMaps(a, b) || unequalSets(a, b) || unequalRegExps(a, b);
    if (unequal) return false;
    const proto = Object.getPrototypeOf(a);
    if (proto !== null && typeof proto.equals === "function") {
      try {
        if (a.equals(b)) continue;
        else return false;
      } catch {
      }
    }
    let [keys2, get4] = getters(a);
    for (let k of keys2(a)) {
      values3.push(get4(a, k), get4(b, k));
    }
  }
  return true;
}
function getters(object4) {
  if (object4 instanceof Map) {
    return [(x) => x.keys(), (x, y) => x.get(y)];
  } else {
    let extra = object4 instanceof globalThis.Error ? ["message"] : [];
    return [(x) => [...extra, ...Object.keys(x)], (x, y) => x[y]];
  }
}
function unequalDates(a, b) {
  return a instanceof Date && (a > b || a < b);
}
function unequalBuffers(a, b) {
  return !(a instanceof BitArray) && a.buffer instanceof ArrayBuffer && a.BYTES_PER_ELEMENT && !(a.byteLength === b.byteLength && a.every((n, i) => n === b[i]));
}
function unequalArrays(a, b) {
  return Array.isArray(a) && a.length !== b.length;
}
function unequalMaps(a, b) {
  return a instanceof Map && a.size !== b.size;
}
function unequalSets(a, b) {
  return a instanceof Set && (a.size != b.size || [...a].some((e) => !b.has(e)));
}
function unequalRegExps(a, b) {
  return a instanceof RegExp && (a.source !== b.source || a.flags !== b.flags);
}
function isObject(a) {
  return typeof a === "object" && a !== null;
}
function structurallyCompatibleObjects(a, b) {
  if (typeof a !== "object" && typeof b !== "object" && (!a || !b))
    return false;
  let nonstructural = [Promise, WeakSet, WeakMap, Function];
  if (nonstructural.some((c) => a instanceof c)) return false;
  return a.constructor === b.constructor;
}
function makeError(variant, file, module, line, fn, message2, extra) {
  let error = new globalThis.Error(message2);
  error.gleam_error = variant;
  error.file = file;
  error.module = module;
  error.line = line;
  error.function = fn;
  error.fn = fn;
  for (let k in extra) error[k] = extra[k];
  return error;
}

// build/dev/javascript/gleam_stdlib/gleam/option.mjs
var Some = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var None = class extends CustomType {
};
function to_result(option, e) {
  if (option instanceof Some) {
    let a = option[0];
    return new Ok(a);
  } else {
    return new Error(e);
  }
}
function unwrap(option, default$) {
  if (option instanceof Some) {
    let x = option[0];
    return x;
  } else {
    return default$;
  }
}

// build/dev/javascript/gleam_stdlib/dict.mjs
var referenceMap = /* @__PURE__ */ new WeakMap();
var tempDataView = /* @__PURE__ */ new DataView(
  /* @__PURE__ */ new ArrayBuffer(8)
);
var referenceUID = 0;
function hashByReference(o) {
  const known = referenceMap.get(o);
  if (known !== void 0) {
    return known;
  }
  const hash = referenceUID++;
  if (referenceUID === 2147483647) {
    referenceUID = 0;
  }
  referenceMap.set(o, hash);
  return hash;
}
function hashMerge(a, b) {
  return a ^ b + 2654435769 + (a << 6) + (a >> 2) | 0;
}
function hashString(s) {
  let hash = 0;
  const len = s.length;
  for (let i = 0; i < len; i++) {
    hash = Math.imul(31, hash) + s.charCodeAt(i) | 0;
  }
  return hash;
}
function hashNumber(n) {
  tempDataView.setFloat64(0, n);
  const i = tempDataView.getInt32(0);
  const j = tempDataView.getInt32(4);
  return Math.imul(73244475, i >> 16 ^ i) ^ j;
}
function hashBigInt(n) {
  return hashString(n.toString());
}
function hashObject(o) {
  const proto = Object.getPrototypeOf(o);
  if (proto !== null && typeof proto.hashCode === "function") {
    try {
      const code = o.hashCode(o);
      if (typeof code === "number") {
        return code;
      }
    } catch {
    }
  }
  if (o instanceof Promise || o instanceof WeakSet || o instanceof WeakMap) {
    return hashByReference(o);
  }
  if (o instanceof Date) {
    return hashNumber(o.getTime());
  }
  let h = 0;
  if (o instanceof ArrayBuffer) {
    o = new Uint8Array(o);
  }
  if (Array.isArray(o) || o instanceof Uint8Array) {
    for (let i = 0; i < o.length; i++) {
      h = Math.imul(31, h) + getHash(o[i]) | 0;
    }
  } else if (o instanceof Set) {
    o.forEach((v) => {
      h = h + getHash(v) | 0;
    });
  } else if (o instanceof Map) {
    o.forEach((v, k) => {
      h = h + hashMerge(getHash(v), getHash(k)) | 0;
    });
  } else {
    const keys2 = Object.keys(o);
    for (let i = 0; i < keys2.length; i++) {
      const k = keys2[i];
      const v = o[k];
      h = h + hashMerge(getHash(v), hashString(k)) | 0;
    }
  }
  return h;
}
function getHash(u) {
  if (u === null) return 1108378658;
  if (u === void 0) return 1108378659;
  if (u === true) return 1108378657;
  if (u === false) return 1108378656;
  switch (typeof u) {
    case "number":
      return hashNumber(u);
    case "string":
      return hashString(u);
    case "bigint":
      return hashBigInt(u);
    case "object":
      return hashObject(u);
    case "symbol":
      return hashByReference(u);
    case "function":
      return hashByReference(u);
    default:
      return 0;
  }
}
var SHIFT = 5;
var BUCKET_SIZE = Math.pow(2, SHIFT);
var MASK = BUCKET_SIZE - 1;
var MAX_INDEX_NODE = BUCKET_SIZE / 2;
var MIN_ARRAY_NODE = BUCKET_SIZE / 4;
var ENTRY = 0;
var ARRAY_NODE = 1;
var INDEX_NODE = 2;
var COLLISION_NODE = 3;
var EMPTY = {
  type: INDEX_NODE,
  bitmap: 0,
  array: []
};
function mask(hash, shift) {
  return hash >>> shift & MASK;
}
function bitpos(hash, shift) {
  return 1 << mask(hash, shift);
}
function bitcount(x) {
  x -= x >> 1 & 1431655765;
  x = (x & 858993459) + (x >> 2 & 858993459);
  x = x + (x >> 4) & 252645135;
  x += x >> 8;
  x += x >> 16;
  return x & 127;
}
function index(bitmap, bit) {
  return bitcount(bitmap & bit - 1);
}
function cloneAndSet(arr, at, val) {
  const len = arr.length;
  const out = new Array(len);
  for (let i = 0; i < len; ++i) {
    out[i] = arr[i];
  }
  out[at] = val;
  return out;
}
function spliceIn(arr, at, val) {
  const len = arr.length;
  const out = new Array(len + 1);
  let i = 0;
  let g = 0;
  while (i < at) {
    out[g++] = arr[i++];
  }
  out[g++] = val;
  while (i < len) {
    out[g++] = arr[i++];
  }
  return out;
}
function spliceOut(arr, at) {
  const len = arr.length;
  const out = new Array(len - 1);
  let i = 0;
  let g = 0;
  while (i < at) {
    out[g++] = arr[i++];
  }
  ++i;
  while (i < len) {
    out[g++] = arr[i++];
  }
  return out;
}
function createNode(shift, key1, val1, key2hash, key2, val2) {
  const key1hash = getHash(key1);
  if (key1hash === key2hash) {
    return {
      type: COLLISION_NODE,
      hash: key1hash,
      array: [
        { type: ENTRY, k: key1, v: val1 },
        { type: ENTRY, k: key2, v: val2 }
      ]
    };
  }
  const addedLeaf = { val: false };
  return assoc(
    assocIndex(EMPTY, shift, key1hash, key1, val1, addedLeaf),
    shift,
    key2hash,
    key2,
    val2,
    addedLeaf
  );
}
function assoc(root3, shift, hash, key, val, addedLeaf) {
  switch (root3.type) {
    case ARRAY_NODE:
      return assocArray(root3, shift, hash, key, val, addedLeaf);
    case INDEX_NODE:
      return assocIndex(root3, shift, hash, key, val, addedLeaf);
    case COLLISION_NODE:
      return assocCollision(root3, shift, hash, key, val, addedLeaf);
  }
}
function assocArray(root3, shift, hash, key, val, addedLeaf) {
  const idx = mask(hash, shift);
  const node = root3.array[idx];
  if (node === void 0) {
    addedLeaf.val = true;
    return {
      type: ARRAY_NODE,
      size: root3.size + 1,
      array: cloneAndSet(root3.array, idx, { type: ENTRY, k: key, v: val })
    };
  }
  if (node.type === ENTRY) {
    if (isEqual(key, node.k)) {
      if (val === node.v) {
        return root3;
      }
      return {
        type: ARRAY_NODE,
        size: root3.size,
        array: cloneAndSet(root3.array, idx, {
          type: ENTRY,
          k: key,
          v: val
        })
      };
    }
    addedLeaf.val = true;
    return {
      type: ARRAY_NODE,
      size: root3.size,
      array: cloneAndSet(
        root3.array,
        idx,
        createNode(shift + SHIFT, node.k, node.v, hash, key, val)
      )
    };
  }
  const n = assoc(node, shift + SHIFT, hash, key, val, addedLeaf);
  if (n === node) {
    return root3;
  }
  return {
    type: ARRAY_NODE,
    size: root3.size,
    array: cloneAndSet(root3.array, idx, n)
  };
}
function assocIndex(root3, shift, hash, key, val, addedLeaf) {
  const bit = bitpos(hash, shift);
  const idx = index(root3.bitmap, bit);
  if ((root3.bitmap & bit) !== 0) {
    const node = root3.array[idx];
    if (node.type !== ENTRY) {
      const n = assoc(node, shift + SHIFT, hash, key, val, addedLeaf);
      if (n === node) {
        return root3;
      }
      return {
        type: INDEX_NODE,
        bitmap: root3.bitmap,
        array: cloneAndSet(root3.array, idx, n)
      };
    }
    const nodeKey = node.k;
    if (isEqual(key, nodeKey)) {
      if (val === node.v) {
        return root3;
      }
      return {
        type: INDEX_NODE,
        bitmap: root3.bitmap,
        array: cloneAndSet(root3.array, idx, {
          type: ENTRY,
          k: key,
          v: val
        })
      };
    }
    addedLeaf.val = true;
    return {
      type: INDEX_NODE,
      bitmap: root3.bitmap,
      array: cloneAndSet(
        root3.array,
        idx,
        createNode(shift + SHIFT, nodeKey, node.v, hash, key, val)
      )
    };
  } else {
    const n = root3.array.length;
    if (n >= MAX_INDEX_NODE) {
      const nodes = new Array(32);
      const jdx = mask(hash, shift);
      nodes[jdx] = assocIndex(EMPTY, shift + SHIFT, hash, key, val, addedLeaf);
      let j = 0;
      let bitmap = root3.bitmap;
      for (let i = 0; i < 32; i++) {
        if ((bitmap & 1) !== 0) {
          const node = root3.array[j++];
          nodes[i] = node;
        }
        bitmap = bitmap >>> 1;
      }
      return {
        type: ARRAY_NODE,
        size: n + 1,
        array: nodes
      };
    } else {
      const newArray = spliceIn(root3.array, idx, {
        type: ENTRY,
        k: key,
        v: val
      });
      addedLeaf.val = true;
      return {
        type: INDEX_NODE,
        bitmap: root3.bitmap | bit,
        array: newArray
      };
    }
  }
}
function assocCollision(root3, shift, hash, key, val, addedLeaf) {
  if (hash === root3.hash) {
    const idx = collisionIndexOf(root3, key);
    if (idx !== -1) {
      const entry = root3.array[idx];
      if (entry.v === val) {
        return root3;
      }
      return {
        type: COLLISION_NODE,
        hash,
        array: cloneAndSet(root3.array, idx, { type: ENTRY, k: key, v: val })
      };
    }
    const size2 = root3.array.length;
    addedLeaf.val = true;
    return {
      type: COLLISION_NODE,
      hash,
      array: cloneAndSet(root3.array, size2, { type: ENTRY, k: key, v: val })
    };
  }
  return assoc(
    {
      type: INDEX_NODE,
      bitmap: bitpos(root3.hash, shift),
      array: [root3]
    },
    shift,
    hash,
    key,
    val,
    addedLeaf
  );
}
function collisionIndexOf(root3, key) {
  const size2 = root3.array.length;
  for (let i = 0; i < size2; i++) {
    if (isEqual(key, root3.array[i].k)) {
      return i;
    }
  }
  return -1;
}
function find(root3, shift, hash, key) {
  switch (root3.type) {
    case ARRAY_NODE:
      return findArray(root3, shift, hash, key);
    case INDEX_NODE:
      return findIndex(root3, shift, hash, key);
    case COLLISION_NODE:
      return findCollision(root3, key);
  }
}
function findArray(root3, shift, hash, key) {
  const idx = mask(hash, shift);
  const node = root3.array[idx];
  if (node === void 0) {
    return void 0;
  }
  if (node.type !== ENTRY) {
    return find(node, shift + SHIFT, hash, key);
  }
  if (isEqual(key, node.k)) {
    return node;
  }
  return void 0;
}
function findIndex(root3, shift, hash, key) {
  const bit = bitpos(hash, shift);
  if ((root3.bitmap & bit) === 0) {
    return void 0;
  }
  const idx = index(root3.bitmap, bit);
  const node = root3.array[idx];
  if (node.type !== ENTRY) {
    return find(node, shift + SHIFT, hash, key);
  }
  if (isEqual(key, node.k)) {
    return node;
  }
  return void 0;
}
function findCollision(root3, key) {
  const idx = collisionIndexOf(root3, key);
  if (idx < 0) {
    return void 0;
  }
  return root3.array[idx];
}
function without(root3, shift, hash, key) {
  switch (root3.type) {
    case ARRAY_NODE:
      return withoutArray(root3, shift, hash, key);
    case INDEX_NODE:
      return withoutIndex(root3, shift, hash, key);
    case COLLISION_NODE:
      return withoutCollision(root3, key);
  }
}
function withoutArray(root3, shift, hash, key) {
  const idx = mask(hash, shift);
  const node = root3.array[idx];
  if (node === void 0) {
    return root3;
  }
  let n = void 0;
  if (node.type === ENTRY) {
    if (!isEqual(node.k, key)) {
      return root3;
    }
  } else {
    n = without(node, shift + SHIFT, hash, key);
    if (n === node) {
      return root3;
    }
  }
  if (n === void 0) {
    if (root3.size <= MIN_ARRAY_NODE) {
      const arr = root3.array;
      const out = new Array(root3.size - 1);
      let i = 0;
      let j = 0;
      let bitmap = 0;
      while (i < idx) {
        const nv = arr[i];
        if (nv !== void 0) {
          out[j] = nv;
          bitmap |= 1 << i;
          ++j;
        }
        ++i;
      }
      ++i;
      while (i < arr.length) {
        const nv = arr[i];
        if (nv !== void 0) {
          out[j] = nv;
          bitmap |= 1 << i;
          ++j;
        }
        ++i;
      }
      return {
        type: INDEX_NODE,
        bitmap,
        array: out
      };
    }
    return {
      type: ARRAY_NODE,
      size: root3.size - 1,
      array: cloneAndSet(root3.array, idx, n)
    };
  }
  return {
    type: ARRAY_NODE,
    size: root3.size,
    array: cloneAndSet(root3.array, idx, n)
  };
}
function withoutIndex(root3, shift, hash, key) {
  const bit = bitpos(hash, shift);
  if ((root3.bitmap & bit) === 0) {
    return root3;
  }
  const idx = index(root3.bitmap, bit);
  const node = root3.array[idx];
  if (node.type !== ENTRY) {
    const n = without(node, shift + SHIFT, hash, key);
    if (n === node) {
      return root3;
    }
    if (n !== void 0) {
      return {
        type: INDEX_NODE,
        bitmap: root3.bitmap,
        array: cloneAndSet(root3.array, idx, n)
      };
    }
    if (root3.bitmap === bit) {
      return void 0;
    }
    return {
      type: INDEX_NODE,
      bitmap: root3.bitmap ^ bit,
      array: spliceOut(root3.array, idx)
    };
  }
  if (isEqual(key, node.k)) {
    if (root3.bitmap === bit) {
      return void 0;
    }
    return {
      type: INDEX_NODE,
      bitmap: root3.bitmap ^ bit,
      array: spliceOut(root3.array, idx)
    };
  }
  return root3;
}
function withoutCollision(root3, key) {
  const idx = collisionIndexOf(root3, key);
  if (idx < 0) {
    return root3;
  }
  if (root3.array.length === 1) {
    return void 0;
  }
  return {
    type: COLLISION_NODE,
    hash: root3.hash,
    array: spliceOut(root3.array, idx)
  };
}
function forEach(root3, fn) {
  if (root3 === void 0) {
    return;
  }
  const items = root3.array;
  const size2 = items.length;
  for (let i = 0; i < size2; i++) {
    const item = items[i];
    if (item === void 0) {
      continue;
    }
    if (item.type === ENTRY) {
      fn(item.v, item.k);
      continue;
    }
    forEach(item, fn);
  }
}
var Dict = class _Dict {
  /**
   * @template V
   * @param {Record<string,V>} o
   * @returns {Dict<string,V>}
   */
  static fromObject(o) {
    const keys2 = Object.keys(o);
    let m = _Dict.new();
    for (let i = 0; i < keys2.length; i++) {
      const k = keys2[i];
      m = m.set(k, o[k]);
    }
    return m;
  }
  /**
   * @template K,V
   * @param {Map<K,V>} o
   * @returns {Dict<K,V>}
   */
  static fromMap(o) {
    let m = _Dict.new();
    o.forEach((v, k) => {
      m = m.set(k, v);
    });
    return m;
  }
  static new() {
    return new _Dict(void 0, 0);
  }
  /**
   * @param {undefined | Node<K,V>} root
   * @param {number} size
   */
  constructor(root3, size2) {
    this.root = root3;
    this.size = size2;
  }
  /**
   * @template NotFound
   * @param {K} key
   * @param {NotFound} notFound
   * @returns {NotFound | V}
   */
  get(key, notFound) {
    if (this.root === void 0) {
      return notFound;
    }
    const found = find(this.root, 0, getHash(key), key);
    if (found === void 0) {
      return notFound;
    }
    return found.v;
  }
  /**
   * @param {K} key
   * @param {V} val
   * @returns {Dict<K,V>}
   */
  set(key, val) {
    const addedLeaf = { val: false };
    const root3 = this.root === void 0 ? EMPTY : this.root;
    const newRoot = assoc(root3, 0, getHash(key), key, val, addedLeaf);
    if (newRoot === this.root) {
      return this;
    }
    return new _Dict(newRoot, addedLeaf.val ? this.size + 1 : this.size);
  }
  /**
   * @param {K} key
   * @returns {Dict<K,V>}
   */
  delete(key) {
    if (this.root === void 0) {
      return this;
    }
    const newRoot = without(this.root, 0, getHash(key), key);
    if (newRoot === this.root) {
      return this;
    }
    if (newRoot === void 0) {
      return _Dict.new();
    }
    return new _Dict(newRoot, this.size - 1);
  }
  /**
   * @param {K} key
   * @returns {boolean}
   */
  has(key) {
    if (this.root === void 0) {
      return false;
    }
    return find(this.root, 0, getHash(key), key) !== void 0;
  }
  /**
   * @returns {[K,V][]}
   */
  entries() {
    if (this.root === void 0) {
      return [];
    }
    const result = [];
    this.forEach((v, k) => result.push([k, v]));
    return result;
  }
  /**
   *
   * @param {(val:V,key:K)=>void} fn
   */
  forEach(fn) {
    forEach(this.root, fn);
  }
  hashCode() {
    let h = 0;
    this.forEach((v, k) => {
      h = h + hashMerge(getHash(v), getHash(k)) | 0;
    });
    return h;
  }
  /**
   * @param {unknown} o
   * @returns {boolean}
   */
  equals(o) {
    if (!(o instanceof _Dict) || this.size !== o.size) {
      return false;
    }
    try {
      this.forEach((v, k) => {
        if (!isEqual(o.get(k, !v), v)) {
          throw unequalDictSymbol;
        }
      });
      return true;
    } catch (e) {
      if (e === unequalDictSymbol) {
        return false;
      }
      throw e;
    }
  }
};
var unequalDictSymbol = /* @__PURE__ */ Symbol();

// build/dev/javascript/gleam_stdlib/gleam/order.mjs
var Lt = class extends CustomType {
};
var Eq = class extends CustomType {
};
var Gt = class extends CustomType {
};

// build/dev/javascript/gleam_stdlib/gleam/list.mjs
var Ascending = class extends CustomType {
};
var Descending = class extends CustomType {
};
function reverse_and_prepend(loop$prefix, loop$suffix) {
  while (true) {
    let prefix = loop$prefix;
    let suffix = loop$suffix;
    if (prefix instanceof Empty) {
      return suffix;
    } else {
      let first$1 = prefix.head;
      let rest$1 = prefix.tail;
      loop$prefix = rest$1;
      loop$suffix = prepend(first$1, suffix);
    }
  }
}
function reverse(list4) {
  return reverse_and_prepend(list4, toList([]));
}
function map_loop(loop$list, loop$fun, loop$acc) {
  while (true) {
    let list4 = loop$list;
    let fun = loop$fun;
    let acc = loop$acc;
    if (list4 instanceof Empty) {
      return reverse(acc);
    } else {
      let first$1 = list4.head;
      let rest$1 = list4.tail;
      loop$list = rest$1;
      loop$fun = fun;
      loop$acc = prepend(fun(first$1), acc);
    }
  }
}
function map(list4, fun) {
  return map_loop(list4, fun, toList([]));
}
function append_loop(loop$first, loop$second) {
  while (true) {
    let first = loop$first;
    let second2 = loop$second;
    if (first instanceof Empty) {
      return second2;
    } else {
      let first$1 = first.head;
      let rest$1 = first.tail;
      loop$first = rest$1;
      loop$second = prepend(first$1, second2);
    }
  }
}
function append(first, second2) {
  return append_loop(reverse(first), second2);
}
function fold(loop$list, loop$initial, loop$fun) {
  while (true) {
    let list4 = loop$list;
    let initial = loop$initial;
    let fun = loop$fun;
    if (list4 instanceof Empty) {
      return initial;
    } else {
      let first$1 = list4.head;
      let rest$1 = list4.tail;
      loop$list = rest$1;
      loop$initial = fun(initial, first$1);
      loop$fun = fun;
    }
  }
}
function find_map(loop$list, loop$fun) {
  while (true) {
    let list4 = loop$list;
    let fun = loop$fun;
    if (list4 instanceof Empty) {
      return new Error(void 0);
    } else {
      let first$1 = list4.head;
      let rest$1 = list4.tail;
      let $ = fun(first$1);
      if ($ instanceof Ok) {
        let first$2 = $[0];
        return new Ok(first$2);
      } else {
        loop$list = rest$1;
        loop$fun = fun;
      }
    }
  }
}
function sequences(loop$list, loop$compare, loop$growing, loop$direction, loop$prev, loop$acc) {
  while (true) {
    let list4 = loop$list;
    let compare5 = loop$compare;
    let growing = loop$growing;
    let direction = loop$direction;
    let prev = loop$prev;
    let acc = loop$acc;
    let growing$1 = prepend(prev, growing);
    if (list4 instanceof Empty) {
      if (direction instanceof Ascending) {
        return prepend(reverse(growing$1), acc);
      } else {
        return prepend(growing$1, acc);
      }
    } else {
      let new$1 = list4.head;
      let rest$1 = list4.tail;
      let $ = compare5(prev, new$1);
      if (direction instanceof Ascending) {
        if ($ instanceof Lt) {
          loop$list = rest$1;
          loop$compare = compare5;
          loop$growing = growing$1;
          loop$direction = direction;
          loop$prev = new$1;
          loop$acc = acc;
        } else if ($ instanceof Eq) {
          loop$list = rest$1;
          loop$compare = compare5;
          loop$growing = growing$1;
          loop$direction = direction;
          loop$prev = new$1;
          loop$acc = acc;
        } else {
          let _block;
          if (direction instanceof Ascending) {
            _block = prepend(reverse(growing$1), acc);
          } else {
            _block = prepend(growing$1, acc);
          }
          let acc$1 = _block;
          if (rest$1 instanceof Empty) {
            return prepend(toList([new$1]), acc$1);
          } else {
            let next = rest$1.head;
            let rest$2 = rest$1.tail;
            let _block$1;
            let $1 = compare5(new$1, next);
            if ($1 instanceof Lt) {
              _block$1 = new Ascending();
            } else if ($1 instanceof Eq) {
              _block$1 = new Ascending();
            } else {
              _block$1 = new Descending();
            }
            let direction$1 = _block$1;
            loop$list = rest$2;
            loop$compare = compare5;
            loop$growing = toList([new$1]);
            loop$direction = direction$1;
            loop$prev = next;
            loop$acc = acc$1;
          }
        }
      } else if ($ instanceof Lt) {
        let _block;
        if (direction instanceof Ascending) {
          _block = prepend(reverse(growing$1), acc);
        } else {
          _block = prepend(growing$1, acc);
        }
        let acc$1 = _block;
        if (rest$1 instanceof Empty) {
          return prepend(toList([new$1]), acc$1);
        } else {
          let next = rest$1.head;
          let rest$2 = rest$1.tail;
          let _block$1;
          let $1 = compare5(new$1, next);
          if ($1 instanceof Lt) {
            _block$1 = new Ascending();
          } else if ($1 instanceof Eq) {
            _block$1 = new Ascending();
          } else {
            _block$1 = new Descending();
          }
          let direction$1 = _block$1;
          loop$list = rest$2;
          loop$compare = compare5;
          loop$growing = toList([new$1]);
          loop$direction = direction$1;
          loop$prev = next;
          loop$acc = acc$1;
        }
      } else if ($ instanceof Eq) {
        let _block;
        if (direction instanceof Ascending) {
          _block = prepend(reverse(growing$1), acc);
        } else {
          _block = prepend(growing$1, acc);
        }
        let acc$1 = _block;
        if (rest$1 instanceof Empty) {
          return prepend(toList([new$1]), acc$1);
        } else {
          let next = rest$1.head;
          let rest$2 = rest$1.tail;
          let _block$1;
          let $1 = compare5(new$1, next);
          if ($1 instanceof Lt) {
            _block$1 = new Ascending();
          } else if ($1 instanceof Eq) {
            _block$1 = new Ascending();
          } else {
            _block$1 = new Descending();
          }
          let direction$1 = _block$1;
          loop$list = rest$2;
          loop$compare = compare5;
          loop$growing = toList([new$1]);
          loop$direction = direction$1;
          loop$prev = next;
          loop$acc = acc$1;
        }
      } else {
        loop$list = rest$1;
        loop$compare = compare5;
        loop$growing = growing$1;
        loop$direction = direction;
        loop$prev = new$1;
        loop$acc = acc;
      }
    }
  }
}
function merge_ascendings(loop$list1, loop$list2, loop$compare, loop$acc) {
  while (true) {
    let list1 = loop$list1;
    let list22 = loop$list2;
    let compare5 = loop$compare;
    let acc = loop$acc;
    if (list1 instanceof Empty) {
      let list4 = list22;
      return reverse_and_prepend(list4, acc);
    } else if (list22 instanceof Empty) {
      let list4 = list1;
      return reverse_and_prepend(list4, acc);
    } else {
      let first1 = list1.head;
      let rest1 = list1.tail;
      let first2 = list22.head;
      let rest2 = list22.tail;
      let $ = compare5(first1, first2);
      if ($ instanceof Lt) {
        loop$list1 = rest1;
        loop$list2 = list22;
        loop$compare = compare5;
        loop$acc = prepend(first1, acc);
      } else if ($ instanceof Eq) {
        loop$list1 = list1;
        loop$list2 = rest2;
        loop$compare = compare5;
        loop$acc = prepend(first2, acc);
      } else {
        loop$list1 = list1;
        loop$list2 = rest2;
        loop$compare = compare5;
        loop$acc = prepend(first2, acc);
      }
    }
  }
}
function merge_ascending_pairs(loop$sequences, loop$compare, loop$acc) {
  while (true) {
    let sequences2 = loop$sequences;
    let compare5 = loop$compare;
    let acc = loop$acc;
    if (sequences2 instanceof Empty) {
      return reverse(acc);
    } else {
      let $ = sequences2.tail;
      if ($ instanceof Empty) {
        let sequence = sequences2.head;
        return reverse(prepend(reverse(sequence), acc));
      } else {
        let ascending1 = sequences2.head;
        let ascending2 = $.head;
        let rest$1 = $.tail;
        let descending = merge_ascendings(
          ascending1,
          ascending2,
          compare5,
          toList([])
        );
        loop$sequences = rest$1;
        loop$compare = compare5;
        loop$acc = prepend(descending, acc);
      }
    }
  }
}
function merge_descendings(loop$list1, loop$list2, loop$compare, loop$acc) {
  while (true) {
    let list1 = loop$list1;
    let list22 = loop$list2;
    let compare5 = loop$compare;
    let acc = loop$acc;
    if (list1 instanceof Empty) {
      let list4 = list22;
      return reverse_and_prepend(list4, acc);
    } else if (list22 instanceof Empty) {
      let list4 = list1;
      return reverse_and_prepend(list4, acc);
    } else {
      let first1 = list1.head;
      let rest1 = list1.tail;
      let first2 = list22.head;
      let rest2 = list22.tail;
      let $ = compare5(first1, first2);
      if ($ instanceof Lt) {
        loop$list1 = list1;
        loop$list2 = rest2;
        loop$compare = compare5;
        loop$acc = prepend(first2, acc);
      } else if ($ instanceof Eq) {
        loop$list1 = rest1;
        loop$list2 = list22;
        loop$compare = compare5;
        loop$acc = prepend(first1, acc);
      } else {
        loop$list1 = rest1;
        loop$list2 = list22;
        loop$compare = compare5;
        loop$acc = prepend(first1, acc);
      }
    }
  }
}
function merge_descending_pairs(loop$sequences, loop$compare, loop$acc) {
  while (true) {
    let sequences2 = loop$sequences;
    let compare5 = loop$compare;
    let acc = loop$acc;
    if (sequences2 instanceof Empty) {
      return reverse(acc);
    } else {
      let $ = sequences2.tail;
      if ($ instanceof Empty) {
        let sequence = sequences2.head;
        return reverse(prepend(reverse(sequence), acc));
      } else {
        let descending1 = sequences2.head;
        let descending2 = $.head;
        let rest$1 = $.tail;
        let ascending = merge_descendings(
          descending1,
          descending2,
          compare5,
          toList([])
        );
        loop$sequences = rest$1;
        loop$compare = compare5;
        loop$acc = prepend(ascending, acc);
      }
    }
  }
}
function merge_all(loop$sequences, loop$direction, loop$compare) {
  while (true) {
    let sequences2 = loop$sequences;
    let direction = loop$direction;
    let compare5 = loop$compare;
    if (sequences2 instanceof Empty) {
      return toList([]);
    } else if (direction instanceof Ascending) {
      let $ = sequences2.tail;
      if ($ instanceof Empty) {
        let sequence = sequences2.head;
        return sequence;
      } else {
        let sequences$1 = merge_ascending_pairs(sequences2, compare5, toList([]));
        loop$sequences = sequences$1;
        loop$direction = new Descending();
        loop$compare = compare5;
      }
    } else {
      let $ = sequences2.tail;
      if ($ instanceof Empty) {
        let sequence = sequences2.head;
        return reverse(sequence);
      } else {
        let sequences$1 = merge_descending_pairs(sequences2, compare5, toList([]));
        loop$sequences = sequences$1;
        loop$direction = new Ascending();
        loop$compare = compare5;
      }
    }
  }
}
function sort(list4, compare5) {
  if (list4 instanceof Empty) {
    return toList([]);
  } else {
    let $ = list4.tail;
    if ($ instanceof Empty) {
      let x = list4.head;
      return toList([x]);
    } else {
      let x = list4.head;
      let y = $.head;
      let rest$1 = $.tail;
      let _block;
      let $1 = compare5(x, y);
      if ($1 instanceof Lt) {
        _block = new Ascending();
      } else if ($1 instanceof Eq) {
        _block = new Ascending();
      } else {
        _block = new Descending();
      }
      let direction = _block;
      let sequences$1 = sequences(
        rest$1,
        compare5,
        toList([x]),
        direction,
        y,
        toList([])
      );
      return merge_all(sequences$1, new Ascending(), compare5);
    }
  }
}
function key_find(keyword_list, desired_key) {
  return find_map(
    keyword_list,
    (keyword) => {
      let key = keyword[0];
      let value2 = keyword[1];
      let $ = isEqual(key, desired_key);
      if ($) {
        return new Ok(value2);
      } else {
        return new Error(void 0);
      }
    }
  );
}

// build/dev/javascript/gleam_stdlib/gleam/string.mjs
function slice(string5, idx, len) {
  let $ = len < 0;
  if ($) {
    return "";
  } else {
    let $1 = idx < 0;
    if ($1) {
      let translated_idx = string_length(string5) + idx;
      let $2 = translated_idx < 0;
      if ($2) {
        return "";
      } else {
        return string_slice(string5, translated_idx, len);
      }
    } else {
      return string_slice(string5, idx, len);
    }
  }
}
function concat_loop(loop$strings, loop$accumulator) {
  while (true) {
    let strings = loop$strings;
    let accumulator = loop$accumulator;
    if (strings instanceof Empty) {
      return accumulator;
    } else {
      let string5 = strings.head;
      let strings$1 = strings.tail;
      loop$strings = strings$1;
      loop$accumulator = accumulator + string5;
    }
  }
}
function concat2(strings) {
  return concat_loop(strings, "");
}
function split2(x, substring) {
  if (substring === "") {
    return graphemes(x);
  } else {
    let _pipe = x;
    let _pipe$1 = identity(_pipe);
    let _pipe$2 = split(_pipe$1, substring);
    return map(_pipe$2, identity);
  }
}

// build/dev/javascript/gleam_stdlib/gleam/dynamic/decode.mjs
var DecodeError = class extends CustomType {
  constructor(expected, found, path) {
    super();
    this.expected = expected;
    this.found = found;
    this.path = path;
  }
};
var Decoder = class extends CustomType {
  constructor(function$) {
    super();
    this.function = function$;
  }
};
function run(data, decoder) {
  let $ = decoder.function(data);
  let maybe_invalid_data = $[0];
  let errors = $[1];
  if (errors instanceof Empty) {
    return new Ok(maybe_invalid_data);
  } else {
    return new Error(errors);
  }
}
function success(data) {
  return new Decoder((_) => {
    return [data, toList([])];
  });
}
function map2(decoder, transformer) {
  return new Decoder(
    (d) => {
      let $ = decoder.function(d);
      let data = $[0];
      let errors = $[1];
      return [transformer(data), errors];
    }
  );
}
function run_decoders(loop$data, loop$failure, loop$decoders) {
  while (true) {
    let data = loop$data;
    let failure2 = loop$failure;
    let decoders = loop$decoders;
    if (decoders instanceof Empty) {
      return failure2;
    } else {
      let decoder = decoders.head;
      let decoders$1 = decoders.tail;
      let $ = decoder.function(data);
      let layer = $;
      let errors = $[1];
      if (errors instanceof Empty) {
        return layer;
      } else {
        loop$data = data;
        loop$failure = failure2;
        loop$decoders = decoders$1;
      }
    }
  }
}
function one_of(first, alternatives) {
  return new Decoder(
    (dynamic_data) => {
      let $ = first.function(dynamic_data);
      let layer = $;
      let errors = $[1];
      if (errors instanceof Empty) {
        return layer;
      } else {
        return run_decoders(dynamic_data, layer, alternatives);
      }
    }
  );
}
function optional(inner) {
  return new Decoder(
    (data) => {
      let $ = is_null(data);
      if ($) {
        return [new None(), toList([])];
      } else {
        let $1 = inner.function(data);
        let data$1 = $1[0];
        let errors = $1[1];
        return [new Some(data$1), errors];
      }
    }
  );
}
function run_dynamic_function(data, name, f) {
  let $ = f(data);
  if ($ instanceof Ok) {
    let data$1 = $[0];
    return [data$1, toList([])];
  } else {
    let zero = $[0];
    return [
      zero,
      toList([new DecodeError(name, classify_dynamic(data), toList([]))])
    ];
  }
}
function decode_int(data) {
  return run_dynamic_function(data, "Int", int);
}
function decode_float(data) {
  return run_dynamic_function(data, "Float", float);
}
var int2 = /* @__PURE__ */ new Decoder(decode_int);
var float2 = /* @__PURE__ */ new Decoder(decode_float);
function decode_string(data) {
  return run_dynamic_function(data, "String", string);
}
var string2 = /* @__PURE__ */ new Decoder(decode_string);
function list2(inner) {
  return new Decoder(
    (data) => {
      return list(
        data,
        inner.function,
        (p2, k) => {
          return push_path(p2, toList([k]));
        },
        0,
        toList([])
      );
    }
  );
}
function push_path(layer, path) {
  let decoder = one_of(
    string2,
    toList([
      (() => {
        let _pipe = int2;
        return map2(_pipe, to_string);
      })()
    ])
  );
  let path$1 = map(
    path,
    (key) => {
      let key$1 = identity(key);
      let $ = run(key$1, decoder);
      if ($ instanceof Ok) {
        let key$2 = $[0];
        return key$2;
      } else {
        return "<" + classify_dynamic(key$1) + ">";
      }
    }
  );
  let errors = map(
    layer[1],
    (error) => {
      let _record = error;
      return new DecodeError(
        _record.expected,
        _record.found,
        append(path$1, error.path)
      );
    }
  );
  return [layer[0], errors];
}
function index3(loop$path, loop$position, loop$inner, loop$data, loop$handle_miss) {
  while (true) {
    let path = loop$path;
    let position = loop$position;
    let inner = loop$inner;
    let data = loop$data;
    let handle_miss = loop$handle_miss;
    if (path instanceof Empty) {
      let _pipe = inner(data);
      return push_path(_pipe, reverse(position));
    } else {
      let key = path.head;
      let path$1 = path.tail;
      let $ = index2(data, key);
      if ($ instanceof Ok) {
        let $1 = $[0];
        if ($1 instanceof Some) {
          let data$1 = $1[0];
          loop$path = path$1;
          loop$position = prepend(key, position);
          loop$inner = inner;
          loop$data = data$1;
          loop$handle_miss = handle_miss;
        } else {
          return handle_miss(data, prepend(key, position));
        }
      } else {
        let kind = $[0];
        let $1 = inner(data);
        let default$ = $1[0];
        let _pipe = [
          default$,
          toList([new DecodeError(kind, classify_dynamic(data), toList([]))])
        ];
        return push_path(_pipe, reverse(position));
      }
    }
  }
}
function subfield(field_path, field_decoder, next) {
  return new Decoder(
    (data) => {
      let $ = index3(
        field_path,
        toList([]),
        field_decoder.function,
        data,
        (data2, position) => {
          let $12 = field_decoder.function(data2);
          let default$ = $12[0];
          let _pipe = [
            default$,
            toList([new DecodeError("Field", "Nothing", toList([]))])
          ];
          return push_path(_pipe, reverse(position));
        }
      );
      let out = $[0];
      let errors1 = $[1];
      let $1 = next(out).function(data);
      let out$1 = $1[0];
      let errors2 = $1[1];
      return [out$1, append(errors1, errors2)];
    }
  );
}
function field(field_name, field_decoder, next) {
  return subfield(toList([field_name]), field_decoder, next);
}

// build/dev/javascript/gleam_stdlib/gleam_stdlib.mjs
var Nil = void 0;
var NOT_FOUND = {};
function identity(x) {
  return x;
}
function to_string(term) {
  return term.toString();
}
function string_length(string5) {
  if (string5 === "") {
    return 0;
  }
  const iterator = graphemes_iterator(string5);
  if (iterator) {
    let i = 0;
    for (const _ of iterator) {
      i++;
    }
    return i;
  } else {
    return string5.match(/./gsu).length;
  }
}
function graphemes(string5) {
  const iterator = graphemes_iterator(string5);
  if (iterator) {
    return List.fromArray(Array.from(iterator).map((item) => item.segment));
  } else {
    return List.fromArray(string5.match(/./gsu));
  }
}
var segmenter = void 0;
function graphemes_iterator(string5) {
  if (globalThis.Intl && Intl.Segmenter) {
    segmenter ||= new Intl.Segmenter();
    return segmenter.segment(string5)[Symbol.iterator]();
  }
}
function pop_codeunit(str) {
  return [str.charCodeAt(0) | 0, str.slice(1)];
}
function lowercase(string5) {
  return string5.toLowerCase();
}
function split(xs, pattern) {
  return List.fromArray(xs.split(pattern));
}
function string_slice(string5, idx, len) {
  if (len <= 0 || idx >= string5.length) {
    return "";
  }
  const iterator = graphemes_iterator(string5);
  if (iterator) {
    while (idx-- > 0) {
      iterator.next();
    }
    let result = "";
    while (len-- > 0) {
      const v = iterator.next().value;
      if (v === void 0) {
        break;
      }
      result += v.segment;
    }
    return result;
  } else {
    return string5.match(/./gsu).slice(idx, idx + len).join("");
  }
}
function string_codeunit_slice(str, from2, length4) {
  return str.slice(from2, from2 + length4);
}
function starts_with(haystack, needle) {
  return haystack.startsWith(needle);
}
var unicode_whitespaces = [
  " ",
  // Space
  "	",
  // Horizontal tab
  "\n",
  // Line feed
  "\v",
  // Vertical tab
  "\f",
  // Form feed
  "\r",
  // Carriage return
  "\x85",
  // Next line
  "\u2028",
  // Line separator
  "\u2029"
  // Paragraph separator
].join("");
var trim_start_regex = /* @__PURE__ */ new RegExp(
  `^[${unicode_whitespaces}]*`
);
var trim_end_regex = /* @__PURE__ */ new RegExp(`[${unicode_whitespaces}]*$`);
function new_map() {
  return Dict.new();
}
function map_get(map6, key) {
  const value2 = map6.get(key, NOT_FOUND);
  if (value2 === NOT_FOUND) {
    return new Error(Nil);
  }
  return new Ok(value2);
}
function map_insert(key, value2, map6) {
  return map6.set(key, value2);
}
function percent_encode(string5) {
  return encodeURIComponent(string5).replace("%2B", "+");
}
function classify_dynamic(data) {
  if (typeof data === "string") {
    return "String";
  } else if (typeof data === "boolean") {
    return "Bool";
  } else if (data instanceof Result) {
    return "Result";
  } else if (data instanceof List) {
    return "List";
  } else if (data instanceof BitArray) {
    return "BitArray";
  } else if (data instanceof Dict) {
    return "Dict";
  } else if (Number.isInteger(data)) {
    return "Int";
  } else if (Array.isArray(data)) {
    return `Array`;
  } else if (typeof data === "number") {
    return "Float";
  } else if (data === null) {
    return "Nil";
  } else if (data === void 0) {
    return "Nil";
  } else {
    const type = typeof data;
    return type.charAt(0).toUpperCase() + type.slice(1);
  }
}
function index2(data, key) {
  if (data instanceof Dict || data instanceof WeakMap || data instanceof Map) {
    const token2 = {};
    const entry = data.get(key, token2);
    if (entry === token2) return new Ok(new None());
    return new Ok(new Some(entry));
  }
  const key_is_int = Number.isInteger(key);
  if (key_is_int && key >= 0 && key < 8 && data instanceof List) {
    let i = 0;
    for (const value2 of data) {
      if (i === key) return new Ok(new Some(value2));
      i++;
    }
    return new Error("Indexable");
  }
  if (key_is_int && Array.isArray(data) || data && typeof data === "object" || data && Object.getPrototypeOf(data) === Object.prototype) {
    if (key in data) return new Ok(new Some(data[key]));
    return new Ok(new None());
  }
  return new Error(key_is_int ? "Indexable" : "Dict");
}
function list(data, decode2, pushPath, index5, emptyList) {
  if (!(data instanceof List || Array.isArray(data))) {
    const error = new DecodeError("List", classify_dynamic(data), emptyList);
    return [emptyList, List.fromArray([error])];
  }
  const decoded = [];
  for (const element3 of data) {
    const layer = decode2(element3);
    const [out, errors] = layer;
    if (errors instanceof NonEmpty) {
      const [_, errors2] = pushPath(layer, index5.toString());
      return [emptyList, errors2];
    }
    decoded.push(out);
    index5++;
  }
  return [List.fromArray(decoded), emptyList];
}
function float(data) {
  if (typeof data === "number") return new Ok(data);
  return new Error(0);
}
function int(data) {
  if (Number.isInteger(data)) return new Ok(data);
  return new Error(0);
}
function string(data) {
  if (typeof data === "string") return new Ok(data);
  return new Error("");
}
function is_null(data) {
  return data === null || data === void 0;
}

// build/dev/javascript/gleam_stdlib/gleam/dict.mjs
function insert(dict2, key, value2) {
  return map_insert(key, value2, dict2);
}

// build/dev/javascript/gleam_stdlib/gleam/result.mjs
function is_ok(result) {
  if (result instanceof Ok) {
    return true;
  } else {
    return false;
  }
}
function map3(result, fun) {
  if (result instanceof Ok) {
    let x = result[0];
    return new Ok(fun(x));
  } else {
    let e = result[0];
    return new Error(e);
  }
}
function map_error(result, fun) {
  if (result instanceof Ok) {
    let x = result[0];
    return new Ok(x);
  } else {
    let error = result[0];
    return new Error(fun(error));
  }
}
function try$(result, fun) {
  if (result instanceof Ok) {
    let x = result[0];
    return fun(x);
  } else {
    let e = result[0];
    return new Error(e);
  }
}
function then$(result, fun) {
  return try$(result, fun);
}
function unwrap_both(result) {
  if (result instanceof Ok) {
    let a = result[0];
    return a;
  } else {
    let a = result[0];
    return a;
  }
}
function replace_error(result, error) {
  if (result instanceof Ok) {
    let x = result[0];
    return new Ok(x);
  } else {
    return new Error(error);
  }
}

// build/dev/javascript/gleam_stdlib/gleam/bool.mjs
function guard(requirement, consequence, alternative) {
  if (requirement) {
    return consequence;
  } else {
    return alternative();
  }
}

// build/dev/javascript/gleam_stdlib/gleam/function.mjs
function identity2(x) {
  return x;
}

// build/dev/javascript/gleam_json/gleam_json_ffi.mjs
function identity3(x) {
  return x;
}
function decode(string5) {
  try {
    const result = JSON.parse(string5);
    return new Ok(result);
  } catch (err) {
    return new Error(getJsonDecodeError(err, string5));
  }
}
function getJsonDecodeError(stdErr, json2) {
  if (isUnexpectedEndOfInput(stdErr)) return new UnexpectedEndOfInput();
  return toUnexpectedByteError(stdErr, json2);
}
function isUnexpectedEndOfInput(err) {
  const unexpectedEndOfInputRegex = /((unexpected (end|eof))|(end of data)|(unterminated string)|(json( parse error|\.parse)\: expected '(\:|\}|\])'))/i;
  return unexpectedEndOfInputRegex.test(err.message);
}
function toUnexpectedByteError(err, json2) {
  let converters = [
    v8UnexpectedByteError,
    oldV8UnexpectedByteError,
    jsCoreUnexpectedByteError,
    spidermonkeyUnexpectedByteError
  ];
  for (let converter of converters) {
    let result = converter(err, json2);
    if (result) return result;
  }
  return new UnexpectedByte("", 0);
}
function v8UnexpectedByteError(err) {
  const regex = /unexpected token '(.)', ".+" is not valid JSON/i;
  const match = regex.exec(err.message);
  if (!match) return null;
  const byte = toHex(match[1]);
  return new UnexpectedByte(byte, -1);
}
function oldV8UnexpectedByteError(err) {
  const regex = /unexpected token (.) in JSON at position (\d+)/i;
  const match = regex.exec(err.message);
  if (!match) return null;
  const byte = toHex(match[1]);
  const position = Number(match[2]);
  return new UnexpectedByte(byte, position);
}
function spidermonkeyUnexpectedByteError(err, json2) {
  const regex = /(unexpected character|expected .*) at line (\d+) column (\d+)/i;
  const match = regex.exec(err.message);
  if (!match) return null;
  const line = Number(match[2]);
  const column = Number(match[3]);
  const position = getPositionFromMultiline(line, column, json2);
  const byte = toHex(json2[position]);
  return new UnexpectedByte(byte, position);
}
function jsCoreUnexpectedByteError(err) {
  const regex = /unexpected (identifier|token) "(.)"/i;
  const match = regex.exec(err.message);
  if (!match) return null;
  const byte = toHex(match[2]);
  return new UnexpectedByte(byte, 0);
}
function toHex(char) {
  return "0x" + char.charCodeAt(0).toString(16).toUpperCase();
}
function getPositionFromMultiline(line, column, string5) {
  if (line === 1) return column - 1;
  let currentLn = 1;
  let position = 0;
  string5.split("").find((char, idx) => {
    if (char === "\n") currentLn += 1;
    if (currentLn === line) {
      position = idx + column;
      return true;
    }
    return false;
  });
  return position;
}

// build/dev/javascript/gleam_json/gleam/json.mjs
var UnexpectedEndOfInput = class extends CustomType {
};
var UnexpectedByte = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var UnableToDecode = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
function do_parse(json2, decoder) {
  return try$(
    decode(json2),
    (dynamic_value) => {
      let _pipe = run(dynamic_value, decoder);
      return map_error(
        _pipe,
        (var0) => {
          return new UnableToDecode(var0);
        }
      );
    }
  );
}
function parse(json2, decoder) {
  return do_parse(json2, decoder);
}
function bool(input2) {
  return identity3(input2);
}

// build/dev/javascript/gleam_stdlib/gleam/set.mjs
var Set2 = class extends CustomType {
  constructor(dict2) {
    super();
    this.dict = dict2;
  }
};
function new$() {
  return new Set2(new_map());
}
function contains(set2, member) {
  let _pipe = set2.dict;
  let _pipe$1 = map_get(_pipe, member);
  return is_ok(_pipe$1);
}
var token = void 0;
function insert2(set2, member) {
  return new Set2(insert(set2.dict, member, token));
}

// build/dev/javascript/lustre/lustre/internals/constants.ffi.mjs
var EMPTY_DICT = /* @__PURE__ */ Dict.new();
var EMPTY_SET = /* @__PURE__ */ new$();
var empty_dict = () => EMPTY_DICT;
var empty_set = () => EMPTY_SET;
var document = () => globalThis?.document;
var NAMESPACE_HTML = "http://www.w3.org/1999/xhtml";
var ELEMENT_NODE = 1;
var TEXT_NODE = 3;
var DOCUMENT_FRAGMENT_NODE = 11;
var SUPPORTS_MOVE_BEFORE = !!globalThis.HTMLElement?.prototype?.moveBefore;

// build/dev/javascript/lustre/lustre/internals/constants.mjs
var empty_list = /* @__PURE__ */ toList([]);
var option_none = /* @__PURE__ */ new None();

// build/dev/javascript/lustre/lustre/vdom/vattr.ffi.mjs
var GT = /* @__PURE__ */ new Gt();
var LT = /* @__PURE__ */ new Lt();
var EQ = /* @__PURE__ */ new Eq();
function compare3(a, b) {
  if (a.name === b.name) {
    return EQ;
  } else if (a.name < b.name) {
    return LT;
  } else {
    return GT;
  }
}

// build/dev/javascript/lustre/lustre/vdom/vattr.mjs
var Attribute = class extends CustomType {
  constructor(kind, name, value2) {
    super();
    this.kind = kind;
    this.name = name;
    this.value = value2;
  }
};
var Property = class extends CustomType {
  constructor(kind, name, value2) {
    super();
    this.kind = kind;
    this.name = name;
    this.value = value2;
  }
};
var Event2 = class extends CustomType {
  constructor(kind, name, handler, include, prevent_default, stop_propagation, immediate2, debounce, throttle) {
    super();
    this.kind = kind;
    this.name = name;
    this.handler = handler;
    this.include = include;
    this.prevent_default = prevent_default;
    this.stop_propagation = stop_propagation;
    this.immediate = immediate2;
    this.debounce = debounce;
    this.throttle = throttle;
  }
};
var Handler = class extends CustomType {
  constructor(prevent_default, stop_propagation, message2) {
    super();
    this.prevent_default = prevent_default;
    this.stop_propagation = stop_propagation;
    this.message = message2;
  }
};
var Never = class extends CustomType {
  constructor(kind) {
    super();
    this.kind = kind;
  }
};
function merge(loop$attributes, loop$merged) {
  while (true) {
    let attributes = loop$attributes;
    let merged = loop$merged;
    if (attributes instanceof Empty) {
      return merged;
    } else {
      let $ = attributes.head;
      if ($ instanceof Attribute) {
        let $1 = $.name;
        if ($1 === "") {
          let rest = attributes.tail;
          loop$attributes = rest;
          loop$merged = merged;
        } else if ($1 === "class") {
          let $2 = $.value;
          if ($2 === "") {
            let rest = attributes.tail;
            loop$attributes = rest;
            loop$merged = merged;
          } else {
            let $3 = attributes.tail;
            if ($3 instanceof Empty) {
              let attribute$1 = $;
              let rest = $3;
              loop$attributes = rest;
              loop$merged = prepend(attribute$1, merged);
            } else {
              let $4 = $3.head;
              if ($4 instanceof Attribute) {
                let $5 = $4.name;
                if ($5 === "class") {
                  let kind = $.kind;
                  let class1 = $2;
                  let rest = $3.tail;
                  let class2 = $4.value;
                  let value2 = class1 + " " + class2;
                  let attribute$1 = new Attribute(kind, "class", value2);
                  loop$attributes = prepend(attribute$1, rest);
                  loop$merged = merged;
                } else {
                  let attribute$1 = $;
                  let rest = $3;
                  loop$attributes = rest;
                  loop$merged = prepend(attribute$1, merged);
                }
              } else {
                let attribute$1 = $;
                let rest = $3;
                loop$attributes = rest;
                loop$merged = prepend(attribute$1, merged);
              }
            }
          }
        } else if ($1 === "style") {
          let $2 = $.value;
          if ($2 === "") {
            let rest = attributes.tail;
            loop$attributes = rest;
            loop$merged = merged;
          } else {
            let $3 = attributes.tail;
            if ($3 instanceof Empty) {
              let attribute$1 = $;
              let rest = $3;
              loop$attributes = rest;
              loop$merged = prepend(attribute$1, merged);
            } else {
              let $4 = $3.head;
              if ($4 instanceof Attribute) {
                let $5 = $4.name;
                if ($5 === "style") {
                  let kind = $.kind;
                  let style1 = $2;
                  let rest = $3.tail;
                  let style2 = $4.value;
                  let value2 = style1 + ";" + style2;
                  let attribute$1 = new Attribute(kind, "style", value2);
                  loop$attributes = prepend(attribute$1, rest);
                  loop$merged = merged;
                } else {
                  let attribute$1 = $;
                  let rest = $3;
                  loop$attributes = rest;
                  loop$merged = prepend(attribute$1, merged);
                }
              } else {
                let attribute$1 = $;
                let rest = $3;
                loop$attributes = rest;
                loop$merged = prepend(attribute$1, merged);
              }
            }
          }
        } else {
          let attribute$1 = $;
          let rest = attributes.tail;
          loop$attributes = rest;
          loop$merged = prepend(attribute$1, merged);
        }
      } else {
        let attribute$1 = $;
        let rest = attributes.tail;
        loop$attributes = rest;
        loop$merged = prepend(attribute$1, merged);
      }
    }
  }
}
function prepare(attributes) {
  if (attributes instanceof Empty) {
    return attributes;
  } else {
    let $ = attributes.tail;
    if ($ instanceof Empty) {
      return attributes;
    } else {
      let _pipe = attributes;
      let _pipe$1 = sort(_pipe, (a, b) => {
        return compare3(b, a);
      });
      return merge(_pipe$1, empty_list);
    }
  }
}
var attribute_kind = 0;
function attribute(name, value2) {
  return new Attribute(attribute_kind, name, value2);
}
var property_kind = 1;
function property(name, value2) {
  return new Property(property_kind, name, value2);
}
var event_kind = 2;
function event(name, handler, include, prevent_default, stop_propagation, immediate2, debounce, throttle) {
  return new Event2(
    event_kind,
    name,
    handler,
    include,
    prevent_default,
    stop_propagation,
    immediate2,
    debounce,
    throttle
  );
}
var never_kind = 0;
var never = /* @__PURE__ */ new Never(never_kind);
var always_kind = 2;

// build/dev/javascript/lustre/lustre/attribute.mjs
function attribute2(name, value2) {
  return attribute(name, value2);
}
function property2(name, value2) {
  return property(name, value2);
}
function boolean_attribute(name, value2) {
  if (value2) {
    return attribute2(name, "");
  } else {
    return property2(name, bool(false));
  }
}
function class$(name) {
  return attribute2("class", name);
}
function alt(text3) {
  return attribute2("alt", text3);
}
function src(url) {
  return attribute2("src", url);
}
function disabled(is_disabled) {
  return boolean_attribute("disabled", is_disabled);
}
function placeholder(text3) {
  return attribute2("placeholder", text3);
}
function type_(control_type) {
  return attribute2("type", control_type);
}
function value(control_value) {
  return attribute2("value", control_value);
}

// build/dev/javascript/lustre/lustre/effect.mjs
var Effect = class extends CustomType {
  constructor(synchronous, before_paint2, after_paint) {
    super();
    this.synchronous = synchronous;
    this.before_paint = before_paint2;
    this.after_paint = after_paint;
  }
};
var empty = /* @__PURE__ */ new Effect(
  /* @__PURE__ */ toList([]),
  /* @__PURE__ */ toList([]),
  /* @__PURE__ */ toList([])
);
function none() {
  return empty;
}
function from(effect) {
  let task = (actions) => {
    let dispatch = actions.dispatch;
    return effect(dispatch);
  };
  let _record = empty;
  return new Effect(toList([task]), _record.before_paint, _record.after_paint);
}

// build/dev/javascript/lustre/lustre/internals/mutable_map.ffi.mjs
function empty2() {
  return null;
}
function get2(map6, key) {
  const value2 = map6?.get(key);
  if (value2 != null) {
    return new Ok(value2);
  } else {
    return new Error(void 0);
  }
}
function insert3(map6, key, value2) {
  map6 ??= /* @__PURE__ */ new Map();
  map6.set(key, value2);
  return map6;
}
function remove(map6, key) {
  map6?.delete(key);
  return map6;
}

// build/dev/javascript/lustre/lustre/vdom/path.mjs
var Root = class extends CustomType {
};
var Key = class extends CustomType {
  constructor(key, parent) {
    super();
    this.key = key;
    this.parent = parent;
  }
};
var Index = class extends CustomType {
  constructor(index5, parent) {
    super();
    this.index = index5;
    this.parent = parent;
  }
};
function do_matches(loop$path, loop$candidates) {
  while (true) {
    let path = loop$path;
    let candidates = loop$candidates;
    if (candidates instanceof Empty) {
      return false;
    } else {
      let candidate = candidates.head;
      let rest = candidates.tail;
      let $ = starts_with(path, candidate);
      if ($) {
        return true;
      } else {
        loop$path = path;
        loop$candidates = rest;
      }
    }
  }
}
function add2(parent, index5, key) {
  if (key === "") {
    return new Index(index5, parent);
  } else {
    return new Key(key, parent);
  }
}
var root2 = /* @__PURE__ */ new Root();
var separator_element = "	";
function do_to_string(loop$path, loop$acc) {
  while (true) {
    let path = loop$path;
    let acc = loop$acc;
    if (path instanceof Root) {
      if (acc instanceof Empty) {
        return "";
      } else {
        let segments = acc.tail;
        return concat2(segments);
      }
    } else if (path instanceof Key) {
      let key = path.key;
      let parent = path.parent;
      loop$path = parent;
      loop$acc = prepend(separator_element, prepend(key, acc));
    } else {
      let index5 = path.index;
      let parent = path.parent;
      loop$path = parent;
      loop$acc = prepend(
        separator_element,
        prepend(to_string(index5), acc)
      );
    }
  }
}
function to_string2(path) {
  return do_to_string(path, toList([]));
}
function matches(path, candidates) {
  if (candidates instanceof Empty) {
    return false;
  } else {
    return do_matches(to_string2(path), candidates);
  }
}
var separator_event = "\n";
function event2(path, event4) {
  return do_to_string(path, toList([separator_event, event4]));
}

// build/dev/javascript/lustre/lustre/vdom/vnode.mjs
var Fragment = class extends CustomType {
  constructor(kind, key, mapper, children, keyed_children, children_count) {
    super();
    this.kind = kind;
    this.key = key;
    this.mapper = mapper;
    this.children = children;
    this.keyed_children = keyed_children;
    this.children_count = children_count;
  }
};
var Element = class extends CustomType {
  constructor(kind, key, mapper, namespace, tag, attributes, children, keyed_children, self_closing, void$) {
    super();
    this.kind = kind;
    this.key = key;
    this.mapper = mapper;
    this.namespace = namespace;
    this.tag = tag;
    this.attributes = attributes;
    this.children = children;
    this.keyed_children = keyed_children;
    this.self_closing = self_closing;
    this.void = void$;
  }
};
var Text = class extends CustomType {
  constructor(kind, key, mapper, content) {
    super();
    this.kind = kind;
    this.key = key;
    this.mapper = mapper;
    this.content = content;
  }
};
var UnsafeInnerHtml = class extends CustomType {
  constructor(kind, key, mapper, namespace, tag, attributes, inner_html) {
    super();
    this.kind = kind;
    this.key = key;
    this.mapper = mapper;
    this.namespace = namespace;
    this.tag = tag;
    this.attributes = attributes;
    this.inner_html = inner_html;
  }
};
function is_void_element(tag, namespace) {
  if (namespace === "") {
    if (tag === "area") {
      return true;
    } else if (tag === "base") {
      return true;
    } else if (tag === "br") {
      return true;
    } else if (tag === "col") {
      return true;
    } else if (tag === "embed") {
      return true;
    } else if (tag === "hr") {
      return true;
    } else if (tag === "img") {
      return true;
    } else if (tag === "input") {
      return true;
    } else if (tag === "link") {
      return true;
    } else if (tag === "meta") {
      return true;
    } else if (tag === "param") {
      return true;
    } else if (tag === "source") {
      return true;
    } else if (tag === "track") {
      return true;
    } else if (tag === "wbr") {
      return true;
    } else {
      return false;
    }
  } else {
    return false;
  }
}
function advance(node) {
  if (node instanceof Fragment) {
    let children_count = node.children_count;
    return 1 + children_count;
  } else {
    return 1;
  }
}
var fragment_kind = 0;
function fragment(key, mapper, children, keyed_children, children_count) {
  return new Fragment(
    fragment_kind,
    key,
    mapper,
    children,
    keyed_children,
    children_count
  );
}
var element_kind = 1;
function element(key, mapper, namespace, tag, attributes, children, keyed_children, self_closing, void$) {
  return new Element(
    element_kind,
    key,
    mapper,
    namespace,
    tag,
    prepare(attributes),
    children,
    keyed_children,
    self_closing,
    void$ || is_void_element(tag, namespace)
  );
}
var text_kind = 2;
function text(key, mapper, content) {
  return new Text(text_kind, key, mapper, content);
}
var unsafe_inner_html_kind = 3;
function set_fragment_key(loop$key, loop$children, loop$index, loop$new_children, loop$keyed_children) {
  while (true) {
    let key = loop$key;
    let children = loop$children;
    let index5 = loop$index;
    let new_children = loop$new_children;
    let keyed_children = loop$keyed_children;
    if (children instanceof Empty) {
      return [reverse(new_children), keyed_children];
    } else {
      let $ = children.head;
      if ($ instanceof Fragment) {
        let node = $;
        if (node.key === "") {
          let children$1 = children.tail;
          let child_key = key + "::" + to_string(index5);
          let $1 = set_fragment_key(
            child_key,
            node.children,
            0,
            empty_list,
            empty2()
          );
          let node_children = $1[0];
          let node_keyed_children = $1[1];
          let _block;
          let _record = node;
          _block = new Fragment(
            _record.kind,
            _record.key,
            _record.mapper,
            node_children,
            node_keyed_children,
            _record.children_count
          );
          let new_node = _block;
          let new_children$1 = prepend(new_node, new_children);
          let index$1 = index5 + 1;
          loop$key = key;
          loop$children = children$1;
          loop$index = index$1;
          loop$new_children = new_children$1;
          loop$keyed_children = keyed_children;
        } else {
          let node$1 = $;
          if (node$1.key !== "") {
            let children$1 = children.tail;
            let child_key = key + "::" + node$1.key;
            let keyed_node = to_keyed(child_key, node$1);
            let new_children$1 = prepend(keyed_node, new_children);
            let keyed_children$1 = insert3(
              keyed_children,
              child_key,
              keyed_node
            );
            let index$1 = index5 + 1;
            loop$key = key;
            loop$children = children$1;
            loop$index = index$1;
            loop$new_children = new_children$1;
            loop$keyed_children = keyed_children$1;
          } else {
            let node$2 = $;
            let children$1 = children.tail;
            let new_children$1 = prepend(node$2, new_children);
            let index$1 = index5 + 1;
            loop$key = key;
            loop$children = children$1;
            loop$index = index$1;
            loop$new_children = new_children$1;
            loop$keyed_children = keyed_children;
          }
        }
      } else {
        let node = $;
        if (node.key !== "") {
          let children$1 = children.tail;
          let child_key = key + "::" + node.key;
          let keyed_node = to_keyed(child_key, node);
          let new_children$1 = prepend(keyed_node, new_children);
          let keyed_children$1 = insert3(
            keyed_children,
            child_key,
            keyed_node
          );
          let index$1 = index5 + 1;
          loop$key = key;
          loop$children = children$1;
          loop$index = index$1;
          loop$new_children = new_children$1;
          loop$keyed_children = keyed_children$1;
        } else {
          let node$1 = $;
          let children$1 = children.tail;
          let new_children$1 = prepend(node$1, new_children);
          let index$1 = index5 + 1;
          loop$key = key;
          loop$children = children$1;
          loop$index = index$1;
          loop$new_children = new_children$1;
          loop$keyed_children = keyed_children;
        }
      }
    }
  }
}
function to_keyed(key, node) {
  if (node instanceof Fragment) {
    let children = node.children;
    let $ = set_fragment_key(
      key,
      children,
      0,
      empty_list,
      empty2()
    );
    let children$1 = $[0];
    let keyed_children = $[1];
    let _record = node;
    return new Fragment(
      _record.kind,
      key,
      _record.mapper,
      children$1,
      keyed_children,
      _record.children_count
    );
  } else if (node instanceof Element) {
    let _record = node;
    return new Element(
      _record.kind,
      key,
      _record.mapper,
      _record.namespace,
      _record.tag,
      _record.attributes,
      _record.children,
      _record.keyed_children,
      _record.self_closing,
      _record.void
    );
  } else if (node instanceof Text) {
    let _record = node;
    return new Text(_record.kind, key, _record.mapper, _record.content);
  } else {
    let _record = node;
    return new UnsafeInnerHtml(
      _record.kind,
      key,
      _record.mapper,
      _record.namespace,
      _record.tag,
      _record.attributes,
      _record.inner_html
    );
  }
}

// build/dev/javascript/lustre/lustre/internals/equals.ffi.mjs
var isReferenceEqual = (a, b) => a === b;
var isEqual2 = (a, b) => {
  if (a === b) {
    return true;
  }
  if (a == null || b == null) {
    return false;
  }
  const type = typeof a;
  if (type !== typeof b) {
    return false;
  }
  if (type !== "object") {
    return false;
  }
  const ctor = a.constructor;
  if (ctor !== b.constructor) {
    return false;
  }
  if (Array.isArray(a)) {
    return areArraysEqual(a, b);
  }
  return areObjectsEqual(a, b);
};
var areArraysEqual = (a, b) => {
  let index5 = a.length;
  if (index5 !== b.length) {
    return false;
  }
  while (index5--) {
    if (!isEqual2(a[index5], b[index5])) {
      return false;
    }
  }
  return true;
};
var areObjectsEqual = (a, b) => {
  const properties = Object.keys(a);
  let index5 = properties.length;
  if (Object.keys(b).length !== index5) {
    return false;
  }
  while (index5--) {
    const property3 = properties[index5];
    if (!Object.hasOwn(b, property3)) {
      return false;
    }
    if (!isEqual2(a[property3], b[property3])) {
      return false;
    }
  }
  return true;
};

// build/dev/javascript/lustre/lustre/vdom/events.mjs
var Events = class extends CustomType {
  constructor(handlers, dispatched_paths, next_dispatched_paths) {
    super();
    this.handlers = handlers;
    this.dispatched_paths = dispatched_paths;
    this.next_dispatched_paths = next_dispatched_paths;
  }
};
function new$3() {
  return new Events(
    empty2(),
    empty_list,
    empty_list
  );
}
function tick(events) {
  return new Events(
    events.handlers,
    events.next_dispatched_paths,
    empty_list
  );
}
function do_remove_event(handlers, path, name) {
  return remove(handlers, event2(path, name));
}
function remove_event(events, path, name) {
  let handlers = do_remove_event(events.handlers, path, name);
  let _record = events;
  return new Events(
    handlers,
    _record.dispatched_paths,
    _record.next_dispatched_paths
  );
}
function remove_attributes(handlers, path, attributes) {
  return fold(
    attributes,
    handlers,
    (events, attribute3) => {
      if (attribute3 instanceof Event2) {
        let name = attribute3.name;
        return do_remove_event(events, path, name);
      } else {
        return events;
      }
    }
  );
}
function handle(events, path, name, event4) {
  let next_dispatched_paths = prepend(path, events.next_dispatched_paths);
  let _block;
  let _record = events;
  _block = new Events(
    _record.handlers,
    _record.dispatched_paths,
    next_dispatched_paths
  );
  let events$1 = _block;
  let $ = get2(
    events$1.handlers,
    path + separator_event + name
  );
  if ($ instanceof Ok) {
    let handler = $[0];
    return [events$1, run(event4, handler)];
  } else {
    return [events$1, new Error(toList([]))];
  }
}
function has_dispatched_events(events, path) {
  return matches(path, events.dispatched_paths);
}
function do_add_event(handlers, mapper, path, name, handler) {
  return insert3(
    handlers,
    event2(path, name),
    map2(
      handler,
      (handler2) => {
        let _record = handler2;
        return new Handler(
          _record.prevent_default,
          _record.stop_propagation,
          identity2(mapper)(handler2.message)
        );
      }
    )
  );
}
function add_event(events, mapper, path, name, handler) {
  let handlers = do_add_event(events.handlers, mapper, path, name, handler);
  let _record = events;
  return new Events(
    handlers,
    _record.dispatched_paths,
    _record.next_dispatched_paths
  );
}
function add_attributes(handlers, mapper, path, attributes) {
  return fold(
    attributes,
    handlers,
    (events, attribute3) => {
      if (attribute3 instanceof Event2) {
        let name = attribute3.name;
        let handler = attribute3.handler;
        return do_add_event(events, mapper, path, name, handler);
      } else {
        return events;
      }
    }
  );
}
function compose_mapper(mapper, child_mapper) {
  let $ = isReferenceEqual(mapper, identity2);
  let $1 = isReferenceEqual(child_mapper, identity2);
  if ($1) {
    return mapper;
  } else if ($) {
    return child_mapper;
  } else {
    return (msg) => {
      return mapper(child_mapper(msg));
    };
  }
}
function do_remove_children(loop$handlers, loop$path, loop$child_index, loop$children) {
  while (true) {
    let handlers = loop$handlers;
    let path = loop$path;
    let child_index = loop$child_index;
    let children = loop$children;
    if (children instanceof Empty) {
      return handlers;
    } else {
      let child = children.head;
      let rest = children.tail;
      let _pipe = handlers;
      let _pipe$1 = do_remove_child(_pipe, path, child_index, child);
      loop$handlers = _pipe$1;
      loop$path = path;
      loop$child_index = child_index + advance(child);
      loop$children = rest;
    }
  }
}
function do_remove_child(handlers, parent, child_index, child) {
  if (child instanceof Fragment) {
    let children = child.children;
    return do_remove_children(handlers, parent, child_index + 1, children);
  } else if (child instanceof Element) {
    let attributes = child.attributes;
    let children = child.children;
    let path = add2(parent, child_index, child.key);
    let _pipe = handlers;
    let _pipe$1 = remove_attributes(_pipe, path, attributes);
    return do_remove_children(_pipe$1, path, 0, children);
  } else if (child instanceof Text) {
    return handlers;
  } else {
    let attributes = child.attributes;
    let path = add2(parent, child_index, child.key);
    return remove_attributes(handlers, path, attributes);
  }
}
function remove_child(events, parent, child_index, child) {
  let handlers = do_remove_child(events.handlers, parent, child_index, child);
  let _record = events;
  return new Events(
    handlers,
    _record.dispatched_paths,
    _record.next_dispatched_paths
  );
}
function do_add_children(loop$handlers, loop$mapper, loop$path, loop$child_index, loop$children) {
  while (true) {
    let handlers = loop$handlers;
    let mapper = loop$mapper;
    let path = loop$path;
    let child_index = loop$child_index;
    let children = loop$children;
    if (children instanceof Empty) {
      return handlers;
    } else {
      let child = children.head;
      let rest = children.tail;
      let _pipe = handlers;
      let _pipe$1 = do_add_child(_pipe, mapper, path, child_index, child);
      loop$handlers = _pipe$1;
      loop$mapper = mapper;
      loop$path = path;
      loop$child_index = child_index + advance(child);
      loop$children = rest;
    }
  }
}
function do_add_child(handlers, mapper, parent, child_index, child) {
  if (child instanceof Fragment) {
    let children = child.children;
    let composed_mapper = compose_mapper(mapper, child.mapper);
    let child_index$1 = child_index + 1;
    return do_add_children(
      handlers,
      composed_mapper,
      parent,
      child_index$1,
      children
    );
  } else if (child instanceof Element) {
    let attributes = child.attributes;
    let children = child.children;
    let path = add2(parent, child_index, child.key);
    let composed_mapper = compose_mapper(mapper, child.mapper);
    let _pipe = handlers;
    let _pipe$1 = add_attributes(_pipe, composed_mapper, path, attributes);
    return do_add_children(_pipe$1, composed_mapper, path, 0, children);
  } else if (child instanceof Text) {
    return handlers;
  } else {
    let attributes = child.attributes;
    let path = add2(parent, child_index, child.key);
    let composed_mapper = compose_mapper(mapper, child.mapper);
    return add_attributes(handlers, composed_mapper, path, attributes);
  }
}
function add_child(events, mapper, parent, index5, child) {
  let handlers = do_add_child(events.handlers, mapper, parent, index5, child);
  let _record = events;
  return new Events(
    handlers,
    _record.dispatched_paths,
    _record.next_dispatched_paths
  );
}
function add_children(events, mapper, path, child_index, children) {
  let handlers = do_add_children(
    events.handlers,
    mapper,
    path,
    child_index,
    children
  );
  let _record = events;
  return new Events(
    handlers,
    _record.dispatched_paths,
    _record.next_dispatched_paths
  );
}

// build/dev/javascript/lustre/lustre/element.mjs
function element2(tag, attributes, children) {
  return element(
    "",
    identity2,
    "",
    tag,
    attributes,
    children,
    empty2(),
    false,
    false
  );
}
function namespaced(namespace, tag, attributes, children) {
  return element(
    "",
    identity2,
    namespace,
    tag,
    attributes,
    children,
    empty2(),
    false,
    false
  );
}
function text2(content) {
  return text("", identity2, content);
}
function none2() {
  return text("", identity2, "");
}
function count_fragment_children(loop$children, loop$count) {
  while (true) {
    let children = loop$children;
    let count = loop$count;
    if (children instanceof Empty) {
      return count;
    } else {
      let child = children.head;
      let rest = children.tail;
      loop$children = rest;
      loop$count = count + advance(child);
    }
  }
}
function fragment2(children) {
  return fragment(
    "",
    identity2,
    children,
    empty2(),
    count_fragment_children(children, 0)
  );
}

// build/dev/javascript/lustre/lustre/element/html.mjs
function header(attrs, children) {
  return element2("header", attrs, children);
}
function h1(attrs, children) {
  return element2("h1", attrs, children);
}
function h3(attrs, children) {
  return element2("h3", attrs, children);
}
function main(attrs, children) {
  return element2("main", attrs, children);
}
function div(attrs, children) {
  return element2("div", attrs, children);
}
function p(attrs, children) {
  return element2("p", attrs, children);
}
function img(attrs) {
  return element2("img", attrs, empty_list);
}
function picture(attrs, children) {
  return element2("picture", attrs, children);
}
function source(attrs) {
  return element2("source", attrs, empty_list);
}
function button(attrs, children) {
  return element2("button", attrs, children);
}
function input(attrs) {
  return element2("input", attrs, empty_list);
}

// build/dev/javascript/lustre/lustre/vdom/patch.mjs
var Patch = class extends CustomType {
  constructor(index5, removed, changes, children) {
    super();
    this.index = index5;
    this.removed = removed;
    this.changes = changes;
    this.children = children;
  }
};
var ReplaceText = class extends CustomType {
  constructor(kind, content) {
    super();
    this.kind = kind;
    this.content = content;
  }
};
var ReplaceInnerHtml = class extends CustomType {
  constructor(kind, inner_html) {
    super();
    this.kind = kind;
    this.inner_html = inner_html;
  }
};
var Update = class extends CustomType {
  constructor(kind, added, removed) {
    super();
    this.kind = kind;
    this.added = added;
    this.removed = removed;
  }
};
var Move = class extends CustomType {
  constructor(kind, key, before, count) {
    super();
    this.kind = kind;
    this.key = key;
    this.before = before;
    this.count = count;
  }
};
var RemoveKey = class extends CustomType {
  constructor(kind, key, count) {
    super();
    this.kind = kind;
    this.key = key;
    this.count = count;
  }
};
var Replace = class extends CustomType {
  constructor(kind, from2, count, with$) {
    super();
    this.kind = kind;
    this.from = from2;
    this.count = count;
    this.with = with$;
  }
};
var Insert = class extends CustomType {
  constructor(kind, children, before) {
    super();
    this.kind = kind;
    this.children = children;
    this.before = before;
  }
};
var Remove = class extends CustomType {
  constructor(kind, from2, count) {
    super();
    this.kind = kind;
    this.from = from2;
    this.count = count;
  }
};
function new$5(index5, removed, changes, children) {
  return new Patch(index5, removed, changes, children);
}
var replace_text_kind = 0;
function replace_text(content) {
  return new ReplaceText(replace_text_kind, content);
}
var replace_inner_html_kind = 1;
function replace_inner_html(inner_html) {
  return new ReplaceInnerHtml(replace_inner_html_kind, inner_html);
}
var update_kind = 2;
function update(added, removed) {
  return new Update(update_kind, added, removed);
}
var move_kind = 3;
function move(key, before, count) {
  return new Move(move_kind, key, before, count);
}
var remove_key_kind = 4;
function remove_key(key, count) {
  return new RemoveKey(remove_key_kind, key, count);
}
var replace_kind = 5;
function replace2(from2, count, with$) {
  return new Replace(replace_kind, from2, count, with$);
}
var insert_kind = 6;
function insert4(children, before) {
  return new Insert(insert_kind, children, before);
}
var remove_kind = 7;
function remove2(from2, count) {
  return new Remove(remove_kind, from2, count);
}

// build/dev/javascript/lustre/lustre/vdom/diff.mjs
var Diff = class extends CustomType {
  constructor(patch, events) {
    super();
    this.patch = patch;
    this.events = events;
  }
};
var AttributeChange = class extends CustomType {
  constructor(added, removed, events) {
    super();
    this.added = added;
    this.removed = removed;
    this.events = events;
  }
};
function is_controlled(events, namespace, tag, path) {
  if (tag === "input") {
    if (namespace === "") {
      return has_dispatched_events(events, path);
    } else {
      return false;
    }
  } else if (tag === "select") {
    if (namespace === "") {
      return has_dispatched_events(events, path);
    } else {
      return false;
    }
  } else if (tag === "textarea") {
    if (namespace === "") {
      return has_dispatched_events(events, path);
    } else {
      return false;
    }
  } else {
    return false;
  }
}
function diff_attributes(loop$controlled, loop$path, loop$mapper, loop$events, loop$old, loop$new, loop$added, loop$removed) {
  while (true) {
    let controlled = loop$controlled;
    let path = loop$path;
    let mapper = loop$mapper;
    let events = loop$events;
    let old = loop$old;
    let new$8 = loop$new;
    let added = loop$added;
    let removed = loop$removed;
    if (new$8 instanceof Empty) {
      if (old instanceof Empty) {
        return new AttributeChange(added, removed, events);
      } else {
        let $ = old.head;
        if ($ instanceof Event2) {
          let prev = $;
          let old$1 = old.tail;
          let name = $.name;
          let removed$1 = prepend(prev, removed);
          let events$1 = remove_event(events, path, name);
          loop$controlled = controlled;
          loop$path = path;
          loop$mapper = mapper;
          loop$events = events$1;
          loop$old = old$1;
          loop$new = new$8;
          loop$added = added;
          loop$removed = removed$1;
        } else {
          let prev = $;
          let old$1 = old.tail;
          let removed$1 = prepend(prev, removed);
          loop$controlled = controlled;
          loop$path = path;
          loop$mapper = mapper;
          loop$events = events;
          loop$old = old$1;
          loop$new = new$8;
          loop$added = added;
          loop$removed = removed$1;
        }
      }
    } else if (old instanceof Empty) {
      let $ = new$8.head;
      if ($ instanceof Event2) {
        let next = $;
        let new$1 = new$8.tail;
        let name = $.name;
        let handler = $.handler;
        let added$1 = prepend(next, added);
        let events$1 = add_event(events, mapper, path, name, handler);
        loop$controlled = controlled;
        loop$path = path;
        loop$mapper = mapper;
        loop$events = events$1;
        loop$old = old;
        loop$new = new$1;
        loop$added = added$1;
        loop$removed = removed;
      } else {
        let next = $;
        let new$1 = new$8.tail;
        let added$1 = prepend(next, added);
        loop$controlled = controlled;
        loop$path = path;
        loop$mapper = mapper;
        loop$events = events;
        loop$old = old;
        loop$new = new$1;
        loop$added = added$1;
        loop$removed = removed;
      }
    } else {
      let next = new$8.head;
      let remaining_new = new$8.tail;
      let prev = old.head;
      let remaining_old = old.tail;
      let $ = compare3(prev, next);
      if ($ instanceof Lt) {
        if (prev instanceof Event2) {
          let name = prev.name;
          let removed$1 = prepend(prev, removed);
          let events$1 = remove_event(events, path, name);
          loop$controlled = controlled;
          loop$path = path;
          loop$mapper = mapper;
          loop$events = events$1;
          loop$old = remaining_old;
          loop$new = new$8;
          loop$added = added;
          loop$removed = removed$1;
        } else {
          let removed$1 = prepend(prev, removed);
          loop$controlled = controlled;
          loop$path = path;
          loop$mapper = mapper;
          loop$events = events;
          loop$old = remaining_old;
          loop$new = new$8;
          loop$added = added;
          loop$removed = removed$1;
        }
      } else if ($ instanceof Eq) {
        if (next instanceof Attribute) {
          if (prev instanceof Attribute) {
            let _block;
            let $1 = next.name;
            if ($1 === "value") {
              _block = controlled || prev.value !== next.value;
            } else if ($1 === "checked") {
              _block = controlled || prev.value !== next.value;
            } else if ($1 === "selected") {
              _block = controlled || prev.value !== next.value;
            } else {
              _block = prev.value !== next.value;
            }
            let has_changes = _block;
            let _block$1;
            if (has_changes) {
              _block$1 = prepend(next, added);
            } else {
              _block$1 = added;
            }
            let added$1 = _block$1;
            loop$controlled = controlled;
            loop$path = path;
            loop$mapper = mapper;
            loop$events = events;
            loop$old = remaining_old;
            loop$new = remaining_new;
            loop$added = added$1;
            loop$removed = removed;
          } else if (prev instanceof Event2) {
            let name = prev.name;
            let added$1 = prepend(next, added);
            let removed$1 = prepend(prev, removed);
            let events$1 = remove_event(events, path, name);
            loop$controlled = controlled;
            loop$path = path;
            loop$mapper = mapper;
            loop$events = events$1;
            loop$old = remaining_old;
            loop$new = remaining_new;
            loop$added = added$1;
            loop$removed = removed$1;
          } else {
            let added$1 = prepend(next, added);
            let removed$1 = prepend(prev, removed);
            loop$controlled = controlled;
            loop$path = path;
            loop$mapper = mapper;
            loop$events = events;
            loop$old = remaining_old;
            loop$new = remaining_new;
            loop$added = added$1;
            loop$removed = removed$1;
          }
        } else if (next instanceof Property) {
          if (prev instanceof Property) {
            let _block;
            let $1 = next.name;
            if ($1 === "scrollLeft") {
              _block = true;
            } else if ($1 === "scrollRight") {
              _block = true;
            } else if ($1 === "value") {
              _block = controlled || !isEqual2(
                prev.value,
                next.value
              );
            } else if ($1 === "checked") {
              _block = controlled || !isEqual2(
                prev.value,
                next.value
              );
            } else if ($1 === "selected") {
              _block = controlled || !isEqual2(
                prev.value,
                next.value
              );
            } else {
              _block = !isEqual2(prev.value, next.value);
            }
            let has_changes = _block;
            let _block$1;
            if (has_changes) {
              _block$1 = prepend(next, added);
            } else {
              _block$1 = added;
            }
            let added$1 = _block$1;
            loop$controlled = controlled;
            loop$path = path;
            loop$mapper = mapper;
            loop$events = events;
            loop$old = remaining_old;
            loop$new = remaining_new;
            loop$added = added$1;
            loop$removed = removed;
          } else if (prev instanceof Event2) {
            let name = prev.name;
            let added$1 = prepend(next, added);
            let removed$1 = prepend(prev, removed);
            let events$1 = remove_event(events, path, name);
            loop$controlled = controlled;
            loop$path = path;
            loop$mapper = mapper;
            loop$events = events$1;
            loop$old = remaining_old;
            loop$new = remaining_new;
            loop$added = added$1;
            loop$removed = removed$1;
          } else {
            let added$1 = prepend(next, added);
            let removed$1 = prepend(prev, removed);
            loop$controlled = controlled;
            loop$path = path;
            loop$mapper = mapper;
            loop$events = events;
            loop$old = remaining_old;
            loop$new = remaining_new;
            loop$added = added$1;
            loop$removed = removed$1;
          }
        } else if (prev instanceof Event2) {
          let name = next.name;
          let handler = next.handler;
          let has_changes = !isEqual(
            prev.prevent_default,
            next.prevent_default
          ) || !isEqual(prev.stop_propagation, next.stop_propagation) || prev.immediate !== next.immediate || prev.debounce !== next.debounce || prev.throttle !== next.throttle;
          let _block;
          if (has_changes) {
            _block = prepend(next, added);
          } else {
            _block = added;
          }
          let added$1 = _block;
          let events$1 = add_event(events, mapper, path, name, handler);
          loop$controlled = controlled;
          loop$path = path;
          loop$mapper = mapper;
          loop$events = events$1;
          loop$old = remaining_old;
          loop$new = remaining_new;
          loop$added = added$1;
          loop$removed = removed;
        } else {
          let name = next.name;
          let handler = next.handler;
          let added$1 = prepend(next, added);
          let removed$1 = prepend(prev, removed);
          let events$1 = add_event(events, mapper, path, name, handler);
          loop$controlled = controlled;
          loop$path = path;
          loop$mapper = mapper;
          loop$events = events$1;
          loop$old = remaining_old;
          loop$new = remaining_new;
          loop$added = added$1;
          loop$removed = removed$1;
        }
      } else if (next instanceof Event2) {
        let name = next.name;
        let handler = next.handler;
        let added$1 = prepend(next, added);
        let events$1 = add_event(events, mapper, path, name, handler);
        loop$controlled = controlled;
        loop$path = path;
        loop$mapper = mapper;
        loop$events = events$1;
        loop$old = old;
        loop$new = remaining_new;
        loop$added = added$1;
        loop$removed = removed;
      } else {
        let added$1 = prepend(next, added);
        loop$controlled = controlled;
        loop$path = path;
        loop$mapper = mapper;
        loop$events = events;
        loop$old = old;
        loop$new = remaining_new;
        loop$added = added$1;
        loop$removed = removed;
      }
    }
  }
}
function do_diff(loop$old, loop$old_keyed, loop$new, loop$new_keyed, loop$moved, loop$moved_offset, loop$removed, loop$node_index, loop$patch_index, loop$path, loop$changes, loop$children, loop$mapper, loop$events) {
  while (true) {
    let old = loop$old;
    let old_keyed = loop$old_keyed;
    let new$8 = loop$new;
    let new_keyed = loop$new_keyed;
    let moved = loop$moved;
    let moved_offset = loop$moved_offset;
    let removed = loop$removed;
    let node_index = loop$node_index;
    let patch_index = loop$patch_index;
    let path = loop$path;
    let changes = loop$changes;
    let children = loop$children;
    let mapper = loop$mapper;
    let events = loop$events;
    if (new$8 instanceof Empty) {
      if (old instanceof Empty) {
        return new Diff(
          new Patch(patch_index, removed, changes, children),
          events
        );
      } else {
        let prev = old.head;
        let old$1 = old.tail;
        let _block;
        let $ = prev.key === "" || !contains(moved, prev.key);
        if ($) {
          _block = removed + advance(prev);
        } else {
          _block = removed;
        }
        let removed$1 = _block;
        let events$1 = remove_child(events, path, node_index, prev);
        loop$old = old$1;
        loop$old_keyed = old_keyed;
        loop$new = new$8;
        loop$new_keyed = new_keyed;
        loop$moved = moved;
        loop$moved_offset = moved_offset;
        loop$removed = removed$1;
        loop$node_index = node_index;
        loop$patch_index = patch_index;
        loop$path = path;
        loop$changes = changes;
        loop$children = children;
        loop$mapper = mapper;
        loop$events = events$1;
      }
    } else if (old instanceof Empty) {
      let events$1 = add_children(
        events,
        mapper,
        path,
        node_index,
        new$8
      );
      let insert5 = insert4(new$8, node_index - moved_offset);
      let changes$1 = prepend(insert5, changes);
      return new Diff(
        new Patch(patch_index, removed, changes$1, children),
        events$1
      );
    } else {
      let next = new$8.head;
      let prev = old.head;
      if (prev.key !== next.key) {
        let new_remaining = new$8.tail;
        let old_remaining = old.tail;
        let next_did_exist = get2(old_keyed, next.key);
        let prev_does_exist = get2(new_keyed, prev.key);
        let prev_has_moved = contains(moved, prev.key);
        if (next_did_exist instanceof Ok) {
          if (prev_does_exist instanceof Ok) {
            if (prev_has_moved) {
              loop$old = old_remaining;
              loop$old_keyed = old_keyed;
              loop$new = new$8;
              loop$new_keyed = new_keyed;
              loop$moved = moved;
              loop$moved_offset = moved_offset - advance(prev);
              loop$removed = removed;
              loop$node_index = node_index;
              loop$patch_index = patch_index;
              loop$path = path;
              loop$changes = changes;
              loop$children = children;
              loop$mapper = mapper;
              loop$events = events;
            } else {
              let match = next_did_exist[0];
              let count = advance(next);
              let before = node_index - moved_offset;
              let move2 = move(next.key, before, count);
              let changes$1 = prepend(move2, changes);
              let moved$1 = insert2(moved, next.key);
              let moved_offset$1 = moved_offset + count;
              loop$old = prepend(match, old);
              loop$old_keyed = old_keyed;
              loop$new = new$8;
              loop$new_keyed = new_keyed;
              loop$moved = moved$1;
              loop$moved_offset = moved_offset$1;
              loop$removed = removed;
              loop$node_index = node_index;
              loop$patch_index = patch_index;
              loop$path = path;
              loop$changes = changes$1;
              loop$children = children;
              loop$mapper = mapper;
              loop$events = events;
            }
          } else {
            let count = advance(prev);
            let moved_offset$1 = moved_offset - count;
            let events$1 = remove_child(events, path, node_index, prev);
            let remove3 = remove_key(prev.key, count);
            let changes$1 = prepend(remove3, changes);
            loop$old = old_remaining;
            loop$old_keyed = old_keyed;
            loop$new = new$8;
            loop$new_keyed = new_keyed;
            loop$moved = moved;
            loop$moved_offset = moved_offset$1;
            loop$removed = removed;
            loop$node_index = node_index;
            loop$patch_index = patch_index;
            loop$path = path;
            loop$changes = changes$1;
            loop$children = children;
            loop$mapper = mapper;
            loop$events = events$1;
          }
        } else if (prev_does_exist instanceof Ok) {
          let before = node_index - moved_offset;
          let count = advance(next);
          let events$1 = add_child(
            events,
            mapper,
            path,
            node_index,
            next
          );
          let insert5 = insert4(toList([next]), before);
          let changes$1 = prepend(insert5, changes);
          loop$old = old;
          loop$old_keyed = old_keyed;
          loop$new = new_remaining;
          loop$new_keyed = new_keyed;
          loop$moved = moved;
          loop$moved_offset = moved_offset + count;
          loop$removed = removed;
          loop$node_index = node_index + count;
          loop$patch_index = patch_index;
          loop$path = path;
          loop$changes = changes$1;
          loop$children = children;
          loop$mapper = mapper;
          loop$events = events$1;
        } else {
          let prev_count = advance(prev);
          let next_count = advance(next);
          let change = replace2(
            node_index - moved_offset,
            prev_count,
            next
          );
          let _block;
          let _pipe = events;
          let _pipe$1 = remove_child(_pipe, path, node_index, prev);
          _block = add_child(_pipe$1, mapper, path, node_index, next);
          let events$1 = _block;
          loop$old = old_remaining;
          loop$old_keyed = old_keyed;
          loop$new = new_remaining;
          loop$new_keyed = new_keyed;
          loop$moved = moved;
          loop$moved_offset = moved_offset - prev_count + next_count;
          loop$removed = removed;
          loop$node_index = node_index + next_count;
          loop$patch_index = patch_index;
          loop$path = path;
          loop$changes = prepend(change, changes);
          loop$children = children;
          loop$mapper = mapper;
          loop$events = events$1;
        }
      } else {
        let $ = old.head;
        if ($ instanceof Fragment) {
          let $1 = new$8.head;
          if ($1 instanceof Fragment) {
            let next$1 = $1;
            let new$1 = new$8.tail;
            let prev$1 = $;
            let old$1 = old.tail;
            let node_index$1 = node_index + 1;
            let prev_count = prev$1.children_count;
            let next_count = next$1.children_count;
            let composed_mapper = compose_mapper(mapper, next$1.mapper);
            let child = do_diff(
              prev$1.children,
              prev$1.keyed_children,
              next$1.children,
              next$1.keyed_children,
              empty_set(),
              moved_offset,
              0,
              node_index$1,
              -1,
              path,
              empty_list,
              children,
              composed_mapper,
              events
            );
            let _block;
            let $2 = child.patch.removed > 0;
            if ($2) {
              let remove_from = node_index$1 + next_count - moved_offset;
              let patch = remove2(remove_from, child.patch.removed);
              _block = append(
                child.patch.changes,
                prepend(patch, changes)
              );
            } else {
              _block = append(child.patch.changes, changes);
            }
            let changes$1 = _block;
            loop$old = old$1;
            loop$old_keyed = old_keyed;
            loop$new = new$1;
            loop$new_keyed = new_keyed;
            loop$moved = moved;
            loop$moved_offset = moved_offset + next_count - prev_count;
            loop$removed = removed;
            loop$node_index = node_index$1 + next_count;
            loop$patch_index = patch_index;
            loop$path = path;
            loop$changes = changes$1;
            loop$children = child.patch.children;
            loop$mapper = mapper;
            loop$events = child.events;
          } else {
            let next$1 = $1;
            let new_remaining = new$8.tail;
            let prev$1 = $;
            let old_remaining = old.tail;
            let prev_count = advance(prev$1);
            let next_count = advance(next$1);
            let change = replace2(
              node_index - moved_offset,
              prev_count,
              next$1
            );
            let _block;
            let _pipe = events;
            let _pipe$1 = remove_child(_pipe, path, node_index, prev$1);
            _block = add_child(
              _pipe$1,
              mapper,
              path,
              node_index,
              next$1
            );
            let events$1 = _block;
            loop$old = old_remaining;
            loop$old_keyed = old_keyed;
            loop$new = new_remaining;
            loop$new_keyed = new_keyed;
            loop$moved = moved;
            loop$moved_offset = moved_offset - prev_count + next_count;
            loop$removed = removed;
            loop$node_index = node_index + next_count;
            loop$patch_index = patch_index;
            loop$path = path;
            loop$changes = prepend(change, changes);
            loop$children = children;
            loop$mapper = mapper;
            loop$events = events$1;
          }
        } else if ($ instanceof Element) {
          let $1 = new$8.head;
          if ($1 instanceof Element) {
            let next$1 = $1;
            let prev$1 = $;
            if (prev$1.namespace === next$1.namespace && prev$1.tag === next$1.tag) {
              let new$1 = new$8.tail;
              let old$1 = old.tail;
              let composed_mapper = compose_mapper(
                mapper,
                next$1.mapper
              );
              let child_path = add2(path, node_index, next$1.key);
              let controlled = is_controlled(
                events,
                next$1.namespace,
                next$1.tag,
                child_path
              );
              let $2 = diff_attributes(
                controlled,
                child_path,
                composed_mapper,
                events,
                prev$1.attributes,
                next$1.attributes,
                empty_list,
                empty_list
              );
              let added_attrs = $2.added;
              let removed_attrs = $2.removed;
              let events$1 = $2.events;
              let _block;
              if (removed_attrs instanceof Empty) {
                if (added_attrs instanceof Empty) {
                  _block = empty_list;
                } else {
                  _block = toList([update(added_attrs, removed_attrs)]);
                }
              } else {
                _block = toList([update(added_attrs, removed_attrs)]);
              }
              let initial_child_changes = _block;
              let child = do_diff(
                prev$1.children,
                prev$1.keyed_children,
                next$1.children,
                next$1.keyed_children,
                empty_set(),
                0,
                0,
                0,
                node_index,
                child_path,
                initial_child_changes,
                empty_list,
                composed_mapper,
                events$1
              );
              let _block$1;
              let $3 = child.patch;
              let $4 = $3.children;
              if ($4 instanceof Empty) {
                let $5 = $3.changes;
                if ($5 instanceof Empty) {
                  let $6 = $3.removed;
                  if ($6 === 0) {
                    _block$1 = children;
                  } else {
                    _block$1 = prepend(child.patch, children);
                  }
                } else {
                  _block$1 = prepend(child.patch, children);
                }
              } else {
                _block$1 = prepend(child.patch, children);
              }
              let children$1 = _block$1;
              loop$old = old$1;
              loop$old_keyed = old_keyed;
              loop$new = new$1;
              loop$new_keyed = new_keyed;
              loop$moved = moved;
              loop$moved_offset = moved_offset;
              loop$removed = removed;
              loop$node_index = node_index + 1;
              loop$patch_index = patch_index;
              loop$path = path;
              loop$changes = changes;
              loop$children = children$1;
              loop$mapper = mapper;
              loop$events = child.events;
            } else {
              let next$2 = $1;
              let new_remaining = new$8.tail;
              let prev$2 = $;
              let old_remaining = old.tail;
              let prev_count = advance(prev$2);
              let next_count = advance(next$2);
              let change = replace2(
                node_index - moved_offset,
                prev_count,
                next$2
              );
              let _block;
              let _pipe = events;
              let _pipe$1 = remove_child(
                _pipe,
                path,
                node_index,
                prev$2
              );
              _block = add_child(
                _pipe$1,
                mapper,
                path,
                node_index,
                next$2
              );
              let events$1 = _block;
              loop$old = old_remaining;
              loop$old_keyed = old_keyed;
              loop$new = new_remaining;
              loop$new_keyed = new_keyed;
              loop$moved = moved;
              loop$moved_offset = moved_offset - prev_count + next_count;
              loop$removed = removed;
              loop$node_index = node_index + next_count;
              loop$patch_index = patch_index;
              loop$path = path;
              loop$changes = prepend(change, changes);
              loop$children = children;
              loop$mapper = mapper;
              loop$events = events$1;
            }
          } else {
            let next$1 = $1;
            let new_remaining = new$8.tail;
            let prev$1 = $;
            let old_remaining = old.tail;
            let prev_count = advance(prev$1);
            let next_count = advance(next$1);
            let change = replace2(
              node_index - moved_offset,
              prev_count,
              next$1
            );
            let _block;
            let _pipe = events;
            let _pipe$1 = remove_child(_pipe, path, node_index, prev$1);
            _block = add_child(
              _pipe$1,
              mapper,
              path,
              node_index,
              next$1
            );
            let events$1 = _block;
            loop$old = old_remaining;
            loop$old_keyed = old_keyed;
            loop$new = new_remaining;
            loop$new_keyed = new_keyed;
            loop$moved = moved;
            loop$moved_offset = moved_offset - prev_count + next_count;
            loop$removed = removed;
            loop$node_index = node_index + next_count;
            loop$patch_index = patch_index;
            loop$path = path;
            loop$changes = prepend(change, changes);
            loop$children = children;
            loop$mapper = mapper;
            loop$events = events$1;
          }
        } else if ($ instanceof Text) {
          let $1 = new$8.head;
          if ($1 instanceof Text) {
            let next$1 = $1;
            let prev$1 = $;
            if (prev$1.content === next$1.content) {
              let new$1 = new$8.tail;
              let old$1 = old.tail;
              loop$old = old$1;
              loop$old_keyed = old_keyed;
              loop$new = new$1;
              loop$new_keyed = new_keyed;
              loop$moved = moved;
              loop$moved_offset = moved_offset;
              loop$removed = removed;
              loop$node_index = node_index + 1;
              loop$patch_index = patch_index;
              loop$path = path;
              loop$changes = changes;
              loop$children = children;
              loop$mapper = mapper;
              loop$events = events;
            } else {
              let next$2 = $1;
              let new$1 = new$8.tail;
              let old$1 = old.tail;
              let child = new$5(
                node_index,
                0,
                toList([replace_text(next$2.content)]),
                empty_list
              );
              loop$old = old$1;
              loop$old_keyed = old_keyed;
              loop$new = new$1;
              loop$new_keyed = new_keyed;
              loop$moved = moved;
              loop$moved_offset = moved_offset;
              loop$removed = removed;
              loop$node_index = node_index + 1;
              loop$patch_index = patch_index;
              loop$path = path;
              loop$changes = changes;
              loop$children = prepend(child, children);
              loop$mapper = mapper;
              loop$events = events;
            }
          } else {
            let next$1 = $1;
            let new_remaining = new$8.tail;
            let prev$1 = $;
            let old_remaining = old.tail;
            let prev_count = advance(prev$1);
            let next_count = advance(next$1);
            let change = replace2(
              node_index - moved_offset,
              prev_count,
              next$1
            );
            let _block;
            let _pipe = events;
            let _pipe$1 = remove_child(_pipe, path, node_index, prev$1);
            _block = add_child(
              _pipe$1,
              mapper,
              path,
              node_index,
              next$1
            );
            let events$1 = _block;
            loop$old = old_remaining;
            loop$old_keyed = old_keyed;
            loop$new = new_remaining;
            loop$new_keyed = new_keyed;
            loop$moved = moved;
            loop$moved_offset = moved_offset - prev_count + next_count;
            loop$removed = removed;
            loop$node_index = node_index + next_count;
            loop$patch_index = patch_index;
            loop$path = path;
            loop$changes = prepend(change, changes);
            loop$children = children;
            loop$mapper = mapper;
            loop$events = events$1;
          }
        } else {
          let $1 = new$8.head;
          if ($1 instanceof UnsafeInnerHtml) {
            let next$1 = $1;
            let new$1 = new$8.tail;
            let prev$1 = $;
            let old$1 = old.tail;
            let composed_mapper = compose_mapper(mapper, next$1.mapper);
            let child_path = add2(path, node_index, next$1.key);
            let $2 = diff_attributes(
              false,
              child_path,
              composed_mapper,
              events,
              prev$1.attributes,
              next$1.attributes,
              empty_list,
              empty_list
            );
            let added_attrs = $2.added;
            let removed_attrs = $2.removed;
            let events$1 = $2.events;
            let _block;
            if (removed_attrs instanceof Empty) {
              if (added_attrs instanceof Empty) {
                _block = empty_list;
              } else {
                _block = toList([update(added_attrs, removed_attrs)]);
              }
            } else {
              _block = toList([update(added_attrs, removed_attrs)]);
            }
            let child_changes = _block;
            let _block$1;
            let $3 = prev$1.inner_html === next$1.inner_html;
            if ($3) {
              _block$1 = child_changes;
            } else {
              _block$1 = prepend(
                replace_inner_html(next$1.inner_html),
                child_changes
              );
            }
            let child_changes$1 = _block$1;
            let _block$2;
            if (child_changes$1 instanceof Empty) {
              _block$2 = children;
            } else {
              _block$2 = prepend(
                new$5(node_index, 0, child_changes$1, toList([])),
                children
              );
            }
            let children$1 = _block$2;
            loop$old = old$1;
            loop$old_keyed = old_keyed;
            loop$new = new$1;
            loop$new_keyed = new_keyed;
            loop$moved = moved;
            loop$moved_offset = moved_offset;
            loop$removed = removed;
            loop$node_index = node_index + 1;
            loop$patch_index = patch_index;
            loop$path = path;
            loop$changes = changes;
            loop$children = children$1;
            loop$mapper = mapper;
            loop$events = events$1;
          } else {
            let next$1 = $1;
            let new_remaining = new$8.tail;
            let prev$1 = $;
            let old_remaining = old.tail;
            let prev_count = advance(prev$1);
            let next_count = advance(next$1);
            let change = replace2(
              node_index - moved_offset,
              prev_count,
              next$1
            );
            let _block;
            let _pipe = events;
            let _pipe$1 = remove_child(_pipe, path, node_index, prev$1);
            _block = add_child(
              _pipe$1,
              mapper,
              path,
              node_index,
              next$1
            );
            let events$1 = _block;
            loop$old = old_remaining;
            loop$old_keyed = old_keyed;
            loop$new = new_remaining;
            loop$new_keyed = new_keyed;
            loop$moved = moved;
            loop$moved_offset = moved_offset - prev_count + next_count;
            loop$removed = removed;
            loop$node_index = node_index + next_count;
            loop$patch_index = patch_index;
            loop$path = path;
            loop$changes = prepend(change, changes);
            loop$children = children;
            loop$mapper = mapper;
            loop$events = events$1;
          }
        }
      }
    }
  }
}
function diff(events, old, new$8) {
  return do_diff(
    toList([old]),
    empty2(),
    toList([new$8]),
    empty2(),
    empty_set(),
    0,
    0,
    0,
    0,
    root2,
    empty_list,
    empty_list,
    identity2,
    tick(events)
  );
}

// build/dev/javascript/lustre/lustre/vdom/reconciler.ffi.mjs
var Reconciler = class {
  offset = 0;
  #root = null;
  #dispatch = () => {
  };
  #useServerEvents = false;
  #exposeKeys = false;
  constructor(root3, dispatch, { useServerEvents = false, exposeKeys = false } = {}) {
    this.#root = root3;
    this.#dispatch = dispatch;
    this.#useServerEvents = useServerEvents;
    this.#exposeKeys = exposeKeys;
  }
  mount(vdom) {
    appendChild(this.#root, this.#createChild(this.#root, 0, vdom));
  }
  #stack = [];
  push(patch) {
    const offset = this.offset;
    if (offset) {
      iterate(patch.changes, (change) => {
        switch (change.kind) {
          case insert_kind:
          case move_kind:
            change.before = (change.before | 0) + offset;
            break;
          case remove_kind:
          case replace_kind:
            change.from = (change.from | 0) + offset;
            break;
        }
      });
      iterate(patch.children, (child) => {
        child.index = (child.index | 0) + offset;
      });
    }
    this.#stack.push({ node: this.#root, patch });
    this.#reconcile();
  }
  // PATCHING ------------------------------------------------------------------
  #reconcile() {
    const self = this;
    while (self.#stack.length) {
      const { node, patch } = self.#stack.pop();
      iterate(patch.changes, (change) => {
        switch (change.kind) {
          case insert_kind:
            self.#insert(node, change.children, change.before);
            break;
          case move_kind:
            self.#move(node, change.key, change.before, change.count);
            break;
          case remove_key_kind:
            self.#removeKey(node, change.key, change.count);
            break;
          case remove_kind:
            self.#remove(node, change.from, change.count);
            break;
          case replace_kind:
            self.#replace(node, change.from, change.count, change.with);
            break;
          case replace_text_kind:
            self.#replaceText(node, change.content);
            break;
          case replace_inner_html_kind:
            self.#replaceInnerHtml(node, change.inner_html);
            break;
          case update_kind:
            self.#update(node, change.added, change.removed);
            break;
        }
      });
      if (patch.removed) {
        self.#remove(
          node,
          node.childNodes.length - patch.removed,
          patch.removed
        );
      }
      let lastIndex = -1;
      let lastChild = null;
      iterate(patch.children, (child) => {
        const index5 = child.index | 0;
        const next = lastChild && lastIndex - index5 === 1 ? lastChild.previousSibling : childAt(node, index5);
        self.#stack.push({ node: next, patch: child });
        lastChild = next;
        lastIndex = index5;
      });
    }
  }
  // CHANGES -------------------------------------------------------------------
  #insert(node, children, before) {
    const fragment3 = createDocumentFragment();
    let childIndex = before | 0;
    iterate(children, (child) => {
      const el = this.#createChild(node, childIndex, child);
      appendChild(fragment3, el);
      childIndex += advance(child);
    });
    insertBefore(node, fragment3, childAt(node, before));
  }
  #move(node, key, before, count) {
    let el = getKeyedChild(node, key);
    const beforeEl = childAt(node, before);
    for (let i = 0; i < count && el !== null; ++i) {
      const next = el.nextSibling;
      if (SUPPORTS_MOVE_BEFORE) {
        node.moveBefore(el, beforeEl);
      } else {
        insertBefore(node, el, beforeEl);
      }
      el = next;
    }
  }
  #removeKey(node, key, count) {
    this.#removeFromChild(node, getKeyedChild(node, key), count);
  }
  #remove(node, from2, count) {
    this.#removeFromChild(node, childAt(node, from2), count);
  }
  #removeFromChild(parent, child, count) {
    while (count-- > 0 && child !== null) {
      const next = child.nextSibling;
      const key = child[meta].key;
      if (key) {
        parent[meta].keyedChildren.delete(key);
      }
      for (const [_, { timeout }] of child[meta].debouncers ?? []) {
        clearTimeout(timeout);
      }
      parent.removeChild(child);
      child = next;
    }
  }
  #replace(parent, from2, count, child) {
    this.#remove(parent, from2, count);
    const el = this.#createChild(parent, from2, child);
    insertBefore(parent, el, childAt(parent, from2));
  }
  #replaceText(node, content) {
    node.data = content ?? "";
  }
  #replaceInnerHtml(node, inner_html) {
    node.innerHTML = inner_html ?? "";
  }
  #update(node, added, removed) {
    iterate(removed, (attribute3) => {
      const name = attribute3.name;
      if (node[meta].handlers.has(name)) {
        node.removeEventListener(name, handleEvent);
        node[meta].handlers.delete(name);
        if (node[meta].throttles.has(name)) {
          node[meta].throttles.delete(name);
        }
        if (node[meta].debouncers.has(name)) {
          clearTimeout(node[meta].debouncers.get(name).timeout);
          node[meta].debouncers.delete(name);
        }
      } else {
        node.removeAttribute(name);
        SYNCED_ATTRIBUTES[name]?.removed?.(node, name);
      }
    });
    iterate(added, (attribute3) => {
      this.#createAttribute(node, attribute3);
    });
  }
  // CONSTRUCTORS --------------------------------------------------------------
  #createChild(parent, index5, vnode) {
    switch (vnode.kind) {
      case element_kind: {
        const node = createChildElement(parent, index5, vnode);
        this.#createAttributes(node, vnode);
        this.#insert(node, vnode.children);
        return node;
      }
      case text_kind: {
        return createChildText(parent, index5, vnode);
      }
      case fragment_kind: {
        const node = createDocumentFragment();
        const head = createChildText(parent, index5, vnode);
        appendChild(node, head);
        let childIndex = index5 + 1;
        iterate(vnode.children, (child) => {
          appendChild(node, this.#createChild(parent, childIndex, child));
          childIndex += advance(child);
        });
        return node;
      }
      case unsafe_inner_html_kind: {
        const node = createChildElement(parent, index5, vnode);
        this.#createAttributes(node, vnode);
        this.#replaceInnerHtml(node, vnode.inner_html);
        return node;
      }
    }
  }
  #createAttributes(node, { key, attributes }) {
    if (this.#exposeKeys && key) {
      node.setAttribute("data-lustre-key", key);
    }
    iterate(attributes, (attribute3) => this.#createAttribute(node, attribute3));
  }
  #createAttribute(node, attribute3) {
    const { debouncers, handlers, throttles } = node[meta];
    const {
      kind,
      name,
      value: value2,
      prevent_default: prevent,
      stop_propagation: stop,
      immediate: immediate2,
      include,
      debounce: debounceDelay,
      throttle: throttleDelay
    } = attribute3;
    switch (kind) {
      case attribute_kind: {
        const valueOrDefault = value2 ?? "";
        if (name === "virtual:defaultValue") {
          node.defaultValue = valueOrDefault;
          return;
        }
        if (valueOrDefault !== node.getAttribute(name)) {
          node.setAttribute(name, valueOrDefault);
        }
        SYNCED_ATTRIBUTES[name]?.added?.(node, value2);
        break;
      }
      case property_kind:
        node[name] = value2;
        break;
      case event_kind: {
        if (handlers.has(name)) {
          node.removeEventListener(name, handleEvent);
        }
        node.addEventListener(name, handleEvent, {
          passive: prevent.kind === never_kind
        });
        if (throttleDelay > 0) {
          const throttle = throttles.get(name) ?? {};
          throttle.delay = throttleDelay;
          throttles.set(name, throttle);
        } else {
          throttles.delete(name);
        }
        if (debounceDelay > 0) {
          const debounce = debouncers.get(name) ?? {};
          debounce.delay = debounceDelay;
          debouncers.set(name, debounce);
        } else {
          clearTimeout(debouncers.get(name)?.timeout);
          debouncers.delete(name);
        }
        handlers.set(name, (event4) => {
          if (prevent.kind === always_kind) event4.preventDefault();
          if (stop.kind === always_kind) event4.stopPropagation();
          const type = event4.type;
          const path = event4.currentTarget[meta].path;
          const data = this.#useServerEvents ? createServerEvent(event4, include ?? []) : event4;
          const throttle = throttles.get(type);
          if (throttle) {
            const now = Date.now();
            const last = throttle.last || 0;
            if (now > last + throttle.delay) {
              throttle.last = now;
              throttle.lastEvent = event4;
              this.#dispatch(data, path, type, immediate2);
            }
          }
          const debounce = debouncers.get(type);
          if (debounce) {
            clearTimeout(debounce.timeout);
            debounce.timeout = setTimeout(() => {
              if (event4 === throttles.get(type)?.lastEvent) return;
              this.#dispatch(data, path, type, immediate2);
            }, debounce.delay);
          }
          if (!throttle && !debounce) {
            this.#dispatch(data, path, type, immediate2);
          }
        });
        break;
      }
    }
  }
};
var iterate = (list4, callback) => {
  if (Array.isArray(list4)) {
    for (let i = 0; i < list4.length; i++) {
      callback(list4[i]);
    }
  } else if (list4) {
    for (list4; list4.tail; list4 = list4.tail) {
      callback(list4.head);
    }
  }
};
var appendChild = (node, child) => node.appendChild(child);
var insertBefore = (parent, node, referenceNode) => parent.insertBefore(node, referenceNode ?? null);
var createChildElement = (parent, index5, { key, tag, namespace }) => {
  const node = document().createElementNS(namespace || NAMESPACE_HTML, tag);
  initialiseMetadata(parent, node, index5, key);
  return node;
};
var createChildText = (parent, index5, { key, content }) => {
  const node = document().createTextNode(content ?? "");
  initialiseMetadata(parent, node, index5, key);
  return node;
};
var createDocumentFragment = () => document().createDocumentFragment();
var childAt = (node, at) => node.childNodes[at | 0];
var meta = Symbol("lustre");
var initialiseMetadata = (parent, node, index5 = 0, key = "") => {
  const segment = `${key || index5}`;
  switch (node.nodeType) {
    case ELEMENT_NODE:
    case DOCUMENT_FRAGMENT_NODE:
      node[meta] = {
        key,
        path: segment,
        keyedChildren: /* @__PURE__ */ new Map(),
        handlers: /* @__PURE__ */ new Map(),
        throttles: /* @__PURE__ */ new Map(),
        debouncers: /* @__PURE__ */ new Map()
      };
      break;
    case TEXT_NODE:
      node[meta] = { key };
      break;
  }
  if (parent && parent[meta] && key) {
    parent[meta].keyedChildren.set(key, new WeakRef(node));
  }
  if (parent && parent[meta] && parent[meta].path) {
    node[meta].path = `${parent[meta].path}${separator_element}${segment}`;
  }
};
var getKeyedChild = (node, key) => node[meta].keyedChildren.get(key).deref();
var handleEvent = (event4) => {
  const target = event4.currentTarget;
  const handler = target[meta].handlers.get(event4.type);
  if (event4.type === "submit") {
    event4.detail ??= {};
    event4.detail.formData = [...new FormData(event4.target).entries()];
  }
  handler(event4);
};
var createServerEvent = (event4, include = []) => {
  const data = {};
  if (event4.type === "input" || event4.type === "change") {
    include.push("target.value");
  }
  if (event4.type === "submit") {
    include.push("detail.formData");
  }
  for (const property3 of include) {
    const path = property3.split(".");
    for (let i = 0, input2 = event4, output = data; i < path.length; i++) {
      if (i === path.length - 1) {
        output[path[i]] = input2[path[i]];
        break;
      }
      output = output[path[i]] ??= {};
      input2 = input2[path[i]];
    }
  }
  return data;
};
var syncedBooleanAttribute = (name) => {
  return {
    added(node) {
      node[name] = true;
    },
    removed(node) {
      node[name] = false;
    }
  };
};
var syncedAttribute = (name) => {
  return {
    added(node, value2) {
      node[name] = value2;
    }
  };
};
var SYNCED_ATTRIBUTES = {
  checked: syncedBooleanAttribute("checked"),
  selected: syncedBooleanAttribute("selected"),
  value: syncedAttribute("value"),
  autofocus: {
    added(node) {
      queueMicrotask(() => node.focus?.());
    }
  },
  autoplay: {
    added(node) {
      try {
        node.play?.();
      } catch (e) {
        console.error(e);
      }
    }
  }
};

// build/dev/javascript/lustre/lustre/vdom/virtualise.ffi.mjs
var virtualise = (root3) => {
  const vdom = virtualiseNode(null, root3, "");
  if (vdom === null || vdom.children instanceof Empty) {
    const empty4 = emptyTextNode(root3);
    root3.appendChild(empty4);
    return none2();
  } else if (vdom.children instanceof NonEmpty && vdom.children.tail instanceof Empty) {
    return vdom.children.head;
  } else {
    const head = emptyTextNode(root3);
    root3.insertBefore(head, root3.firstChild);
    return fragment2(vdom.children);
  }
};
var emptyTextNode = (parent) => {
  const node = document().createTextNode("");
  initialiseMetadata(parent, node);
  return node;
};
var virtualiseNode = (parent, node, index5) => {
  switch (node.nodeType) {
    case ELEMENT_NODE: {
      const key = node.getAttribute("data-lustre-key");
      initialiseMetadata(parent, node, index5, key);
      if (key) {
        node.removeAttribute("data-lustre-key");
      }
      const tag = node.localName;
      const namespace = node.namespaceURI;
      const isHtmlElement = !namespace || namespace === NAMESPACE_HTML;
      if (isHtmlElement && INPUT_ELEMENTS.includes(tag)) {
        virtualiseInputEvents(tag, node);
      }
      const attributes = virtualiseAttributes(node);
      const children = virtualiseChildNodes(node);
      const vnode = isHtmlElement ? element2(tag, attributes, children) : namespaced(namespace, tag, attributes, children);
      return key ? to_keyed(key, vnode) : vnode;
    }
    case TEXT_NODE:
      initialiseMetadata(parent, node, index5);
      return node.data ? text2(node.data) : null;
    case DOCUMENT_FRAGMENT_NODE:
      initialiseMetadata(parent, node, index5);
      return node.childNodes.length > 0 ? fragment2(virtualiseChildNodes(node)) : null;
    default:
      return null;
  }
};
var INPUT_ELEMENTS = ["input", "select", "textarea"];
var virtualiseInputEvents = (tag, node) => {
  const value2 = node.value;
  const checked = node.checked;
  if (tag === "input" && node.type === "checkbox" && !checked) return;
  if (tag === "input" && node.type === "radio" && !checked) return;
  if (node.type !== "checkbox" && node.type !== "radio" && !value2) return;
  queueMicrotask(() => {
    node.value = value2;
    node.checked = checked;
    node.dispatchEvent(new Event("input", { bubbles: true }));
    node.dispatchEvent(new Event("change", { bubbles: true }));
    if (document().activeElement !== node) {
      node.dispatchEvent(new Event("blur", { bubbles: true }));
    }
  });
};
var virtualiseChildNodes = (node) => {
  let children = null;
  let index5 = 0;
  let child = node.firstChild;
  let ptr = null;
  while (child) {
    const vnode = virtualiseNode(node, child, index5);
    const next = child.nextSibling;
    if (vnode) {
      const list_node = new NonEmpty(vnode, null);
      if (ptr) {
        ptr = ptr.tail = list_node;
      } else {
        ptr = children = list_node;
      }
      index5 += 1;
    } else {
      node.removeChild(child);
    }
    child = next;
  }
  if (!ptr) return empty_list;
  ptr.tail = empty_list;
  return children;
};
var virtualiseAttributes = (node) => {
  let index5 = node.attributes.length;
  let attributes = empty_list;
  while (index5-- > 0) {
    attributes = new NonEmpty(
      virtualiseAttribute(node.attributes[index5]),
      attributes
    );
  }
  return attributes;
};
var virtualiseAttribute = (attr) => {
  const name = attr.localName;
  const value2 = attr.value;
  return attribute2(name, value2);
};

// build/dev/javascript/lustre/lustre/runtime/client/runtime.ffi.mjs
var is_browser = () => !!document();
var Runtime = class {
  constructor(root3, [model, effects], view3, update4) {
    this.root = root3;
    this.#model = model;
    this.#view = view3;
    this.#update = update4;
    this.#reconciler = new Reconciler(this.root, (event4, path, name) => {
      const [events, result] = handle(this.#events, path, name, event4);
      this.#events = events;
      if (result.isOk()) {
        const handler = result[0];
        if (handler.stop_propagation) event4.stopPropagation();
        if (handler.prevent_default) event4.preventDefault();
        this.dispatch(handler.message, false);
      }
    });
    this.#vdom = virtualise(this.root);
    this.#events = new$3();
    this.#shouldFlush = true;
    this.#tick(effects);
  }
  // PUBLIC API ----------------------------------------------------------------
  root = null;
  set offset(offset) {
    this.#reconciler.offset = offset;
  }
  dispatch(msg, immediate2 = false) {
    this.#shouldFlush ||= immediate2;
    if (this.#shouldQueue) {
      this.#queue.push(msg);
    } else {
      const [model, effects] = this.#update(this.#model, msg);
      this.#model = model;
      this.#tick(effects);
    }
  }
  emit(event4, data) {
    const target = this.root.host ?? this.root;
    target.dispatchEvent(
      new CustomEvent(event4, {
        detail: data,
        bubbles: true,
        composed: true
      })
    );
  }
  // PRIVATE API ---------------------------------------------------------------
  #model;
  #view;
  #update;
  #vdom;
  #events;
  #reconciler;
  #shouldQueue = false;
  #queue = [];
  #beforePaint = empty_list;
  #afterPaint = empty_list;
  #renderTimer = null;
  #shouldFlush = false;
  #actions = {
    dispatch: (msg, immediate2) => this.dispatch(msg, immediate2),
    emit: (event4, data) => this.emit(event4, data),
    select: () => {
    },
    root: () => this.root
  };
  // A `#tick` is where we process effects and trigger any synchronous updates.
  // Once a tick has been processed a render will be scheduled if none is already.
  // p0
  #tick(effects) {
    this.#shouldQueue = true;
    while (true) {
      for (let list4 = effects.synchronous; list4.tail; list4 = list4.tail) {
        list4.head(this.#actions);
      }
      this.#beforePaint = listAppend(this.#beforePaint, effects.before_paint);
      this.#afterPaint = listAppend(this.#afterPaint, effects.after_paint);
      if (!this.#queue.length) break;
      [this.#model, effects] = this.#update(this.#model, this.#queue.shift());
    }
    this.#shouldQueue = false;
    if (this.#shouldFlush) {
      cancelAnimationFrame(this.#renderTimer);
      this.#render();
    } else if (!this.#renderTimer) {
      this.#renderTimer = requestAnimationFrame(() => {
        this.#render();
      });
    }
  }
  #render() {
    this.#shouldFlush = false;
    this.#renderTimer = null;
    const next = this.#view(this.#model);
    const { patch, events } = diff(this.#events, this.#vdom, next);
    this.#events = events;
    this.#vdom = next;
    this.#reconciler.push(patch);
    if (this.#beforePaint instanceof NonEmpty) {
      const effects = makeEffect(this.#beforePaint);
      this.#beforePaint = empty_list;
      queueMicrotask(() => {
        this.#shouldFlush = true;
        this.#tick(effects);
      });
    }
    if (this.#afterPaint instanceof NonEmpty) {
      const effects = makeEffect(this.#afterPaint);
      this.#afterPaint = empty_list;
      requestAnimationFrame(() => {
        this.#shouldFlush = true;
        this.#tick(effects);
      });
    }
  }
};
function makeEffect(synchronous) {
  return {
    synchronous,
    after_paint: empty_list,
    before_paint: empty_list
  };
}
function listAppend(a, b) {
  if (a instanceof Empty) {
    return b;
  } else if (b instanceof Empty) {
    return a;
  } else {
    return append(a, b);
  }
}

// build/dev/javascript/lustre/lustre/runtime/server/runtime.mjs
var EffectDispatchedMessage = class extends CustomType {
  constructor(message2) {
    super();
    this.message = message2;
  }
};
var EffectEmitEvent = class extends CustomType {
  constructor(name, data) {
    super();
    this.name = name;
    this.data = data;
  }
};
var SystemRequestedShutdown = class extends CustomType {
};

// build/dev/javascript/lustre/lustre/component.mjs
var Config2 = class extends CustomType {
  constructor(open_shadow_root, adopt_styles, attributes, properties, is_form_associated, on_form_autofill, on_form_reset, on_form_restore) {
    super();
    this.open_shadow_root = open_shadow_root;
    this.adopt_styles = adopt_styles;
    this.attributes = attributes;
    this.properties = properties;
    this.is_form_associated = is_form_associated;
    this.on_form_autofill = on_form_autofill;
    this.on_form_reset = on_form_reset;
    this.on_form_restore = on_form_restore;
  }
};
function new$6(options) {
  let init3 = new Config2(
    false,
    true,
    empty_dict(),
    empty_dict(),
    false,
    option_none,
    option_none,
    option_none
  );
  return fold(
    options,
    init3,
    (config, option) => {
      return option.apply(config);
    }
  );
}

// build/dev/javascript/lustre/lustre/runtime/client/spa.ffi.mjs
var Spa = class _Spa {
  static start({ init: init3, update: update4, view: view3 }, selector, flags) {
    if (!is_browser()) return new Error(new NotABrowser());
    const root3 = selector instanceof HTMLElement ? selector : document().querySelector(selector);
    if (!root3) return new Error(new ElementNotFound(selector));
    return new Ok(new _Spa(root3, init3(flags), update4, view3));
  }
  #runtime;
  constructor(root3, [init3, effects], update4, view3) {
    this.#runtime = new Runtime(root3, [init3, effects], view3, update4);
  }
  send(message2) {
    switch (message2.constructor) {
      case EffectDispatchedMessage: {
        this.dispatch(message2.message, false);
        break;
      }
      case EffectEmitEvent: {
        this.emit(message2.name, message2.data);
        break;
      }
      case SystemRequestedShutdown:
        break;
    }
  }
  dispatch(msg, immediate2) {
    this.#runtime.dispatch(msg, immediate2);
  }
  emit(event4, data) {
    this.#runtime.emit(event4, data);
  }
};
var start = Spa.start;

// build/dev/javascript/lustre/lustre.mjs
var App = class extends CustomType {
  constructor(init3, update4, view3, config) {
    super();
    this.init = init3;
    this.update = update4;
    this.view = view3;
    this.config = config;
  }
};
var ElementNotFound = class extends CustomType {
  constructor(selector) {
    super();
    this.selector = selector;
  }
};
var NotABrowser = class extends CustomType {
};
function application(init3, update4, view3) {
  return new App(init3, update4, view3, new$6(empty_list));
}
function start3(app, selector, start_args) {
  return guard(
    !is_browser(),
    new Error(new NotABrowser()),
    () => {
      return start(app, selector, start_args);
    }
  );
}

// build/dev/javascript/gleam_stdlib/gleam/uri.mjs
var Uri = class extends CustomType {
  constructor(scheme, userinfo, host, port, path, query, fragment3) {
    super();
    this.scheme = scheme;
    this.userinfo = userinfo;
    this.host = host;
    this.port = port;
    this.path = path;
    this.query = query;
    this.fragment = fragment3;
  }
};
function is_valid_host_within_brackets_char(char) {
  return 48 >= char && char <= 57 || 65 >= char && char <= 90 || 97 >= char && char <= 122 || char === 58 || char === 46;
}
function parse_fragment(rest, pieces) {
  return new Ok(
    (() => {
      let _record = pieces;
      return new Uri(
        _record.scheme,
        _record.userinfo,
        _record.host,
        _record.port,
        _record.path,
        _record.query,
        new Some(rest)
      );
    })()
  );
}
function parse_query_with_question_mark_loop(loop$original, loop$uri_string, loop$pieces, loop$size) {
  while (true) {
    let original = loop$original;
    let uri_string = loop$uri_string;
    let pieces = loop$pieces;
    let size2 = loop$size;
    if (uri_string.startsWith("#")) {
      if (size2 === 0) {
        let rest = uri_string.slice(1);
        return parse_fragment(rest, pieces);
      } else {
        let rest = uri_string.slice(1);
        let query = string_codeunit_slice(original, 0, size2);
        let _block;
        let _record = pieces;
        _block = new Uri(
          _record.scheme,
          _record.userinfo,
          _record.host,
          _record.port,
          _record.path,
          new Some(query),
          _record.fragment
        );
        let pieces$1 = _block;
        return parse_fragment(rest, pieces$1);
      }
    } else if (uri_string === "") {
      return new Ok(
        (() => {
          let _record = pieces;
          return new Uri(
            _record.scheme,
            _record.userinfo,
            _record.host,
            _record.port,
            _record.path,
            new Some(original),
            _record.fragment
          );
        })()
      );
    } else {
      let $ = pop_codeunit(uri_string);
      let rest = $[1];
      loop$original = original;
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$size = size2 + 1;
    }
  }
}
function parse_query_with_question_mark(uri_string, pieces) {
  return parse_query_with_question_mark_loop(uri_string, uri_string, pieces, 0);
}
function parse_path_loop(loop$original, loop$uri_string, loop$pieces, loop$size) {
  while (true) {
    let original = loop$original;
    let uri_string = loop$uri_string;
    let pieces = loop$pieces;
    let size2 = loop$size;
    if (uri_string.startsWith("?")) {
      let rest = uri_string.slice(1);
      let path = string_codeunit_slice(original, 0, size2);
      let _block;
      let _record = pieces;
      _block = new Uri(
        _record.scheme,
        _record.userinfo,
        _record.host,
        _record.port,
        path,
        _record.query,
        _record.fragment
      );
      let pieces$1 = _block;
      return parse_query_with_question_mark(rest, pieces$1);
    } else if (uri_string.startsWith("#")) {
      let rest = uri_string.slice(1);
      let path = string_codeunit_slice(original, 0, size2);
      let _block;
      let _record = pieces;
      _block = new Uri(
        _record.scheme,
        _record.userinfo,
        _record.host,
        _record.port,
        path,
        _record.query,
        _record.fragment
      );
      let pieces$1 = _block;
      return parse_fragment(rest, pieces$1);
    } else if (uri_string === "") {
      return new Ok(
        (() => {
          let _record = pieces;
          return new Uri(
            _record.scheme,
            _record.userinfo,
            _record.host,
            _record.port,
            original,
            _record.query,
            _record.fragment
          );
        })()
      );
    } else {
      let $ = pop_codeunit(uri_string);
      let rest = $[1];
      loop$original = original;
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$size = size2 + 1;
    }
  }
}
function parse_path(uri_string, pieces) {
  return parse_path_loop(uri_string, uri_string, pieces, 0);
}
function parse_port_loop(loop$uri_string, loop$pieces, loop$port) {
  while (true) {
    let uri_string = loop$uri_string;
    let pieces = loop$pieces;
    let port = loop$port;
    if (uri_string.startsWith("0")) {
      let rest = uri_string.slice(1);
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$port = port * 10;
    } else if (uri_string.startsWith("1")) {
      let rest = uri_string.slice(1);
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$port = port * 10 + 1;
    } else if (uri_string.startsWith("2")) {
      let rest = uri_string.slice(1);
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$port = port * 10 + 2;
    } else if (uri_string.startsWith("3")) {
      let rest = uri_string.slice(1);
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$port = port * 10 + 3;
    } else if (uri_string.startsWith("4")) {
      let rest = uri_string.slice(1);
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$port = port * 10 + 4;
    } else if (uri_string.startsWith("5")) {
      let rest = uri_string.slice(1);
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$port = port * 10 + 5;
    } else if (uri_string.startsWith("6")) {
      let rest = uri_string.slice(1);
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$port = port * 10 + 6;
    } else if (uri_string.startsWith("7")) {
      let rest = uri_string.slice(1);
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$port = port * 10 + 7;
    } else if (uri_string.startsWith("8")) {
      let rest = uri_string.slice(1);
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$port = port * 10 + 8;
    } else if (uri_string.startsWith("9")) {
      let rest = uri_string.slice(1);
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$port = port * 10 + 9;
    } else if (uri_string.startsWith("?")) {
      let rest = uri_string.slice(1);
      let _block;
      let _record = pieces;
      _block = new Uri(
        _record.scheme,
        _record.userinfo,
        _record.host,
        new Some(port),
        _record.path,
        _record.query,
        _record.fragment
      );
      let pieces$1 = _block;
      return parse_query_with_question_mark(rest, pieces$1);
    } else if (uri_string.startsWith("#")) {
      let rest = uri_string.slice(1);
      let _block;
      let _record = pieces;
      _block = new Uri(
        _record.scheme,
        _record.userinfo,
        _record.host,
        new Some(port),
        _record.path,
        _record.query,
        _record.fragment
      );
      let pieces$1 = _block;
      return parse_fragment(rest, pieces$1);
    } else if (uri_string.startsWith("/")) {
      let _block;
      let _record = pieces;
      _block = new Uri(
        _record.scheme,
        _record.userinfo,
        _record.host,
        new Some(port),
        _record.path,
        _record.query,
        _record.fragment
      );
      let pieces$1 = _block;
      return parse_path(uri_string, pieces$1);
    } else if (uri_string === "") {
      return new Ok(
        (() => {
          let _record = pieces;
          return new Uri(
            _record.scheme,
            _record.userinfo,
            _record.host,
            new Some(port),
            _record.path,
            _record.query,
            _record.fragment
          );
        })()
      );
    } else {
      return new Error(void 0);
    }
  }
}
function parse_port(uri_string, pieces) {
  if (uri_string.startsWith(":0")) {
    let rest = uri_string.slice(2);
    return parse_port_loop(rest, pieces, 0);
  } else if (uri_string.startsWith(":1")) {
    let rest = uri_string.slice(2);
    return parse_port_loop(rest, pieces, 1);
  } else if (uri_string.startsWith(":2")) {
    let rest = uri_string.slice(2);
    return parse_port_loop(rest, pieces, 2);
  } else if (uri_string.startsWith(":3")) {
    let rest = uri_string.slice(2);
    return parse_port_loop(rest, pieces, 3);
  } else if (uri_string.startsWith(":4")) {
    let rest = uri_string.slice(2);
    return parse_port_loop(rest, pieces, 4);
  } else if (uri_string.startsWith(":5")) {
    let rest = uri_string.slice(2);
    return parse_port_loop(rest, pieces, 5);
  } else if (uri_string.startsWith(":6")) {
    let rest = uri_string.slice(2);
    return parse_port_loop(rest, pieces, 6);
  } else if (uri_string.startsWith(":7")) {
    let rest = uri_string.slice(2);
    return parse_port_loop(rest, pieces, 7);
  } else if (uri_string.startsWith(":8")) {
    let rest = uri_string.slice(2);
    return parse_port_loop(rest, pieces, 8);
  } else if (uri_string.startsWith(":9")) {
    let rest = uri_string.slice(2);
    return parse_port_loop(rest, pieces, 9);
  } else if (uri_string.startsWith(":")) {
    return new Error(void 0);
  } else if (uri_string.startsWith("?")) {
    let rest = uri_string.slice(1);
    return parse_query_with_question_mark(rest, pieces);
  } else if (uri_string.startsWith("#")) {
    let rest = uri_string.slice(1);
    return parse_fragment(rest, pieces);
  } else if (uri_string.startsWith("/")) {
    return parse_path(uri_string, pieces);
  } else if (uri_string === "") {
    return new Ok(pieces);
  } else {
    return new Error(void 0);
  }
}
function parse_host_outside_of_brackets_loop(loop$original, loop$uri_string, loop$pieces, loop$size) {
  while (true) {
    let original = loop$original;
    let uri_string = loop$uri_string;
    let pieces = loop$pieces;
    let size2 = loop$size;
    if (uri_string === "") {
      return new Ok(
        (() => {
          let _record = pieces;
          return new Uri(
            _record.scheme,
            _record.userinfo,
            new Some(original),
            _record.port,
            _record.path,
            _record.query,
            _record.fragment
          );
        })()
      );
    } else if (uri_string.startsWith(":")) {
      let host = string_codeunit_slice(original, 0, size2);
      let _block;
      let _record = pieces;
      _block = new Uri(
        _record.scheme,
        _record.userinfo,
        new Some(host),
        _record.port,
        _record.path,
        _record.query,
        _record.fragment
      );
      let pieces$1 = _block;
      return parse_port(uri_string, pieces$1);
    } else if (uri_string.startsWith("/")) {
      let host = string_codeunit_slice(original, 0, size2);
      let _block;
      let _record = pieces;
      _block = new Uri(
        _record.scheme,
        _record.userinfo,
        new Some(host),
        _record.port,
        _record.path,
        _record.query,
        _record.fragment
      );
      let pieces$1 = _block;
      return parse_path(uri_string, pieces$1);
    } else if (uri_string.startsWith("?")) {
      let rest = uri_string.slice(1);
      let host = string_codeunit_slice(original, 0, size2);
      let _block;
      let _record = pieces;
      _block = new Uri(
        _record.scheme,
        _record.userinfo,
        new Some(host),
        _record.port,
        _record.path,
        _record.query,
        _record.fragment
      );
      let pieces$1 = _block;
      return parse_query_with_question_mark(rest, pieces$1);
    } else if (uri_string.startsWith("#")) {
      let rest = uri_string.slice(1);
      let host = string_codeunit_slice(original, 0, size2);
      let _block;
      let _record = pieces;
      _block = new Uri(
        _record.scheme,
        _record.userinfo,
        new Some(host),
        _record.port,
        _record.path,
        _record.query,
        _record.fragment
      );
      let pieces$1 = _block;
      return parse_fragment(rest, pieces$1);
    } else {
      let $ = pop_codeunit(uri_string);
      let rest = $[1];
      loop$original = original;
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$size = size2 + 1;
    }
  }
}
function parse_host_within_brackets_loop(loop$original, loop$uri_string, loop$pieces, loop$size) {
  while (true) {
    let original = loop$original;
    let uri_string = loop$uri_string;
    let pieces = loop$pieces;
    let size2 = loop$size;
    if (uri_string === "") {
      return new Ok(
        (() => {
          let _record = pieces;
          return new Uri(
            _record.scheme,
            _record.userinfo,
            new Some(uri_string),
            _record.port,
            _record.path,
            _record.query,
            _record.fragment
          );
        })()
      );
    } else if (uri_string.startsWith("]")) {
      if (size2 === 0) {
        let rest = uri_string.slice(1);
        return parse_port(rest, pieces);
      } else {
        let rest = uri_string.slice(1);
        let host = string_codeunit_slice(original, 0, size2 + 1);
        let _block;
        let _record = pieces;
        _block = new Uri(
          _record.scheme,
          _record.userinfo,
          new Some(host),
          _record.port,
          _record.path,
          _record.query,
          _record.fragment
        );
        let pieces$1 = _block;
        return parse_port(rest, pieces$1);
      }
    } else if (uri_string.startsWith("/")) {
      if (size2 === 0) {
        return parse_path(uri_string, pieces);
      } else {
        let host = string_codeunit_slice(original, 0, size2);
        let _block;
        let _record = pieces;
        _block = new Uri(
          _record.scheme,
          _record.userinfo,
          new Some(host),
          _record.port,
          _record.path,
          _record.query,
          _record.fragment
        );
        let pieces$1 = _block;
        return parse_path(uri_string, pieces$1);
      }
    } else if (uri_string.startsWith("?")) {
      if (size2 === 0) {
        let rest = uri_string.slice(1);
        return parse_query_with_question_mark(rest, pieces);
      } else {
        let rest = uri_string.slice(1);
        let host = string_codeunit_slice(original, 0, size2);
        let _block;
        let _record = pieces;
        _block = new Uri(
          _record.scheme,
          _record.userinfo,
          new Some(host),
          _record.port,
          _record.path,
          _record.query,
          _record.fragment
        );
        let pieces$1 = _block;
        return parse_query_with_question_mark(rest, pieces$1);
      }
    } else if (uri_string.startsWith("#")) {
      if (size2 === 0) {
        let rest = uri_string.slice(1);
        return parse_fragment(rest, pieces);
      } else {
        let rest = uri_string.slice(1);
        let host = string_codeunit_slice(original, 0, size2);
        let _block;
        let _record = pieces;
        _block = new Uri(
          _record.scheme,
          _record.userinfo,
          new Some(host),
          _record.port,
          _record.path,
          _record.query,
          _record.fragment
        );
        let pieces$1 = _block;
        return parse_fragment(rest, pieces$1);
      }
    } else {
      let $ = pop_codeunit(uri_string);
      let char = $[0];
      let rest = $[1];
      let $1 = is_valid_host_within_brackets_char(char);
      if ($1) {
        loop$original = original;
        loop$uri_string = rest;
        loop$pieces = pieces;
        loop$size = size2 + 1;
      } else {
        return parse_host_outside_of_brackets_loop(
          original,
          original,
          pieces,
          0
        );
      }
    }
  }
}
function parse_host_within_brackets(uri_string, pieces) {
  return parse_host_within_brackets_loop(uri_string, uri_string, pieces, 0);
}
function parse_host_outside_of_brackets(uri_string, pieces) {
  return parse_host_outside_of_brackets_loop(uri_string, uri_string, pieces, 0);
}
function parse_host(uri_string, pieces) {
  if (uri_string.startsWith("[")) {
    return parse_host_within_brackets(uri_string, pieces);
  } else if (uri_string.startsWith(":")) {
    let _block;
    let _record = pieces;
    _block = new Uri(
      _record.scheme,
      _record.userinfo,
      new Some(""),
      _record.port,
      _record.path,
      _record.query,
      _record.fragment
    );
    let pieces$1 = _block;
    return parse_port(uri_string, pieces$1);
  } else if (uri_string === "") {
    return new Ok(
      (() => {
        let _record = pieces;
        return new Uri(
          _record.scheme,
          _record.userinfo,
          new Some(""),
          _record.port,
          _record.path,
          _record.query,
          _record.fragment
        );
      })()
    );
  } else {
    return parse_host_outside_of_brackets(uri_string, pieces);
  }
}
function parse_userinfo_loop(loop$original, loop$uri_string, loop$pieces, loop$size) {
  while (true) {
    let original = loop$original;
    let uri_string = loop$uri_string;
    let pieces = loop$pieces;
    let size2 = loop$size;
    if (uri_string.startsWith("@")) {
      if (size2 === 0) {
        let rest = uri_string.slice(1);
        return parse_host(rest, pieces);
      } else {
        let rest = uri_string.slice(1);
        let userinfo = string_codeunit_slice(original, 0, size2);
        let _block;
        let _record = pieces;
        _block = new Uri(
          _record.scheme,
          new Some(userinfo),
          _record.host,
          _record.port,
          _record.path,
          _record.query,
          _record.fragment
        );
        let pieces$1 = _block;
        return parse_host(rest, pieces$1);
      }
    } else if (uri_string === "") {
      return parse_host(original, pieces);
    } else if (uri_string.startsWith("/")) {
      return parse_host(original, pieces);
    } else if (uri_string.startsWith("?")) {
      return parse_host(original, pieces);
    } else if (uri_string.startsWith("#")) {
      return parse_host(original, pieces);
    } else {
      let $ = pop_codeunit(uri_string);
      let rest = $[1];
      loop$original = original;
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$size = size2 + 1;
    }
  }
}
function parse_authority_pieces(string5, pieces) {
  return parse_userinfo_loop(string5, string5, pieces, 0);
}
function parse_authority_with_slashes(uri_string, pieces) {
  if (uri_string === "//") {
    return new Ok(
      (() => {
        let _record = pieces;
        return new Uri(
          _record.scheme,
          _record.userinfo,
          new Some(""),
          _record.port,
          _record.path,
          _record.query,
          _record.fragment
        );
      })()
    );
  } else if (uri_string.startsWith("//")) {
    let rest = uri_string.slice(2);
    return parse_authority_pieces(rest, pieces);
  } else {
    return parse_path(uri_string, pieces);
  }
}
function parse_scheme_loop(loop$original, loop$uri_string, loop$pieces, loop$size) {
  while (true) {
    let original = loop$original;
    let uri_string = loop$uri_string;
    let pieces = loop$pieces;
    let size2 = loop$size;
    if (uri_string.startsWith("/")) {
      if (size2 === 0) {
        return parse_authority_with_slashes(uri_string, pieces);
      } else {
        let scheme = string_codeunit_slice(original, 0, size2);
        let _block;
        let _record = pieces;
        _block = new Uri(
          new Some(lowercase(scheme)),
          _record.userinfo,
          _record.host,
          _record.port,
          _record.path,
          _record.query,
          _record.fragment
        );
        let pieces$1 = _block;
        return parse_authority_with_slashes(uri_string, pieces$1);
      }
    } else if (uri_string.startsWith("?")) {
      if (size2 === 0) {
        let rest = uri_string.slice(1);
        return parse_query_with_question_mark(rest, pieces);
      } else {
        let rest = uri_string.slice(1);
        let scheme = string_codeunit_slice(original, 0, size2);
        let _block;
        let _record = pieces;
        _block = new Uri(
          new Some(lowercase(scheme)),
          _record.userinfo,
          _record.host,
          _record.port,
          _record.path,
          _record.query,
          _record.fragment
        );
        let pieces$1 = _block;
        return parse_query_with_question_mark(rest, pieces$1);
      }
    } else if (uri_string.startsWith("#")) {
      if (size2 === 0) {
        let rest = uri_string.slice(1);
        return parse_fragment(rest, pieces);
      } else {
        let rest = uri_string.slice(1);
        let scheme = string_codeunit_slice(original, 0, size2);
        let _block;
        let _record = pieces;
        _block = new Uri(
          new Some(lowercase(scheme)),
          _record.userinfo,
          _record.host,
          _record.port,
          _record.path,
          _record.query,
          _record.fragment
        );
        let pieces$1 = _block;
        return parse_fragment(rest, pieces$1);
      }
    } else if (uri_string.startsWith(":")) {
      if (size2 === 0) {
        return new Error(void 0);
      } else {
        let rest = uri_string.slice(1);
        let scheme = string_codeunit_slice(original, 0, size2);
        let _block;
        let _record = pieces;
        _block = new Uri(
          new Some(lowercase(scheme)),
          _record.userinfo,
          _record.host,
          _record.port,
          _record.path,
          _record.query,
          _record.fragment
        );
        let pieces$1 = _block;
        return parse_authority_with_slashes(rest, pieces$1);
      }
    } else if (uri_string === "") {
      return new Ok(
        (() => {
          let _record = pieces;
          return new Uri(
            _record.scheme,
            _record.userinfo,
            _record.host,
            _record.port,
            original,
            _record.query,
            _record.fragment
          );
        })()
      );
    } else {
      let $ = pop_codeunit(uri_string);
      let rest = $[1];
      loop$original = original;
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$size = size2 + 1;
    }
  }
}
function to_string4(uri) {
  let _block;
  let $ = uri.fragment;
  if ($ instanceof Some) {
    let fragment3 = $[0];
    _block = toList(["#", fragment3]);
  } else {
    _block = toList([]);
  }
  let parts = _block;
  let _block$1;
  let $1 = uri.query;
  if ($1 instanceof Some) {
    let query = $1[0];
    _block$1 = prepend("?", prepend(query, parts));
  } else {
    _block$1 = parts;
  }
  let parts$1 = _block$1;
  let parts$2 = prepend(uri.path, parts$1);
  let _block$2;
  let $2 = uri.host;
  let $3 = starts_with(uri.path, "/");
  if (!$3) {
    if ($2 instanceof Some) {
      let host = $2[0];
      if (host !== "") {
        _block$2 = prepend("/", parts$2);
      } else {
        _block$2 = parts$2;
      }
    } else {
      _block$2 = parts$2;
    }
  } else {
    _block$2 = parts$2;
  }
  let parts$3 = _block$2;
  let _block$3;
  let $4 = uri.host;
  let $5 = uri.port;
  if ($5 instanceof Some) {
    if ($4 instanceof Some) {
      let port = $5[0];
      _block$3 = prepend(":", prepend(to_string(port), parts$3));
    } else {
      _block$3 = parts$3;
    }
  } else {
    _block$3 = parts$3;
  }
  let parts$4 = _block$3;
  let _block$4;
  let $6 = uri.scheme;
  let $7 = uri.userinfo;
  let $8 = uri.host;
  if ($8 instanceof Some) {
    if ($7 instanceof Some) {
      if ($6 instanceof Some) {
        let h = $8[0];
        let u = $7[0];
        let s = $6[0];
        _block$4 = prepend(
          s,
          prepend(
            "://",
            prepend(u, prepend("@", prepend(h, parts$4)))
          )
        );
      } else {
        _block$4 = parts$4;
      }
    } else if ($6 instanceof Some) {
      let h = $8[0];
      let s = $6[0];
      _block$4 = prepend(s, prepend("://", prepend(h, parts$4)));
    } else {
      let h = $8[0];
      _block$4 = prepend("//", prepend(h, parts$4));
    }
  } else if ($7 instanceof Some) {
    if ($6 instanceof Some) {
      let s = $6[0];
      _block$4 = prepend(s, prepend(":", parts$4));
    } else {
      _block$4 = parts$4;
    }
  } else if ($6 instanceof Some) {
    let s = $6[0];
    _block$4 = prepend(s, prepend(":", parts$4));
  } else {
    _block$4 = parts$4;
  }
  let parts$5 = _block$4;
  return concat2(parts$5);
}
var empty3 = /* @__PURE__ */ new Uri(
  /* @__PURE__ */ new None(),
  /* @__PURE__ */ new None(),
  /* @__PURE__ */ new None(),
  /* @__PURE__ */ new None(),
  "",
  /* @__PURE__ */ new None(),
  /* @__PURE__ */ new None()
);
function parse2(uri_string) {
  return parse_scheme_loop(uri_string, uri_string, empty3, 0);
}

// build/dev/javascript/gleam_http/gleam/http.mjs
var Get = class extends CustomType {
};
var Post = class extends CustomType {
};
var Head = class extends CustomType {
};
var Put = class extends CustomType {
};
var Delete = class extends CustomType {
};
var Trace = class extends CustomType {
};
var Connect = class extends CustomType {
};
var Options = class extends CustomType {
};
var Patch2 = class extends CustomType {
};
var Http = class extends CustomType {
};
var Https = class extends CustomType {
};
function method_to_string(method) {
  if (method instanceof Get) {
    return "GET";
  } else if (method instanceof Post) {
    return "POST";
  } else if (method instanceof Head) {
    return "HEAD";
  } else if (method instanceof Put) {
    return "PUT";
  } else if (method instanceof Delete) {
    return "DELETE";
  } else if (method instanceof Trace) {
    return "TRACE";
  } else if (method instanceof Connect) {
    return "CONNECT";
  } else if (method instanceof Options) {
    return "OPTIONS";
  } else if (method instanceof Patch2) {
    return "PATCH";
  } else {
    let s = method[0];
    return s;
  }
}
function scheme_to_string(scheme) {
  if (scheme instanceof Http) {
    return "http";
  } else {
    return "https";
  }
}
function scheme_from_string(scheme) {
  let $ = lowercase(scheme);
  if ($ === "http") {
    return new Ok(new Http());
  } else if ($ === "https") {
    return new Ok(new Https());
  } else {
    return new Error(void 0);
  }
}

// build/dev/javascript/gleam_http/gleam/http/request.mjs
var Request = class extends CustomType {
  constructor(method, headers, body, scheme, host, port, path, query) {
    super();
    this.method = method;
    this.headers = headers;
    this.body = body;
    this.scheme = scheme;
    this.host = host;
    this.port = port;
    this.path = path;
    this.query = query;
  }
};
function to_uri(request) {
  return new Uri(
    new Some(scheme_to_string(request.scheme)),
    new None(),
    new Some(request.host),
    request.port,
    request.path,
    request.query,
    new None()
  );
}
function from_uri(uri) {
  return try$(
    (() => {
      let _pipe = uri.scheme;
      let _pipe$1 = unwrap(_pipe, "");
      return scheme_from_string(_pipe$1);
    })(),
    (scheme) => {
      return try$(
        (() => {
          let _pipe = uri.host;
          return to_result(_pipe, void 0);
        })(),
        (host) => {
          let req = new Request(
            new Get(),
            toList([]),
            "",
            scheme,
            host,
            uri.port,
            uri.path,
            uri.query
          );
          return new Ok(req);
        }
      );
    }
  );
}

// build/dev/javascript/gleam_http/gleam/http/response.mjs
var Response = class extends CustomType {
  constructor(status, headers, body) {
    super();
    this.status = status;
    this.headers = headers;
    this.body = body;
  }
};
function get_header(response, key) {
  return key_find(response.headers, lowercase(key));
}

// build/dev/javascript/gleam_javascript/gleam_javascript_ffi.mjs
var PromiseLayer = class _PromiseLayer {
  constructor(promise) {
    this.promise = promise;
  }
  static wrap(value2) {
    return value2 instanceof Promise ? new _PromiseLayer(value2) : value2;
  }
  static unwrap(value2) {
    return value2 instanceof _PromiseLayer ? value2.promise : value2;
  }
};
function resolve(value2) {
  return Promise.resolve(PromiseLayer.wrap(value2));
}
function then_await(promise, fn) {
  return promise.then((value2) => fn(PromiseLayer.unwrap(value2)));
}
function map_promise(promise, fn) {
  return promise.then(
    (value2) => PromiseLayer.wrap(fn(PromiseLayer.unwrap(value2)))
  );
}

// build/dev/javascript/gleam_javascript/gleam/javascript/promise.mjs
function tap(promise, callback) {
  let _pipe = promise;
  return map_promise(
    _pipe,
    (a) => {
      callback(a);
      return a;
    }
  );
}
function try_await(promise, callback) {
  let _pipe = promise;
  return then_await(
    _pipe,
    (result) => {
      if (result instanceof Ok) {
        let a = result[0];
        return callback(a);
      } else {
        let e = result[0];
        return resolve(new Error(e));
      }
    }
  );
}

// build/dev/javascript/gleam_fetch/gleam_fetch_ffi.mjs
async function raw_send(request) {
  try {
    return new Ok(await fetch(request));
  } catch (error) {
    return new Error(new NetworkError(error.toString()));
  }
}
function from_fetch_response(response) {
  return new Response(
    response.status,
    List.fromArray([...response.headers]),
    response
  );
}
function request_common(request) {
  let url = to_string4(to_uri(request));
  let method = method_to_string(request.method).toUpperCase();
  let options = {
    headers: make_headers(request.headers),
    method
  };
  return [url, options];
}
function to_fetch_request(request) {
  let [url, options] = request_common(request);
  if (options.method !== "GET" && options.method !== "HEAD") options.body = request.body;
  return new globalThis.Request(url, options);
}
function make_headers(headersList) {
  let headers = new globalThis.Headers();
  for (let [k, v] of headersList) headers.append(k.toLowerCase(), v);
  return headers;
}
async function read_text_body(response) {
  let body;
  try {
    body = await response.body.text();
  } catch (error) {
    return new Error(new UnableToReadBody());
  }
  return new Ok(response.withFields({ body }));
}

// build/dev/javascript/gleam_fetch/gleam/fetch.mjs
var NetworkError = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var UnableToReadBody = class extends CustomType {
};
function send2(request) {
  let _pipe = request;
  let _pipe$1 = to_fetch_request(_pipe);
  let _pipe$2 = raw_send(_pipe$1);
  return try_await(
    _pipe$2,
    (resp) => {
      return resolve(new Ok(from_fetch_response(resp)));
    }
  );
}

// build/dev/javascript/rsvp/rsvp.ffi.mjs
var from_relative_url = (url_string) => {
  if (!globalThis.location) return new Error(void 0);
  const url = new URL(url_string, globalThis.location.href);
  const uri = uri_from_url(url);
  return new Ok(uri);
};
var uri_from_url = (url) => {
  const optional2 = (value2) => value2 ? new Some(value2) : new None();
  return new Uri(
    /* scheme   */
    optional2(url.protocol?.slice(0, -1)),
    /* userinfo */
    new None(),
    /* host     */
    optional2(url.hostname),
    /* port     */
    optional2(url.port && Number(url.port)),
    /* path     */
    url.pathname,
    /* query    */
    optional2(url.search?.slice(1)),
    /* fragment */
    optional2(url.hash?.slice(1))
  );
};

// build/dev/javascript/rsvp/rsvp.mjs
var BadBody = class extends CustomType {
};
var BadUrl = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var HttpError = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var JsonError = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var NetworkError2 = class extends CustomType {
};
var UnhandledResponse = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var Handler2 = class extends CustomType {
  constructor(run2) {
    super();
    this.run = run2;
  }
};
function expect_ok_response(handler) {
  return new Handler2(
    (result) => {
      return handler(
        try$(
          result,
          (response) => {
            let $ = response.status;
            let code = $;
            if (code >= 200 && code < 300) {
              return new Ok(response);
            } else {
              let code$1 = $;
              if (code$1 >= 400 && code$1 < 600) {
                return new Error(new HttpError(response));
              } else {
                return new Error(new UnhandledResponse(response));
              }
            }
          }
        )
      );
    }
  );
}
function expect_json_response(handler) {
  return expect_ok_response(
    (result) => {
      return handler(
        try$(
          result,
          (response) => {
            let $ = get_header(response, "content-type");
            if ($ instanceof Ok) {
              let $1 = $[0];
              if ($1 === "application/json") {
                return new Ok(response);
              } else if ($1.startsWith("application/json;")) {
                return new Ok(response);
              } else {
                return new Error(new UnhandledResponse(response));
              }
            } else {
              return new Error(new UnhandledResponse(response));
            }
          }
        )
      );
    }
  );
}
function do_send(request, handler) {
  return from(
    (dispatch) => {
      let _pipe = send2(request);
      let _pipe$1 = try_await(_pipe, read_text_body);
      let _pipe$2 = map_promise(
        _pipe$1,
        (_capture) => {
          return map_error(
            _capture,
            (error) => {
              if (error instanceof NetworkError) {
                return new NetworkError2();
              } else if (error instanceof UnableToReadBody) {
                return new BadBody();
              } else {
                return new BadBody();
              }
            }
          );
        }
      );
      let _pipe$3 = map_promise(_pipe$2, handler.run);
      tap(_pipe$3, dispatch);
      return void 0;
    }
  );
}
function send3(request, handler) {
  return do_send(request, handler);
}
function reject(err, handler) {
  return from(
    (dispatch) => {
      let _pipe = new Error(err);
      let _pipe$1 = handler.run(_pipe);
      return dispatch(_pipe$1);
    }
  );
}
function decode_json_body(response, decoder) {
  let _pipe = response.body;
  let _pipe$1 = parse(_pipe, decoder);
  return map_error(_pipe$1, (var0) => {
    return new JsonError(var0);
  });
}
function expect_json(decoder, handler) {
  return expect_json_response(
    (result) => {
      let _pipe = result;
      let _pipe$1 = then$(
        _pipe,
        (_capture) => {
          return decode_json_body(_capture, decoder);
        }
      );
      return handler(_pipe$1);
    }
  );
}
function to_uri2(uri_string) {
  let _block;
  if (uri_string.startsWith("./")) {
    _block = from_relative_url(uri_string);
  } else if (uri_string.startsWith("/")) {
    _block = from_relative_url(uri_string);
  } else {
    _block = parse2(uri_string);
  }
  let _pipe = _block;
  return replace_error(_pipe, new BadUrl(uri_string));
}
function get3(url, handler) {
  let $ = to_uri2(url);
  if ($ instanceof Ok) {
    let uri = $[0];
    let _pipe = from_uri(uri);
    let _pipe$1 = map3(
      _pipe,
      (_capture) => {
        return send3(_capture, handler);
      }
    );
    let _pipe$2 = map_error(
      _pipe$1,
      (_) => {
        return reject(new BadUrl(url), handler);
      }
    );
    return unwrap_both(_pipe$2);
  } else {
    let err = $[0];
    return reject(err, handler);
  }
}

// build/dev/javascript/flixxy/flixxy/config.mjs
var tmdb_base_url = "https://api.themoviedb.org/3";
var api_key = "5dcf7f28a88be0edc01bbbde06f024ab";

// build/dev/javascript/flixxy/flixxy/models.mjs
var Movie = class extends CustomType {
  constructor(id, title, overview, release_date, poster_path, vote_average) {
    super();
    this.id = id;
    this.title = title;
    this.overview = overview;
    this.release_date = release_date;
    this.poster_path = poster_path;
    this.vote_average = vote_average;
  }
};
var Model = class extends CustomType {
  constructor(search_query, movies, loading, error) {
    super();
    this.search_query = search_query;
    this.movies = movies;
    this.loading = loading;
    this.error = error;
  }
};
var SearchQueryChanged = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var SearchSubmitted = class extends CustomType {
};
var MoviesLoaded = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var MoviesLoadedLive = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var ClearError = class extends CustomType {
};
function init() {
  return new Model("", toList([]), false, new None());
}
function set_search_query(model, query) {
  let _record = model;
  return new Model(query, _record.movies, _record.loading, _record.error);
}
function set_loading(model, loading) {
  let _record = model;
  return new Model(_record.search_query, _record.movies, loading, _record.error);
}
function set_movies(model, movies) {
  let _record = model;
  return new Model(_record.search_query, movies, false, new None());
}
function set_error(model, error) {
  let _record = model;
  return new Model(_record.search_query, _record.movies, false, new Some(error));
}
function clear_error(model) {
  let _record = model;
  return new Model(
    _record.search_query,
    _record.movies,
    _record.loading,
    new None()
  );
}

// build/dev/javascript/flixxy/flixxy/api.mjs
function build_search_url(query) {
  let encoded_query = percent_encode(query);
  return tmdb_base_url + "/search/movie?api_key=" + api_key + "&query=" + encoded_query;
}
function movie_decoder() {
  return field(
    "id",
    int2,
    (id) => {
      return field(
        "title",
        string2,
        (title) => {
          return field(
            "overview",
            string2,
            (overview) => {
              return field(
                "release_date",
                string2,
                (release_date) => {
                  return field(
                    "poster_path",
                    optional(string2),
                    (poster_path) => {
                      return field(
                        "vote_average",
                        float2,
                        (vote_average) => {
                          return success(
                            new Movie(
                              id,
                              title,
                              overview,
                              release_date,
                              poster_path,
                              vote_average
                            )
                          );
                        }
                      );
                    }
                  );
                }
              );
            }
          );
        }
      );
    }
  );
}
function results_decoder() {
  return field(
    "results",
    list2(movie_decoder()),
    (results) => {
      return success(results);
    }
  );
}
function make_api_request_live(query) {
  let url = build_search_url(query);
  let handler = expect_json(
    results_decoder(),
    (var0) => {
      return new MoviesLoadedLive(var0);
    }
  );
  return get3(url, handler);
}

// build/dev/javascript/flixxy/flixxy/messages.mjs
function handle_search_query_changed(model, query) {
  return [set_search_query(model, query), none()];
}
function handle_search_submitted(model) {
  let $ = model.search_query;
  if ($ === "") {
    return [
      set_error(model, "Please enter a movie title to search."),
      none()
    ];
  } else {
    let cleared_model = clear_error(model);
    let loading_model = set_loading(cleared_model, true);
    let _block;
    let _record = loading_model;
    _block = new Model(
      _record.search_query,
      toList([]),
      _record.loading,
      _record.error
    );
    let updated_model = _block;
    return [updated_model, make_api_request_live(model.search_query)];
  }
}
function handle_movies_loaded(model, result) {
  if (result instanceof Ok) {
    let movies = result[0];
    return [set_movies(model, movies), none()];
  } else {
    let error_msg = result[0];
    return [set_error(model, error_msg), none()];
  }
}
function handle_clear_error(model) {
  return [clear_error(model), none()];
}
function decode_error_to_string(error) {
  if (error instanceof BadBody) {
    return "Bad body";
  } else if (error instanceof BadUrl) {
    let err = error[0];
    return "Bad URL: " + err;
  } else if (error instanceof HttpError) {
    return "HTTP error";
  } else if (error instanceof JsonError) {
    return "JSON decoding error";
  } else if (error instanceof NetworkError2) {
    return "Network error";
  } else {
    return "Unhandled response";
  }
}
function handle_movies_loaded_live(model, result) {
  if (result instanceof Ok) {
    let movies = result[0];
    return [set_movies(model, movies), none()];
  } else {
    let error = result[0];
    echo(
      "Error loading movies: " + decode_error_to_string(error),
      "src/flixxy/messages.gleam",
      77
    );
    return [
      set_error(model, decode_error_to_string(error)),
      none()
    ];
  }
}
function update2(model, msg) {
  if (msg instanceof SearchQueryChanged) {
    let query = msg[0];
    return handle_search_query_changed(model, query);
  } else if (msg instanceof SearchSubmitted) {
    return handle_search_submitted(model);
  } else if (msg instanceof MoviesLoaded) {
    let result = msg[0];
    return handle_movies_loaded(model, result);
  } else if (msg instanceof MoviesLoadedLive) {
    let result = msg[0];
    return handle_movies_loaded_live(model, result);
  } else {
    return handle_clear_error(model);
  }
}
function echo(value2, file, line) {
  const grey = "\x1B[90m";
  const reset_color = "\x1B[39m";
  const file_line = `${file}:${line}`;
  const string_value = echo$inspect(value2);
  if (globalThis.process?.stderr?.write) {
    const string5 = `${grey}${file_line}${reset_color}
${string_value}
`;
    process.stderr.write(string5);
  } else if (globalThis.Deno) {
    const string5 = `${grey}${file_line}${reset_color}
${string_value}
`;
    globalThis.Deno.stderr.writeSync(new TextEncoder().encode(string5));
  } else {
    const string5 = `${file_line}
${string_value}`;
    globalThis.console.log(string5);
  }
  return value2;
}
function echo$inspectString(str) {
  let new_str = '"';
  for (let i = 0; i < str.length; i++) {
    let char = str[i];
    if (char == "\n") new_str += "\\n";
    else if (char == "\r") new_str += "\\r";
    else if (char == "	") new_str += "\\t";
    else if (char == "\f") new_str += "\\f";
    else if (char == "\\") new_str += "\\\\";
    else if (char == '"') new_str += '\\"';
    else if (char < " " || char > "~" && char < "\xA0") {
      new_str += "\\u{" + char.charCodeAt(0).toString(16).toUpperCase().padStart(4, "0") + "}";
    } else {
      new_str += char;
    }
  }
  new_str += '"';
  return new_str;
}
function echo$inspectDict(map6) {
  let body = "dict.from_list([";
  let first = true;
  let key_value_pairs = [];
  map6.forEach((value2, key) => {
    key_value_pairs.push([key, value2]);
  });
  key_value_pairs.sort();
  key_value_pairs.forEach(([key, value2]) => {
    if (!first) body = body + ", ";
    body = body + "#(" + echo$inspect(key) + ", " + echo$inspect(value2) + ")";
    first = false;
  });
  return body + "])";
}
function echo$inspectCustomType(record) {
  const props = globalThis.Object.keys(record).map((label) => {
    const value2 = echo$inspect(record[label]);
    return isNaN(parseInt(label)) ? `${label}: ${value2}` : value2;
  }).join(", ");
  return props ? `${record.constructor.name}(${props})` : record.constructor.name;
}
function echo$inspectObject(v) {
  const name = Object.getPrototypeOf(v)?.constructor?.name || "Object";
  const props = [];
  for (const k of Object.keys(v)) {
    props.push(`${echo$inspect(k)}: ${echo$inspect(v[k])}`);
  }
  const body = props.length ? " " + props.join(", ") + " " : "";
  const head = name === "Object" ? "" : name + " ";
  return `//js(${head}{${body}})`;
}
function echo$inspect(v) {
  const t = typeof v;
  if (v === true) return "True";
  if (v === false) return "False";
  if (v === null) return "//js(null)";
  if (v === void 0) return "Nil";
  if (t === "string") return echo$inspectString(v);
  if (t === "bigint" || t === "number") return v.toString();
  if (globalThis.Array.isArray(v))
    return `#(${v.map(echo$inspect).join(", ")})`;
  if (v instanceof List)
    return `[${v.toArray().map(echo$inspect).join(", ")}]`;
  if (v instanceof UtfCodepoint)
    return `//utfcodepoint(${String.fromCodePoint(v.value)})`;
  if (v instanceof BitArray) return echo$inspectBitArray(v);
  if (v instanceof CustomType) return echo$inspectCustomType(v);
  if (echo$isDict(v)) return echo$inspectDict(v);
  if (v instanceof Set)
    return `//js(Set(${[...v].map(echo$inspect).join(", ")}))`;
  if (v instanceof RegExp) return `//js(${v})`;
  if (v instanceof Date) return `//js(Date("${v.toISOString()}"))`;
  if (v instanceof Function) {
    const args = [];
    for (const i of Array(v.length).keys())
      args.push(String.fromCharCode(i + 97));
    return `//fn(${args.join(", ")}) { ... }`;
  }
  return echo$inspectObject(v);
}
function echo$inspectBitArray(bitArray) {
  let endOfAlignedBytes = bitArray.bitOffset + 8 * Math.trunc(bitArray.bitSize / 8);
  let alignedBytes = bitArraySlice(
    bitArray,
    bitArray.bitOffset,
    endOfAlignedBytes
  );
  let remainingUnalignedBits = bitArray.bitSize % 8;
  if (remainingUnalignedBits > 0) {
    let remainingBits = bitArraySliceToInt(
      bitArray,
      endOfAlignedBytes,
      bitArray.bitSize,
      false,
      false
    );
    let alignedBytesArray = Array.from(alignedBytes.rawBuffer);
    let suffix = `${remainingBits}:size(${remainingUnalignedBits})`;
    if (alignedBytesArray.length === 0) {
      return `<<${suffix}>>`;
    } else {
      return `<<${Array.from(alignedBytes.rawBuffer).join(", ")}, ${suffix}>>`;
    }
  } else {
    return `<<${Array.from(alignedBytes.rawBuffer).join(", ")}>>`;
  }
}
function echo$isDict(value2) {
  try {
    return value2 instanceof Dict;
  } catch {
    return false;
  }
}

// build/dev/javascript/lustre/lustre/event.mjs
function is_immediate_event(name) {
  if (name === "input") {
    return true;
  } else if (name === "change") {
    return true;
  } else if (name === "focus") {
    return true;
  } else if (name === "focusin") {
    return true;
  } else if (name === "focusout") {
    return true;
  } else if (name === "blur") {
    return true;
  } else if (name === "select") {
    return true;
  } else {
    return false;
  }
}
function on(name, handler) {
  return event(
    name,
    map2(handler, (msg) => {
      return new Handler(false, false, msg);
    }),
    empty_list,
    never,
    never,
    is_immediate_event(name),
    0,
    0
  );
}
function on_click(msg) {
  return on("click", success(msg));
}
function on_input(msg) {
  return on(
    "input",
    subfield(
      toList(["target", "value"]),
      string2,
      (value2) => {
        return success(msg(value2));
      }
    )
  );
}

// build/dev/javascript/flixxy/flixxy/views.mjs
function render_search_input(model) {
  return input(
    toList([
      type_("text"),
      class$("search-input"),
      placeholder("Search for movies..."),
      value(model.search_query),
      on_input(
        (var0) => {
          return new SearchQueryChanged(var0);
        }
      )
    ])
  );
}
function render_search_button(model) {
  let _block;
  let $ = model.loading;
  if ($) {
    _block = "search-button search-button--loading";
  } else {
    _block = "search-button";
  }
  let button_class = _block;
  return button(
    toList([
      type_("button"),
      class$(button_class),
      disabled(model.loading),
      on_click(new SearchSubmitted())
    ]),
    toList([
      (() => {
        let $1 = model.loading;
        if ($1) {
          return text2("Searching...");
        } else {
          return text2("Search");
        }
      })()
    ])
  );
}
function render_search_section(model) {
  return div(
    toList([class$("search-container")]),
    toList([render_search_input(model), render_search_button(model)])
  );
}
function render_header(model) {
  return header(
    toList([class$("header")]),
    toList([
      h1(
        toList([class$("app-title")]),
        toList([text2("Flixxy - Movie Search")])
      ),
      render_search_section(model)
    ])
  );
}
function render_loading_state(model) {
  let $ = model.loading;
  if ($) {
    return div(
      toList([class$("loading-container")]),
      toList([
        div(toList([class$("loading-spinner")]), toList([])),
        p(
          toList([class$("loading-text")]),
          toList([text2("Searching for movies...")])
        )
      ])
    );
  } else {
    return div(toList([]), toList([]));
  }
}
function render_error_state(model) {
  let $ = model.error;
  if ($ instanceof Some) {
    let error_msg = $[0];
    return div(
      toList([class$("error-container")]),
      toList([
        div(
          toList([class$("error-message")]),
          toList([
            p(toList([]), toList([text2(error_msg)])),
            button(
              toList([
                type_("button"),
                class$("error-dismiss-button"),
                on_click(new ClearError())
              ]),
              toList([text2("Dismiss")])
            )
          ])
        )
      ])
    );
  } else {
    return div(toList([]), toList([]));
  }
}
function render_empty_results(model) {
  let $ = model.search_query;
  if ($ === "") {
    return div(toList([]), toList([]));
  } else {
    return div(
      toList([class$("empty-results")]),
      toList([
        p(
          toList([class$("empty-results-text")]),
          toList([text2("No movies found matching your search.")])
        )
      ])
    );
  }
}
function build_poster_url_with_size(poster_path, size2) {
  return "https://image.tmdb.org/t/p/" + size2 + poster_path;
}
function render_movie_poster(movie) {
  return div(
    toList([class$("movie-poster-container")]),
    toList([
      (() => {
        let $ = movie.poster_path;
        if ($ instanceof Some) {
          let poster_path = $[0];
          return picture(
            toList([class$("movie-poster-picture")]),
            toList([
              source(
                toList([
                  attribute2("media", "(min-width: 768px)"),
                  attribute2(
                    "srcset",
                    build_poster_url_with_size(poster_path, "w780")
                  )
                ])
              ),
              source(
                toList([
                  attribute2("media", "(min-width: 480px)"),
                  attribute2(
                    "srcset",
                    build_poster_url_with_size(poster_path, "w500")
                  )
                ])
              ),
              img(
                toList([
                  class$("movie-poster"),
                  src(
                    build_poster_url_with_size(poster_path, "w342")
                  ),
                  alt("Poster for " + movie.title),
                  attribute2("loading", "lazy")
                ])
              )
            ])
          );
        } else {
          return div(
            toList([class$("movie-poster-placeholder")]),
            toList([
              div(
                toList([class$("poster-placeholder-icon")]),
                toList([text2("\u{1F3AC}")])
              ),
              p(
                toList([class$("poster-placeholder-text")]),
                toList([text2("No Image")])
              )
            ])
          );
        }
      })()
    ])
  );
}
function extract_year_from_date(release_date) {
  let $ = split2(release_date, "-");
  if ($ instanceof Empty) {
    return "";
  } else {
    let year = $.head;
    return year;
  }
}
function render_movie_year(movie) {
  let year = extract_year_from_date(movie.release_date);
  if (year === "") {
    return div(toList([]), toList([]));
  } else {
    let year_str = year;
    return p(
      toList([class$("movie-year")]),
      toList([text2("(" + year_str + ")")])
    );
  }
}
function truncate_overview(overview) {
  let $ = string_length(overview) > 150;
  if ($) {
    return slice(overview, 0, 147) + "...";
  } else {
    return overview;
  }
}
function render_movie_details(movie) {
  return div(
    toList([class$("movie-details")]),
    toList([
      h3(
        toList([class$("movie-title")]),
        toList([text2(movie.title)])
      ),
      render_movie_year(movie),
      p(
        toList([class$("movie-overview")]),
        toList([text2(truncate_overview(movie.overview))])
      )
    ])
  );
}
function render_movie_card(movie) {
  return div(
    toList([class$("movie-card")]),
    toList([render_movie_poster(movie), render_movie_details(movie)])
  );
}
function render_movie_grid(movies) {
  return div(
    toList([class$("results-container")]),
    toList([
      div(
        toList([class$("movies-grid")]),
        map(movies, render_movie_card)
      )
    ])
  );
}
function render_results_section(model) {
  let $ = model.loading;
  let $1 = model.error;
  if ($) {
    return div(toList([]), toList([]));
  } else if ($1 instanceof Some) {
    return div(toList([]), toList([]));
  } else {
    let $2 = model.movies;
    if ($2 instanceof Empty) {
      return render_empty_results(model);
    } else {
      let movies = $2;
      return render_movie_grid(movies);
    }
  }
}
function render_main_content(model) {
  return main(
    toList([class$("main-content")]),
    toList([
      render_loading_state(model),
      render_error_state(model),
      render_results_section(model)
    ])
  );
}
function view(model) {
  return div(
    toList([class$("app")]),
    toList([render_header(model), render_main_content(model)])
  );
}

// build/dev/javascript/flixxy/flixxy.mjs
var FILEPATH = "src/flixxy.gleam";
function init2(_) {
  return [init(), none()];
}
function update3(model, msg) {
  return update2(model, msg);
}
function view2(model) {
  return view(model);
}
function main2() {
  let app = application(init2, update3, view2);
  let $ = start3(app, "#app", void 0);
  if (!($ instanceof Ok)) {
    throw makeError(
      "let_assert",
      FILEPATH,
      "flixxy",
      41,
      "main",
      "Pattern match failed, no pattern matched the value.",
      { value: $, start: 964, end: 1013, pattern_start: 975, pattern_end: 980 }
    );
  }
  return void 0;
}

// build/.lustre/entry.mjs
main2();
