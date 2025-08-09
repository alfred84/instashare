import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { RenameDialog, RenameDialogData } from './rename-dialog';

describe('RenameDialog', () => {
  let fixture: ComponentFixture<RenameDialog>;
  let component: RenameDialog;
  const dialogRefStub: Pick<MatDialogRef<RenameDialog>, 'close'> = {
    close: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    await TestBed.configureTestingModule({
      imports: [RenameDialog],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { fileName: 'original.txt' } as RenameDialogData },
        { provide: MatDialogRef, useValue: dialogRefStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RenameDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('onNoClick should close the dialog without value (Cancel)', () => {
    const buttons = fixture.nativeElement.querySelectorAll('button');
    // First button is Cancel per template order
    (buttons[0] as HTMLButtonElement).click();
    expect(dialogRefStub.close).toHaveBeenCalledWith();
  });

  it('Save button should close with current fileName', () => {
    component.data.fileName = 'renamed.txt';
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll('button');
    // Second button is Save per template order
    (buttons[1] as HTMLButtonElement).click();
    expect(dialogRefStub.close).toHaveBeenCalledWith('renamed.txt');
  });

  it('ngModel should update data.fileName when input changes', () => {
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    input.value = 'changed.txt';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(component.data.fileName).toBe('changed.txt');
  });
});
