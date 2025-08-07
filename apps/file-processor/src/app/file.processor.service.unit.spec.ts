import { FileProcessorService } from './file.processor.service';

describe('FileProcessorService - Unit Tests', () => {
  describe('zipBuffer', () => {
    it('should compress a buffer into a zip archive', async () => {
      // Since zipBuffer is a private method, we access it via the prototype.
      // This test is isolated and does not require a full service instance.
      const serviceInstance = Object.create(FileProcessorService.prototype);

      const inputString = 'hello world';
      const inputBuffer = Buffer.from(inputString);
      const fileName = 'test.txt';

      const zippedBuffer = await serviceInstance.zipBuffer(inputBuffer, fileName);

      expect(zippedBuffer).toBeInstanceOf(Buffer);
      expect(zippedBuffer.length).toBeGreaterThan(0);
    });
  });
});
