const { Readable, Writable } = require('stream');
const Long = require('long');

class BinaryPacker2 {
    static EPOCH = new Date(1970, 0, 1);

    static Types = {
        TYPE_NONE: 0x01,
        TYPE_TRUE: 0x02,
        TYPE_FALSE: 0x03,

        TYPE_INT_8: 0x10,
        TYPE_UINT_8: 0x11,
        TYPE_INT_16: 0x12,
        TYPE_UINT_16: 0x13,
        TYPE_INT_32: 0x14,
        TYPE_UINT_32: 0x15,
        TYPE_INT_64: 0x16,
        TYPE_UINT_64: 0x17,

        TYPE_FLOAT: 0x20,
        TYPE_DOUBLE: 0x21,

        TYPE_STRING_8: 0x30,
        TYPE_STRING_16: 0x31,
        TYPE_STRING_32: 0x32,

        TYPE_BINARY_8: 0x33,
        TYPE_BINARY_16: 0x34,
        TYPE_BINARY_32: 0x35,

        TYPE_DATETIME: 0x40,

        TYPE_ARRAY_8: 0x50,
        TYPE_ARRAY_16: 0x51,
        TYPE_ARRAY_32: 0x52,

        TYPE_MAP_8: 0x60,
        TYPE_MAP_16: 0x61,
        TYPE_MAP_32: 0x62,
    };

    constructor() {
        this.buff = Buffer.alloc(8);
    }

    static encode(obj) {
        const stream = new WritableStreamBuffer();
        BinaryPacker2.write(stream, obj);
        return stream.getContents();
    }

    static decode(bytes) {
        const instance = new BinaryPacker2();
        const stream = new ReadableStreamBuffer(bytes);
        return instance.read(stream);
    }

    read(stream) {
        const typeByte = stream.readByte();

        if (typeByte === -1) {
            return null;
        } else {
            const type = BinaryPacker2.Types[typeByte];

            if (type !== undefined) {
                switch (type) {
                    case BinaryPacker2.Types.TYPE_NONE:
                        return null;
                    case BinaryPacker2.Types.TYPE_TRUE:
                        return true;
                    case BinaryPacker2.Types.TYPE_FALSE:
                        return false;

                    case BinaryPacker2.Types.TYPE_INT_8:
                        return this.readInt8(stream);
                    case BinaryPacker2.Types.TYPE_UINT_8:
                        return this.readUInt8(stream);
                    case BinaryPacker2.Types.TYPE_INT_16:
                        return this.readInt16(stream);
                    case BinaryPacker2.Types.TYPE_UINT_16:
                        return this.readUInt16(stream);
                    case BinaryPacker2.Types.TYPE_INT_32:
                        return this.readInt32(stream);
                    case BinaryPacker2.Types.TYPE_UINT_32:
                        return this.readUInt32(stream);
                    case BinaryPacker2.Types.TYPE_INT_64:
                        return this.readInt64(stream);
                    case BinaryPacker2.Types.TYPE_UINT_64:
                        return this.readUInt64(stream);

                    case BinaryPacker2.Types.TYPE_FLOAT:
                        return this.readFloat(stream);
                    case BinaryPacker2.Types.TYPE_DOUBLE:
                        return this.readDouble(stream);

                    case BinaryPacker2.Types.TYPE_DATETIME:
                        return this.readDateTime(stream);

                    case BinaryPacker2.Types.TYPE_STRING_8:
                        return this.readString8(stream);
                    case BinaryPacker2.Types.TYPE_STRING_16:
                        return this.readString16(stream);
                    case BinaryPacker2.Types.TYPE_STRING_32:
                        return this.readString32(stream);

                    case BinaryPacker2.Types.TYPE_BINARY_8:
                        return this.readBinary8(stream);
                    case BinaryPacker2.Types.TYPE_BINARY_16:
                        return this.readBinary16(stream);
                    case BinaryPacker2.Types.TYPE_BINARY_32:
                        return this.readBinary32(stream);

                    case BinaryPacker2.Types.TYPE_ARRAY_8:
                        return this.readList8(stream);
                    case BinaryPacker2.Types.TYPE_ARRAY_16:
                        return this.readList16(stream);
                    case BinaryPacker2.Types.TYPE_ARRAY_32:
                        return this.readList32(stream);

                    case BinaryPacker2.Types.TYPE_MAP_8:
                        return this.readMap8(stream);
                    case BinaryPacker2.Types.TYPE_MAP_16:
                        return this.readMap16(stream);
                    case BinaryPacker2.Types.TYPE_MAP_32:
                        return this.readMap32(stream);
                }
            }
        }

        return null;
    }

    readInt8(stream) {
        return stream.readByte();
    }

    readUInt8(stream) {
        return stream.readByte();
    }

    readInt16(stream) {
        stream.read(this.buff, 0, 2);
        return this.buff.readInt16BE(0);
    }

