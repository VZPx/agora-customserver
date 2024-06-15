const { Transform } = require('stream');

class StreamUtils {
    static UTF8 = new TextEncoder();

    static encode(data) {
        // Example: Convert object to JSON string and then to Buffer
        const jsonString = JSON.stringify(data);
        const buffer = Buffer.from(jsonString, 'utf8');
        return buffer;
    }

    static readInt16(stream) {
        const buff = Buffer.alloc(2);
        stream.read(buff, 0, 2);
        return buff.readInt16BE(0);
    }

    static readUInt16(stream) {
        const buff = Buffer.alloc(2);
        stream.read(buff, 0, 2);
        return buff.readUInt16BE(0);
    }

    static readInt32(stream) {
        const buff = Buffer.alloc(4);
        stream.read(buff, 0, 4);
        return buff.readInt32BE(0);
    }

    static readUInt32(stream) {
        const buff = Buffer.alloc(4);
        stream.read(buff, 0, 4);
        return buff.readUInt32BE(0);
    }

    static readInt64(stream) {
        const buff = Buffer.alloc(8);
        stream.read(buff, 0, 8);
        return buff.readBigInt64BE(0);
    }

    static readUInt64(stream) {
        const buff = Buffer.alloc(8);
        stream.read(buff, 0, 8);
        return buff.readBigUInt64BE(0);
    }

    static readBinary32(stream) {
        const len = this.readUInt32(stream);
        const buff = Buffer.alloc(len);
        stream.read(buff, 0, len);
        return buff;
    }

    static readBinary16(stream) {
        const len = this.readUInt16(stream);
        const buff = Buffer.alloc(len);
        stream.read(buff, 0, len);
        return buff;
    }

    static readByte(stream) {
        const buff = Buffer.alloc(1);
        stream.read(buff, 0, 1);
        return buff[0];
    }

    static readDouble(stream) {
        const buff = Buffer.alloc(8);
        stream.read(buff, 0, 8);
        return buff.readDoubleBE(0);
    }

    static readHexBinaryFixed(stream, len) {
        const buff = Buffer.alloc(len);
        stream.read(buff, 0, len);
        return this.byteArrayToHex(buff);
    }

    static readHexBinary16(stream) {
        const len = this.readUInt16(stream);
        const buff = Buffer.alloc(len);
        stream.read(buff, 0, len);
        return this.byteArrayToHex(buff);
    }

    static readString16(stream) {
        const len = this.readUInt16(stream);
        const buff = Buffer.alloc(len);
        stream.read(buff, 0, len);
        return buff.toString(this.UTF8);
    }

    static writeBytes(stream, bytes) {
        stream.write(bytes);
    }

    static writeDouble(stream, d) {
        const bytes = this.convert(Buffer.alloc(8));
        bytes.writeDoubleBE(d);
        stream.write(bytes);
    }

    static writeInt32(stream, i) {
        const bytes = this.convert(Buffer.alloc(4));
        bytes.writeInt32BE(i);
        stream.write(bytes);
    }

    static writeUInt32(stream, i) {
        const bytes = this.convert(Buffer.alloc(4));
        bytes.writeUInt32BE(i);
        stream.write(bytes);
    }

    static writeUInt64(stream, i) {
        const bytes = this.convert(Buffer.alloc(8));
        bytes.writeBigUInt64BE(BigInt(i));
        stream.write(bytes);
    }

    static writeInt16(stream, s) {
        const bytes = this.convert(Buffer.alloc(2));
        bytes.writeInt16BE(s);
        stream.write(bytes);
    }

    static writeUInt16(stream, s) {
        const bytes = this.convert(Buffer.alloc(2));
        bytes.writeUInt16BE(s);
        stream.write(bytes);
    }

    static writeInt64(stream, i) {
        const bytes = this.convert(Buffer.alloc(8));
        bytes.writeBigInt64BE(BigInt(i));
        stream.write(bytes);
    }

    static writeBinary16(stream, bytes) {
        this.writeUInt16(stream, bytes.length);
        stream.write(bytes);
    }

    static writeString32(stream, s) {
        const bytes = Buffer.from(s, this.UTF8);
        this.writeUInt32(stream, bytes.length);
        stream.write(bytes);
    }

    static writeString16(stream, s) {
        if (s === null) {
            this.writeUInt16(stream, 0);
        } else {
            const bytes = Buffer.from(s, this.UTF8);
            this.writeUInt16(stream, bytes.length);
            stream.write(bytes);
        }
    }

    static writeString8(stream, s) {
        if (s === null) {
            stream.write(Buffer.from([0]));
        } else {
            const bytes = Buffer.from(s, this.UTF8);
            stream.write(Buffer.from([bytes.length]));
            stream.write(bytes);
        }
    }

    static writeBinary32(stream, bytes) {
        if (bytes === null) {
            this.writeUInt32(stream, 0);
        } else {
            this.writeUInt32(stream, bytes.length);
            stream.write(bytes);
        }
    }

    static writeBinary32(stream, data) {
        const buffer = Buffer.from(data);
        const length = Buffer.alloc(4);
        length.writeUInt32BE(buffer.length, 0);
        stream.write(length);
        stream.write(buffer);
    }

    static writeHexBinaryFixed(stream, hex, len) {
        if (hex === null) {
            const buff = Buffer.alloc(len, 0);
            stream.write(buff);
        } else {
            const realLen = hex.length / 2;
            if (realLen !== len) {
                throw new Error('Invalid hex length');
            }
            stream.write(this.hexToByteArray(hex));
        }
    }

    static writeHexBinary16(stream, hex) {
        if (hex === null) {
            stream.write(Buffer.from([0]));
        } else {
            this.writeBinary16(stream, this.hexToByteArray(hex));
        }
    }

    static hexToByteArray(hexString) {
        if (hexString.length % 2 !== 0) {
            throw new Error('Invalid hex string');
        }

        const byteArray = [];
        for (let i = 0; i < hexString.length; i += 2) {
            byteArray.push(parseInt(hexString.substr(i, 2), 16));
        }
        return Buffer.from(byteArray);
    }

    static byteArrayToHex(byteArray) {
        return Array.from(byteArray)
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    static convert(bytes) {
        if (Buffer.isBuffer(bytes)) {
            if (Buffer.isEncoding('utf-8')) {
                return bytes.swap16();
            }
        }
        return bytes;
    }
}

class ReadableStreamBuffer extends Transform {
    constructor(options) {
        super(options);
        this.buffers = [];
    }

    _transform(chunk, encoding, callback) {
        this.buffers.push(chunk);
        callback();
    }

    read(size) {
        const data = Buffer.concat(this.buffers);
        this.buffers = [];
        return data.slice(0, size);
    }
}

class WritableStreamBuffer extends Transform {
    constructor(options) {
        super(options);
        this.buffers = [];
    }

    _transform(chunk, encoding, callback) {
        this.buffers.push(chunk);
        callback();
    }

    write(data) {
        this.buffers.push(Buffer.from(data));
    }

    getContents() {
        return Buffer.concat(this.buffers);
    }
}

module.exports = { StreamUtils, ReadableStreamBuffer, WritableStreamBuffer };
