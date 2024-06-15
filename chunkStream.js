class ChunkStream {
    constructor(headers) {
        this.headers = headers;
        this.saved = '';
        this.chunks = [];
        this.chunkSize = -1;
        this.chunkRead = 0;
        this.state = 'None'; // 'None', 'Body', 'BodyFinished', 'Trailer'
        this.trailerState = 0; // 0 - '\r', 1 - '\n', 2 - '\r\n\r', 3 - trailers

        this.sawCR = false;
    }

    get ChunkLeft() {
        return this.chunkSize - this.chunkRead;
    }

    get WantMore() {
        return this.chunkRead !== this.chunkSize || this.chunkSize !== 0 || this.state !== 'None';
    }

    getChunkSize(buffer, offset, size) {
        let c;
        while (offset < size) {
            c = String.fromCharCode(buffer[offset++]);
            if (c === '\r') {
                if (this.sawCR) {
                    throw new Error('2 CR found.');
                }
                this.sawCR = true;
                continue;
            }

            if (this.sawCR && c === '\n') {
                break;
            }

            if (c === ' ') {
                this.gotit = true;
            }

            if (!this.gotit) {
                this.saved += c;
            }

            if (this.saved.length > 20) {
                throw new Error('Chunk size too long.');
            }
        }

        if (!this.sawCR || c !== '\n') {
            if (offset < size) {
                throw new Error('Missing \\n.');
            }

            try {
                if (this.saved.length > 0) {
                    this.chunkSize = parseInt(this.saved.replace(/;.*$/g, ''), 16);
                }
            } catch (e) {
                throw new Error('Cannot parse chunk size.');
            }

            return 'None';
        }

        this.chunkRead = 0;
        try {
            this.chunkSize = parseInt(this.saved.replace(/;.*$/g, ''), 16);
        } catch (e) {
            throw new Error('Cannot parse chunk size.');
        }

        if (this.chunkSize === 0) {
            this.trailerState = 2;
            return 'Trailer';
        }

        return 'Body';
    }

    internalWrite(buffer, offset, size) {
        if (this.state === 'None') {
            this.state = this.getChunkSize(buffer, offset, size);
            if (this.state === 'None') {
                return;
            }
            this.saved = '';
            this.sawCR = false;
            this.gotit = false;
        }

        if (this.state === 'Body' && offset < size) {
            this.state = this.readBody(buffer, offset, size);
            if (this.state === 'Body') {
                return;
            }
        }

        if (this.state === 'BodyFinished' && offset < size) {
            this.state = this.readCRLF(buffer, offset, size);
            if (this.state === 'BodyFinished') {
                return;
            }
            this.sawCR = false;
        }

        if (this.state === 'Trailer' && offset < size) {
            this.state = this.readTrailer(buffer, offset, size);
            if (this.state === 'Trailer') {
                return;
            }
            this.saved = '';
            this.sawCR = false;
            this.gotit = false;
        }

        if (offset < size) {
            this.internalWrite(buffer, offset, size);
        }
    }

    readBody(buffer, offset, size) {
        if (this.chunkSize === 0) {
            return 'BodyFinished';
        }

        let diff = size - offset;
        if (diff + this.chunkRead > this.chunkSize) {
            diff = this.chunkSize - this.chunkRead;
        }

        const chunk = new Uint8Array(diff);
        chunk.set(buffer.subarray(offset, offset + diff), 0);
        this.chunks.push(chunk);
        offset += diff;
        this.chunkRead += diff;
        return (this.chunkRead === this.chunkSize) ? 'BodyFinished' : 'Body';
    }

    readCRLF(buffer, offset, size) {
        if (!this.sawCR) {
            if (String.fromCharCode(buffer[offset++]) !== '\r') {
                throw new Error('Expecting \\r.');
            }
            this.sawCR = true;
            if (offset === size) {
                return 'BodyFinished';
            }
        }

        if (this.sawCR && String.fromCharCode(buffer[offset++]) !== '\n') {
            throw new Error('Expecting \\n.');
        }

        return 'None';
    }

    readFromChunks(buffer, offset, size) {
        let nread = 0;
        const count = this.chunks.length;
        for (let i = 0; i < count; i++) {
            const chunk = this.chunks[i];
            if (!chunk) {
                continue;
            }

            if (chunk.Offset === chunk.Bytes.length) {
                this.chunks[i] = null;
                continue;
            }

            nread += chunk.Read(buffer, offset + nread, size - nread);
            if (nread === size) {
                break;
            }
        }

        return nread;
    }

    readTrailer(buffer, offset, size) {
        let c = 0;
        if (this.trailerState === 2 && String.fromCharCode(buffer[offset]) === '\r' && this.saved.length === 0) {
            offset++;
            if (offset < size && String.fromCharCode(buffer[offset]) === '\n') {
                offset++;
                return 'None';
            }

            offset--;
        }

        let st = this.trailerState;
        const stString = '\r\n\r';
        while (offset < size && st < 4) {
            c = String.fromCharCode(buffer[offset++]);
            if ((st === 0 || st === 2) && c === '\r') {
                st++;
                continue;
            }

            if ((st === 1 || st === 3) && c === '\n') {
                st++;
                continue;
            }

            if (st > 0) {
                this.saved += stString.substring(0, this.saved.length === 0 ? st - 2 : st);
                st = 0;
                if (this.saved.length > 4196) {
                    throw new Error('Error reading trailer (too long).');
                }
            }
        }

        if (st < 4) {
            this.trailerState = st;
            if (offset < size) {
                throw new Error('Error reading trailer.');
            }

            return 'Trailer';
        }

        const reader = this.saved.split('\n');
        let line;
        while (line = reader.shift()) {
            if (line !== '') {
                this.headers.push(line);
            }
        }

        return 'None';
    }

    static removeChunkExtension(input) {
        const idx = input.indexOf(';');
        if (idx === -1) {
            return input;
        }

        return input.substring(0, idx);
    }

    throwProtocolViolation(message) {
        const we = new WebException(message, null, WebExceptionStatus.ServerProtocolViolation, null);
        throw we;
    }

    read(buffer, offset, size) {
        return this.readFromChunks(buffer, offset, size);
    }

    resetBuffer() {
        this.chunkSize = -1;
        this.chunkRead = 0;
        this.chunks = [];
    }

    write(buffer, offset, size) {
        this.internalWrite(buffer, offset, size);
    }

    writeAndReadBack(buffer, offset, size, read) {
        if (offset + read > 0) {
            this.write(buffer, offset, offset + read);
        }

        read = this.read(buffer, offset, size);
    }
}

module.exports = ChunkStream;
