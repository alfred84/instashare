import { FileProcessorService } from './file.processor.service';

// Mock PrismaClient
jest.mock('@prisma/client', () => {
  const update = jest.fn();
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      file: { update },
    })),
    __fileUpdate: update,
  };
});

// Mock ioredis to avoid real connections
jest.mock('ioredis', () => {
  const subscribe = jest.fn();
  const on = jest.fn();
  const publish = jest.fn();
  const Redis = jest.fn().mockImplementation(() => ({
    subscribe: (...args: any[]) => (subscribe as any)(...args),
    on: (...args: any[]) => (on as any)(...args),
    publish: (...args: any[]) => (publish as any)(...args),
  }));
  return Object.assign(Redis, { __subscribe: subscribe, __on: on, __publish: publish });
});

const { __fileUpdate: prismaUpdate } = require('@prisma/client');
const { __subscribe: redisSubscribeMock, __on: redisOnMock } = require('ioredis');

describe('FileProcessorService', () => {
  let service: FileProcessorService;

  beforeEach(() => {
    service = new FileProcessorService();
    prismaUpdate.mockReset();
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore?.();
  });

  it('processFile success: sets PROCESSING, zips, and sets COMPLETED with zippedData', async () => {
    prismaUpdate
      .mockResolvedValueOnce({ id: 'f1', originalName: 'a.txt', fileData: Buffer.from('abc') })
      .mockResolvedValueOnce({ id: 'f1', status: 'COMPLETED', zippedData: Buffer.from('zip') });

    jest.spyOn<any, any>(service as any, 'zipBuffer').mockResolvedValue(Buffer.from('zip'));

    await (service as any).processFile('f1');

    expect(prismaUpdate).toHaveBeenNthCalledWith(1, { where: { id: 'f1' }, data: { status: 'PROCESSING' } });
    expect(prismaUpdate).toHaveBeenNthCalledWith(2, { where: { id: 'f1' }, data: { zippedData: Buffer.from('zip'), status: 'COMPLETED' } });
  });

  it('processFile returns early when file has no data', async () => {
    prismaUpdate.mockResolvedValueOnce({ id: 'f1', originalName: 'a.txt', fileData: null });

    await (service as any).processFile('f1');

    // Only first update should occur
    expect(prismaUpdate).toHaveBeenCalledTimes(1);
  });

  it('processFile on error sets FAILED status', async () => {
    prismaUpdate
      .mockImplementationOnce(() => { throw new Error('db'); })
      .mockResolvedValueOnce({});

    await (service as any).processFile('f1');

    expect(prismaUpdate).toHaveBeenNthCalledWith(2, { where: { id: 'f1' }, data: { status: 'FAILED' } });
  });

  it('processFile completes but zippedData null triggers verification failed branch', async () => {
    prismaUpdate
      .mockResolvedValueOnce({ id: 'f1', originalName: 'a.txt', fileData: Buffer.from('abc') })
      .mockResolvedValueOnce({ id: 'f1', status: 'COMPLETED', zippedData: null });

    jest.spyOn<any, any>(service as any, 'zipBuffer').mockResolvedValue(Buffer.from('zip'));

    await (service as any).processFile('f1');

    expect(prismaUpdate).toHaveBeenNthCalledWith(2, { where: { id: 'f1' }, data: { zippedData: Buffer.from('zip'), status: 'COMPLETED' } });
  });

  it('start subscribes to redis and processes file-uploaded messages', async () => {
    const spy = jest.spyOn<any, any>(service as any, 'processFile').mockResolvedValue(undefined);

    await service.start();

    // simulate successful subscribe callback
    const subscribeCb = redisSubscribeMock.mock.calls[0][1];
    subscribeCb?.(null);

    // find message handler and invoke with matching channel
    const messageHandler = redisOnMock.mock.calls.find((c: any[]) => c[0] === 'message')?.[1];
    expect(typeof messageHandler).toBe('function');
    messageHandler?.('file-uploaded', 'f1');
    expect(spy).toHaveBeenCalledWith('f1');

    // Non-matching channel should not trigger another call
    spy.mockClear();
    messageHandler?.('other', 'f2');
    expect(spy).not.toHaveBeenCalled();
  });

  it('start handles subscribe error and calls process.exit(1)', async () => {
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation((() => undefined as never));
    await service.start();
    const subscribeCb = redisSubscribeMock.mock.calls[0][1];
    subscribeCb?.(new Error('fail'));
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
  });

  it('processFile: FAILED status update rejection triggers catch logger', async () => {
    prismaUpdate
      .mockImplementationOnce(() => { throw new Error('initial'); }) // enter catch
      .mockRejectedValueOnce(new Error('failed update')); // cause inner .catch to run

    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    await (service as any).processFile('f1');

    // Expect inner catch logger to have been called with the FAILED message
    expect(errSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to update status to FAILED for file f1'),
      expect.any(Error)
    );

    errSpy.mockRestore();
  });
});
