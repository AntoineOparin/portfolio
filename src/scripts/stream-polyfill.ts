// Safari 18 and older can't `for await` over a ReadableStream, which pdf.js
// does (text extraction, decompression). Add the async iterator if missing.
const proto = ReadableStream.prototype as ReadableStream & {
  [Symbol.asyncIterator]?: () => AsyncIterableIterator<unknown>;
  values?: () => AsyncIterableIterator<unknown>;
};

if (!proto[Symbol.asyncIterator]) {
  proto.values = async function* (this: ReadableStream) {
    const reader = this.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) return;
        yield value;
      }
    } finally {
      reader.releaseLock();
    }
  };
  proto[Symbol.asyncIterator] = proto.values;
}

export {};
