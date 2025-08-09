import { Component, OnInit, inject, signal, ChangeDetectionStrategy, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Auth } from '../../../core/auth/auth.service';
import { FileService, UserFile } from '../../../core/files/file.service';
import { saveAs } from 'file-saver';

// Material Imports
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatListModule,
    MatIconModule,
    MatToolbarModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatTooltipModule,
    MatProgressBarModule,
    MatSnackBarModule,
  ],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard implements OnInit {
  private authService = inject(Auth);
  private fileService = inject(FileService);
  private dialog = inject(MatDialog);
  private snackbar = inject(MatSnackBar);
  private platformId = inject(PLATFORM_ID);

  files = signal<UserFile[]>([]);
  isLoading = signal<boolean>(false);

  ngOnInit(): void {
    this.loadFiles();
  }

  loadFiles(): void {
    this.isLoading.set(true);
    this.fileService.getFiles().subscribe({
      next: (files: UserFile[]) => {
        this.files.set(files);
        this.isLoading.set(false);
      },
      error: (err: unknown) => {
        console.error('Error loading files', err);
        this.toast('Failed to load files', 'Dismiss');
        this.isLoading.set(false);
      },
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.isLoading.set(true);
      this.fileService.uploadFile(file).subscribe({
        next: () => {
          this.loadFiles(); // Refresh the file list
          this.toast('File uploaded', 'OK', 2500);
        },
        error: (err: unknown) => {
          console.error('Error uploading file', err);
          this.toast('Upload failed', 'Dismiss');
          this.isLoading.set(false);
        },
      });
    }
  }

  downloadFile(file: UserFile): void {
    this.fileService.downloadFile(file.id).subscribe({
      next: (blob: Blob) => {
        saveAs(blob, `${file.originalName}.zip`);
      },
      error: (err: unknown) => {
        console.error('Error downloading file', err);
        this.toast('Download failed', 'Dismiss');
      },
    });
  }

  logout(): void {
    this.authService.logout();
  }

  async requestLogout(): Promise<void> {
    try {
      const { ConfirmDialog } = await import('../../../shared/dialogs/confirm-dialog/confirm-dialog');
      const dialogRef = this.dialog.open(ConfirmDialog, {
        width: '420px',
        data: {
          title: 'Logout',
          message: 'Are you sure you want to logout?',
          confirmText: 'Logout',
          cancelText: 'Cancel',
        },
      });

      dialogRef.afterClosed().subscribe((confirmed?: boolean) => {
        if (confirmed) {
          this.logout();
        }
      });
    } catch {
      // Fallback: if dynamic import fails, perform direct logout to avoid trapping users
      this.logout();
    }
  }

  async openRenameDialog(file: UserFile): Promise<void> {
    const { RenameDialog } = await import('../../../shared/dialogs/rename-dialog/rename-dialog');
    const dialogRef = this.dialog.open(RenameDialog, {
      width: '500px',
      data: { fileName: file.originalName },
    });

    dialogRef.afterClosed().subscribe((newName?: string) => {
      if (newName && newName !== file.originalName) {
        this.isLoading.set(true);
        this.fileService.renameFile(file.id, newName).subscribe({
          next: (updatedFile: UserFile) => {
            this.files.update(currentFiles => {
              const index = currentFiles.findIndex(f => f.id === file.id);
              const newFiles = [...currentFiles];
              if (index !== -1) {
                newFiles[index] = updatedFile;
              }
              return newFiles;
            });
            this.isLoading.set(false);
            this.toast('File renamed', 'OK', 2500);
          },
          error: (err: unknown) => {
            console.error('Error renaming file', err);
            this.toast('Rename failed', 'Dismiss');
            this.isLoading.set(false);
          },
        });
      }
    });
  }

  trackById(index: number, file: UserFile): string {
    return file.id;
  }

  chipColor(status: string): 'primary' | 'accent' | 'warn' | undefined {
    switch (status) {
      case 'COMPLETED':
        return 'primary';
      case 'PROCESSING':
        return 'accent';
      case 'FAILED':
        return 'warn';
      default:
        return undefined;
    }
  }

  statusClass(status: string): string {
    switch (status) {
      case 'COMPLETED':
        return 'completed';
      case 'PROCESSING':
        return 'processing';
      case 'FAILED':
        return 'failed';
      default:
        return 'unknown';
    }
  }

  private toast(message: string, action: string, duration = 3000): void {
    if (isPlatformBrowser(this.platformId)) {
      this.snackbar.open(message, action, { duration });
    }
  }
}
