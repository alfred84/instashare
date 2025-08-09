import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { Auth } from '../../../core/auth/auth.service';
import { FileService, UserFile } from '../../../core/files/file.service';
import { MatDialog } from '@angular/material/dialog';
jest.mock('file-saver', () => ({ saveAs: jest.fn() }));
import { saveAs } from 'file-saver';
import { Dashboard } from './dashboard';

describe('Dashboard', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [
        { provide: FileService, useValue: { getFiles: jest.fn(() => of([])) } },
        { provide: Auth, useValue: { logout: jest.fn() } },
        { provide: MatDialog, useValue: { open: jest.fn(() => ({ afterClosed: () => of(undefined) })) } },
      ],
    });
    TestBed.overrideProvider(MatDialog, { useValue: { open: jest.fn(() => ({ afterClosed: () => of(undefined) })) } });
    await TestBed.compileComponents();

    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

// Additional tests

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
    });
    TestBed.overrideProvider(MatDialog, { useValue: dialogStub });
    await TestBed.compileComponents();

    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
    // Ensure our stubbed dialog is used instead of the real MatDialog
    (component as unknown as { dialog: MatDialog }).dialog = dialogStub as MatDialog;
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
    // Mock FileList since DataTransfer is not available in jsdom
    const fileList = {
      0: file,
      length: 1,
      item: () => file,
    } as unknown as FileList;
    Object.defineProperty(inputEl, 'files', { value: fileList, configurable: true });

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

  it('openRenameDialog should rename file and update list', async () => {
    // Seed current files
    component.files.set(initialFiles);
    await component.openRenameDialog(initialFiles[0]);
    expect((fileServiceStub.renameFile as unknown as jest.Mock).mock.calls.length).toBe(1);
  });

  it('logout should call Auth.logout', () => {
    component.logout();
    expect((authStub.logout as unknown as jest.Mock).mock.calls.length).toBe(1);
  });

  it('loadFiles should handle error and stop loading', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    (fileServiceStub.getFiles as unknown as jest.Mock).mockReturnValueOnce(throwError(() => new Error('fail')));
    component.loadFiles();
    expect(component.isLoading()).toBe(false);
    consoleSpy.mockRestore();
  });

  it('onFileSelected with no files should do nothing', () => {
    const inputEl = document.createElement('input');
    Object.defineProperty(inputEl, 'files', { value: { length: 0 }, configurable: true });
    const event = { target: inputEl } as unknown as Event;
    const loadSpy = jest.spyOn(component, 'loadFiles');
    component.onFileSelected(event);
    expect(loadSpy).not.toHaveBeenCalled();
  });

  it('onFileSelected should handle upload error and stop loading', () => {
    const inputEl = document.createElement('input');
    const file = new File(['content'], 'err.txt', { type: 'text/plain' });
    const fileList = { 0: file, length: 1, item: () => file } as unknown as FileList;
    Object.defineProperty(inputEl, 'files', { value: fileList, configurable: true });
    const event = { target: inputEl } as unknown as Event;

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const loadSpy = jest.spyOn(component, 'loadFiles');
    (fileServiceStub.uploadFile as unknown as jest.Mock).mockReturnValueOnce(throwError(() => new Error('upload')));
    component.onFileSelected(event);
    expect(component.isLoading()).toBe(false);
    expect(loadSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('openRenameDialog should do nothing when canceled', async () => {
    // Seed
    component.files.set(initialFiles);
    // Configure dialog to return undefined (cancel)
    const dlg = TestBed.inject(MatDialog) as unknown as { open: jest.Mock };
    dlg.open.mockReturnValue({ afterClosed: () => of(undefined) });
    (component as unknown as { dialog: MatDialog }).dialog = dlg as unknown as MatDialog;

    const renameSpy = fileServiceStub.renameFile as unknown as jest.Mock;
    const callsBefore = renameSpy.mock.calls.length;
    await component.openRenameDialog(initialFiles[0]);
    expect(renameSpy.mock.calls.length).toBe(callsBefore);
  });

  it('openRenameDialog should handle rename error and stop loading', async () => {
    component.files.set(initialFiles);
    // Configure dialog to return a new name
    const dlg = TestBed.inject(MatDialog) as unknown as { open: jest.Mock };
    dlg.open.mockReturnValue({ afterClosed: () => of('renamed-bad.txt') });
    (component as unknown as { dialog: MatDialog }).dialog = dlg as unknown as MatDialog;

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    (fileServiceStub.renameFile as unknown as jest.Mock).mockReturnValueOnce(throwError(() => new Error('rename')));
    await component.openRenameDialog(initialFiles[0]);
    expect(component.isLoading()).toBe(false);
    consoleSpy.mockRestore();
  });

  it('downloadFile should handle error', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    (fileServiceStub.downloadFile as unknown as jest.Mock).mockReturnValueOnce(throwError(() => new Error('dl')));
    component.downloadFile(initialFiles[0]);
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