    readUInt16(stream) {
        stream.read(this.buff, 0, 2);
        return this.buff.readUInt16BE(0);
    }

    readInt32(stream) {
        stream.read(this.buff, 0, 4);
        return this.buff.readInt32BE(0);
    }

    readUInt32(stream) {
        stream.read(this.buff, 0, 4);
        return this.buff.readUInt32BE(0);
    }

    readInt64(stream) {
        stream.read(this.buff, 0, 8);
        return this.buff.readBigInt64BE(0);
    }

    readUInt64(stream) {
        stream.read(this.buff, 0, 8);
        return this.buff.readBigUInt64BE(0);
    }

    readBinary8(stream) {
        const len = this.readUInt8(stream);
        return this.readBinary(stream, len);
    }

    readBinary16(stream) {
        const len = this.readUInt16(stream);
        return this.readBinary(stream, len);
    }

    readBinary32(stream) {
        const len = this.readInt32(stream);
        return this.readBinary(stream, len);
    }

    readBinary(stream, len) {
        const buff = Buffer.alloc(len);
        stream.read(buff, 0, len);
        return buff;
    }

    readString8(stream) {
        const len = this.readUInt8(stream);
        return this.readString(stream, len);
    }

    readString16(stream) {
        const len = this.readUInt16(stream);
        return this.readString(stream, len);
    }

    readString32(stream) {
        const len = this.readInt32(stream);
        return this.readString(stream, len);
    }

    readString(stream, len) {
        const buff = Buffer.alloc(len);
        stream.read(buff, 0, len);
        return buff.toString('utf8');
    }

    readFloat(stream) {
        stream.read(this.buff, 0, 4);
        return this.buff.readFloatBE(0);
    }

    readDouble(stream) {
        stream.read(this.buff, 0, 8);
        return this.buff.readDoubleBE(0);
    }

    readDateTime(stream) {
        const dateTime = this.readInt32(stream);
        return new Date(BinaryPacker2.EPOCH.getTime() + dateTime * 1000);
    }

    readList8(stream) {
        const len = this.readUInt8(stream);
        return this.readList(stream, len);
    }

    readList16(stream) {
        const len = this.readUInt16(stream);
        return this.readList(stream, len);
    }

    readList32(stream) {
        const len = this.readInt32(stream);
        return this.readList(stream, len);
    }

    readList(stream, len) {
        const list = [];
        for (let i = 0; i < len; i++) {
            list.push(this.read(stream));
        }
        return list;
    }

    readMap8(stream) {
        const len = this.readUInt8(stream);
        return this.readMap(stream, len);
    }

    readMap16(stream) {
        const len = this.readUInt16(stream);
        return this.readMap(stream, len);
    }

    readMap32(stream) {
        const len = this.readInt32(stream);
        return this.readMap(stream, len);
    }

    readMap(stream, len) {
        const map = new Map();
        for (let i = 0; i < len; i++) {
            const key = this.read(stream);
            const val = this.read(stream);
            map.set(key, val);
        }
        return map;
    }

    static write(stream, obj) {
        if (obj === null) {
            stream.writeByte(BinaryPacker2.Types.TYPE_NONE);
        } else if (typeof obj === 'boolean') {
            this.writeBoolType(stream, obj, BinaryPacker2.Types.TYPE_TRUE, BinaryPacker2.Types.TYPE_FALSE);
        } else if (typeof obj === 'number') {
            if (Number.isInteger(obj)) {
                this.writeIntegerType(stream, obj);
            } else {
                this.writeFloatType(stream, obj);
            }
        } else if (typeof obj === 'bigint') {
            stream.writeByte(BinaryPacker2.Types.TYPE_UINT_64);
            this.writeUInt64(stream, obj);
        } else if (typeof obj === 'string') {
            this.writeVariableUnsigned(stream, obj.length, BinaryPacker2.Types.TYPE_STRING_8, BinaryPacker2.Types.TYPE_STRING_16, BinaryPacker2.Types.TYPE_STRING_32);
            this.writeString(stream, obj);
        } else if (obj instanceof Buffer) {
            this.writeVariableUnsigned(stream, obj.length, BinaryPacker2.Types.TYPE_BINARY_8, BinaryPacker2.Types.TYPE_BINARY_16, BinaryPacker2.Types.TYPE_BINARY_32);
            this.writeBinary(stream, obj);
        } else if (Array.isArray(obj)) {
            this.writeVariableUnsigned(stream, obj.length, BinaryPacker2.Types.TYPE_ARRAY_8, BinaryPacker2.Types.TYPE_ARRAY_16, BinaryPacker2.Types.TYPE_ARRAY_32);
            obj.forEach(item => BinaryPacker2.write(stream, item));
        } else if (obj instanceof Date) {
            stream.writeByte(BinaryPacker2.Types.TYPE_DATETIME);
            const seconds = Math.floor((obj.getTime() - BinaryPacker2.EPOCH.getTime()) / 1000);
            this.writeInt32(stream, seconds);
        } else if (obj instanceof Map) {
            this.writeVariableUnsigned(stream, obj.size, BinaryPacker2.Types.TYPE_MAP_8, BinaryPacker2.Types.TYPE_MAP_16, BinaryPacker2.Types.TYPE_MAP_32);
            obj.forEach((val, key) => {
                BinaryPacker2.write(stream, key);
                BinaryPacker2.write(stream, val);
            });
        }
    }

