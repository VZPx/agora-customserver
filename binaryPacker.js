const EPOCH = new Date(1970, 0, 1);

const NONE_TYPE = 1;
const INT32_TYPE = 2;
const BINARY_TYPE = 3;
const BOOL_TYPE = 4;
const BYTE8_TYPE = 5;
const FLOAT64_TYPE = 6;
const DATETIME_TYPE = 7;
const ARRAY_TYPE = 8;
const STRUCT_TYPE = 9;
const BITSTRUCT_TYPE = 10;
const INT64_TYPE = 11;
const MAP_TYPE = 12;
const UINT64_TYPE = 13;
const UTF8_TYPE = 14;

function encode(obj) {
    const stream = [];
    write(stream, obj);
    return Buffer.from(stream);
}

function decode(buffer) {
    const stream = Buffer.from(buffer);
    return read(stream, { offset: 0 });
}

function read(stream, state) {
    const type = stream[state.offset++];
    switch (type) {
        case NONE_TYPE:
            return null;
        case INT32_TYPE:
            return readInt32(stream, state);
        case BINARY_TYPE:
            return readBinary(stream, state);
        case BOOL_TYPE:
            return readByte(stream, state) !== 0;
        case FLOAT64_TYPE:
            return readDouble(stream, state);
        case DATETIME_TYPE:
            return readDateTime(stream, state);
        case ARRAY_TYPE:
            return readArray(stream, state);
        case MAP_TYPE:
        case STRUCT_TYPE:
            return readMap(stream, state);
        case INT64_TYPE:
            return readInt64(stream, state);
        case BITSTRUCT_TYPE:
            return readBitArray(stream, state);
        case UINT64_TYPE:
            return readUInt64(stream, state);
        case UTF8_TYPE:
            return readString(stream, state);
        default:
            return null;
    }
}

function readInt32(stream, state) {
    const value = stream.readInt32BE(state.offset);
    state.offset += 4;
    return value;
}

function readInt64(stream, state) {
    const value = stream.readBigInt64BE(state.offset);
    state.offset += 8;
    return value;
}

function readUInt64(stream, state) {
    const value = stream.readBigUInt64BE(state.offset);
    state.offset += 8;
    return value;
}

function readBinary(stream, state) {
    const len = readInt32(stream, state);
    const value = stream.slice(state.offset, state.offset + len);
    state.offset += len;
    return value;
}

function readByte(stream, state) {
    return stream[state.offset++];
}

function readString(stream, state) {
    const len = readInt32(stream, state);
    const value = stream.toString('utf8', state.offset, state.offset + len);
    state.offset += len;
    return value;
}

function readDouble(stream, state) {
    const value = stream.readDoubleBE(state.offset);
    state.offset += 8;
    return value;
}

function readDateTime(stream, state) {
    const value = readInt32(stream, state);
    return new Date(EPOCH.getTime() + value * 1000);
}

function readBitArray(stream, state) {
    const bits = readInt32(stream, state);
    return new Array(bits).fill(0).map((_, i) => (bits >> i) & 1);
}

function readArray(stream, state) {
    const count = readInt32(stream, state);
    const list = [];
    for (let i = 0; i < count; i++) {
        list.push(read(stream, state));
    }
    return list;
}

function readMap(stream, state) {
    const count = readInt32(stream, state);
    const dict = {};
    for (let i = 0; i < count; i++) {
        const key = read(stream, state);
        const val = read(stream, state);
        dict[key] = val;
    }
    return dict;
}

function write(stream, obj) {
    if (obj === null) {
        stream.push(NONE_TYPE);
    } else if (typeof obj === 'string') {
        stream.push(UTF8_TYPE);
        writeString(stream, obj);
    } else if (typeof obj === 'number' && Number.isInteger(obj)) {
        stream.push(INT32_TYPE);
        writeInt32(stream, obj);
    } else if (typeof obj === 'bigint') {
        stream.push(INT64_TYPE);
        writeInt64(stream, obj);
    } else if (typeof obj === 'boolean') {
        stream.push(BOOL_TYPE);
        writeByte(stream, obj ? 1 : 0);
    } else if (typeof obj === 'number') {
        stream.push(FLOAT64_TYPE);
        writeDouble(stream, obj);
    } else if (Buffer.isBuffer(obj)) {
        stream.push(BINARY_TYPE);
        writeBinary(stream, obj);
    } else if (obj instanceof Date) {
        stream.push(DATETIME_TYPE);
        writeDateTime(stream, obj);
    } else if (Array.isArray(obj)) {
        stream.push(ARRAY_TYPE);
        writeArray(stream, obj);
    } else if (typeof obj === 'object') {
        stream.push(MAP_TYPE);
        writeMap(stream, obj);
    } else {
        throw new Error("Unknown type to encode");
    }
}

function writeString(stream, str) {
    const bytes = Buffer.from(str, 'utf8');
    writeInt32(stream, bytes.length);
    stream.push(...bytes);
}

function writeInt32(stream, num) {
    const buffer = Buffer.alloc(4);
    buffer.writeInt32BE(num);
    stream.push(...buffer);
}

function writeInt64(stream, num) {
    const buffer = Buffer.alloc(8);
    buffer.writeBigInt64BE(BigInt(num));
    stream.push(...buffer);
}

function writeDouble(stream, num) {
    const buffer = Buffer.alloc(8);
    buffer.writeDoubleBE(num);
    stream.push(...buffer);
}

function writeBinary(stream, buffer) {
    writeInt32(stream, buffer.length);
    stream.push(...buffer);
}

function writeDateTime(stream, date) {
    const seconds = Math.floor((date.getTime() - EPOCH.getTime()) / 1000);
    writeInt32(stream, seconds);
}

function writeArray(stream, arr) {
    writeInt32(stream, arr.length);
    for (const item of arr) {
        write(stream, item);
    }
}

function writeMap(stream, obj) {
    const keys = Object.keys(obj);
    writeInt32(stream, keys.length);
    for (const key of keys) {
        write(stream, key);
        write(stream, obj[key]);
    }
}

function writeByte(stream, byte) {
    stream.push(byte);
}

module.exports = {
    encode,
    decode
};