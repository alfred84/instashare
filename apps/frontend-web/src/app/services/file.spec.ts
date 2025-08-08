import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { FileService, UserFile } from './file';
import { Auth } from './auth';
import type { Signal } from '@angular/core';

describe('FileService', () => {
  let service: FileService;
  let httpMock: HttpTestingController;

  const tokenStub = (() => 'jwt-token') as unknown as Signal<string | null>;
  const authStub: Pick<Auth, 'token'> = { token: tokenStub };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [{ provide: Auth, useValue: authStub }],
    });
    service = TestBed.inject(FileService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('getFiles should call GET /api/files with auth header', () => {
    const mock: UserFile[] = [
      { id: '1', originalName: 'a.txt', size: 100, mimeType: 'text/plain', createdAt: new Date().toISOString(), status: 'COMPLETED' },
    ];

    service.getFiles().subscribe((res) => {
      expect(res).toEqual(mock);
    });

    const req = httpMock.expectOne('http://localhost:3333/api/files');
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('Authorization')).toBe('Bearer jwt-token');
    req.flush(mock);
  });

  it('uploadFile should POST form data with auth header', () => {
    const file = new File(['content'], 'a.txt', { type: 'text/plain' });
    const mock: UserFile = { id: '1', originalName: 'a.txt', size: 100, mimeType: 'text/plain', createdAt: new Date().toISOString(), status: 'PROCESSING' };

    service.uploadFile(file).subscribe((res) => expect(res).toEqual(mock));

    const req = httpMock.expectOne('http://localhost:3333/api/files/upload');
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.get('Authorization')).toBe('Bearer jwt-token');
    expect(req.request.body instanceof FormData).toBe(true);
    req.flush(mock);
  });

  it('renameFile should PATCH with newName and auth header', () => {
    const mock: UserFile = { id: '1', originalName: 'b.txt', size: 100, mimeType: 'text/plain', createdAt: new Date().toISOString(), status: 'COMPLETED' };
    service.renameFile('1', 'b.txt').subscribe((res) => expect(res).toEqual(mock));

    const req = httpMock.expectOne('http://localhost:3333/api/files/1/rename');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.headers.get('Authorization')).toBe('Bearer jwt-token');
    expect(req.request.body).toEqual({ newName: 'b.txt' });
    req.flush(mock);
  });

  it('downloadFile should GET blob with auth header', () => {
    service.downloadFile('1').subscribe((res) => {
      expect(res).toBeInstanceOf(Blob);
    });

    const req = httpMock.expectOne('http://localhost:3333/api/files/1');
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('Authorization')).toBe('Bearer jwt-token');
    expect(req.request.responseType).toBe('blob');
    req.flush(new Blob(['zip'], { type: 'application/zip' }));
  });
});