    static writeVariableUnsigned(stream, length, type8, type16, type32) {
        if (length < 0x100) {
            stream.writeByte(type8);
            stream.writeByte(length);
        } else if (length < 0x10000) {
            stream.writeByte(type16);
            this.writeUInt16(stream, length);
        } else {
            stream.writeByte(type32);
            this.writeUInt32(stream, length);
        }
    }

    static writeBoolType(stream, obj, trueType, falseType) {
        if (obj) {
            stream.writeByte(trueType);
        } else {
            stream.writeByte(falseType);
        }
    }

    static writeIntegerType(stream, obj) {
        if (obj >= 0) {
            if (obj < 0x100) {
                stream.writeByte(BinaryPacker2.Types.TYPE_UINT_8);
                stream.writeByte(obj);
            } else if (obj < 0x10000) {
                stream.writeByte(BinaryPacker2.Types.TYPE_UINT_16);
                this.writeUInt16(stream, obj);
            } else if (obj < 0x100000000) {
                stream.writeByte(BinaryPacker2.Types.TYPE_UINT_32);
                this.writeUInt32(stream, obj);
            } else {
                stream.writeByte(BinaryPacker2.Types.TYPE_UINT_64);
                this.writeUInt64(stream, obj);
            }
        } else {
            if (obj >= -0x80) {
                stream.writeByte(BinaryPacker2.Types.TYPE_INT_8);
                stream.writeByte(obj);
            } else if (obj >= -0x8000) {
                stream.writeByte(BinaryPacker2.Types.TYPE_INT_16);
                this.writeInt16(stream, obj);
            } else if (obj >= -0x80000000) {
                stream.writeByte(BinaryPacker2.Types.TYPE_INT_32);
                this.writeInt32(stream, obj);
            } else {
                stream.writeByte(BinaryPacker2.Types.TYPE_INT_64);
                this.writeInt64(stream, obj);
            }
        }
    }

    static writeFloatType(stream, obj) {
        if (obj === Number.POSITIVE_INFINITY) {
            obj = 3.40282347e+38;
        } else if (obj === Number.NEGATIVE_INFINITY) {
            obj = -3.40282347e+38;
        }
        stream.writeByte(BinaryPacker2.Types.TYPE_FLOAT);
        this.writeFloat(stream, obj);
    }

    static writeUInt64(stream, obj) {
        stream.writeUInt32BE(Number(obj >> 32n));
        stream.writeUInt32BE(Number(obj & 0xFFFFFFFFn));
    }

    static writeString(stream, obj) {
        stream.write(obj, 'utf8');
    }

    static writeBinary(stream, obj) {
        stream.write(obj);
    }

    static writeInt32(stream, obj) {
        stream.writeUInt32BE(obj);
    }

    static writeUInt32(stream, obj) {
        stream.writeUInt32BE(obj);
    }

    static writeInt16(stream, obj) {
        stream.writeInt16BE(obj);
    }

    static writeUInt16(stream, obj) {
        stream.writeUInt16BE(obj);
    }

    static writeFloat(stream, obj) {
        stream.writeFloatBE(obj);
    }

    static writeInt64(stream, obj) {
        stream.writeBigInt64BE(BigInt(obj));
    }
}

class WritableStreamBuffer extends Writable {
    constructor() {
        super();
        this.buffers = [];
    }

    _write(chunk, encoding, callback) {
        this.buffers.push(chunk);
        callback();
    }

    getContents() {
        return Buffer.concat(this.buffers);
    }

    writeByte(value) {
        const buff = Buffer.alloc(1);
        buff.writeUInt8(value, 0);
        this.write(buff);
    }
}

class ReadableStreamBuffer extends Readable {
    constructor(data) {
        super();
        this.data = data;
        this.offset = 0;
    }

    _read(size) {
        const chunk = this.data.slice(this.offset, this.offset + size);
        this.push(chunk.length ? chunk : null);
        this.offset += chunk.length;
    }

    readByte() {
        if (this.offset >= this.data.length) {
            return -1;
        }
        return this.data[this.offset++];
    }

    read(buffer, offset, length) {
        if (this.offset >= this.data.length) {
            return 0;
        }
        const end = Math.min(this.data.length, this.offset + length);
        this.data.copy(buffer, offset, this.offset, end);
        const bytesRead = end - this.offset;
        this.offset += bytesRead;
        return bytesRead;
    }
}

module.exports = BinaryPacker2;
