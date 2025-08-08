import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Dashboard } from './dashboard';

describe('Dashboard', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Dashboard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

// Additional tests
import { of, Subject } from 'rxjs';
import { Auth } from '../../services/auth';
import { FileService, UserFile } from '../../services/file';
import { MatDialog } from '@angular/material/dialog';

jest.mock('file-saver', () => ({ saveAs: jest.fn() }));
import { saveAs } from 'file-saver';

describe('Dashboard - behaviors', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;

  const initialFiles: UserFile[] = [
    { id: '1', originalName: 'doc.txt', size: 2048, mimeType: 'text/plain', createdAt: new Date().toISOString(), status: 'COMPLETED' },
  ];

  const getFiles$ = new Subject<UserFile[]>();
  const fileServiceStub: Pick<FileService, 'getFiles' | 'uploadFile' | 'renameFile' | 'downloadFile'> = {
    getFiles: jest.fn(() => getFiles$.asObservable()) as unknown as FileService['getFiles'],
    uploadFile: jest.fn(() => of(initialFiles[0])) as unknown as FileService['uploadFile'],
    renameFile: jest.fn((id: string, newName: string) => of({ ...initialFiles[0], originalName: newName })) as unknown as FileService['renameFile'],
    downloadFile: jest.fn(() => of(new Blob(['zip'], { type: 'application/zip' }))) as unknown as FileService['downloadFile'],
  };

  const authStub: Pick<Auth, 'logout'> = {
    logout: jest.fn() as unknown as Auth['logout'],
  };

  const dialogStub: Pick<MatDialog, 'open'> = {
    open: jest.fn(() => ({ afterClosed: () => of('renamed.txt') })) as unknown as MatDialog['open'],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [
        { provide: FileService, useValue: fileServiceStub },
        { provide: Auth, useValue: authStub },
        { provide: MatDialog, useValue: dialogStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loadFiles should update files signal', () => {
    component.loadFiles();
    getFiles$.next(initialFiles);
    expect(component.files()).toHaveLength(1);
    expect(component.files()[0].originalName).toBe('doc.txt');
  });

  it('onFileSelected should call uploadFile and then refresh list', () => {
    const inputEl = document.createElement('input');
    const file = new File(['content'], 'new.txt', { type: 'text/plain' });
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    inputEl.files = dataTransfer.files;

    const event = { target: inputEl } as unknown as Event;

    const loadSpy = jest.spyOn(component, 'loadFiles');
    component.onFileSelected(event);
    expect((fileServiceStub.uploadFile as unknown as jest.Mock).mock.calls.length).toBe(1);
    expect(loadSpy).toHaveBeenCalled();
  });

  it('downloadFile should save blob as zip', () => {
    component.downloadFile(initialFiles[0]);
    expect((saveAs as unknown as jest.Mock).mock.calls.length).toBe(1);
  });

  it('openRenameDialog should rename file and update list', () => {
    // Seed current files
    component.files.set(initialFiles);
    component.openRenameDialog(initialFiles[0]);
    expect((fileServiceStub.renameFile as unknown as jest.Mock).mock.calls.length).toBe(1);
  });

  it('logout should call Auth.logout', () => {
    component.logout();
    expect((authStub.logout as unknown as jest.Mock).mock.calls.length).toBe(1);
  });
});
