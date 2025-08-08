// This spec focuses on covering the zipBuffer error path by mocking archiver to emit an error

jest.mock('archiver', () => {
  return jest.fn(() => {
    const handlers: Record<string, (arg?: unknown) => void> = {};
    return {
      on: (event: string, cb: (arg?: unknown) => void) => {
        handlers[event] = cb;
      },
      append: jest.fn(),
      finalize: jest.fn(() => {
        // Immediately emit error when finalize is called
        handlers['error']?.(new Error('zip fail'));
      }),
    };
  });
});

import { FileProcessorService } from './file.processor.service';

describe('FileProcessorService zipBuffer error path', () => {
  it('rejects when archiver emits error', async () => {
    // Access private method via prototype to keep scope minimal
    const serviceInstance = Object.create(FileProcessorService.prototype) as any;

    await expect(serviceInstance.zipBuffer(Buffer.from('x'), 'f.txt')).rejects.toThrow('zip fail');
  });
});
