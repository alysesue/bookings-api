import * as zlib from 'zlib';
import { ErrorCodeV2, MOLErrorV2 } from 'mol-lib-api-contract';

export class Compression {
	public static compress(buffer: Buffer): Buffer {
		return zlib.brotliCompressSync(buffer, {
			params: {
				[zlib.constants.BROTLI_PARAM_MODE]: zlib.constants.BROTLI_MODE_TEXT,
			},
		});
	}
	public static decompress(encodedData: Buffer): Buffer {
		try {
			return zlib.brotliDecompressSync(encodedData);
		} catch (e) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage('Decompression failed.');
		}
	}
}
