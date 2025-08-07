import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Auth } from '../../services/auth';
import { FileService, UserFile } from '../../services/file';
import { saveAs } from 'file-saver';

// Material Imports
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { RenameDialog } from '../rename-dialog/rename-dialog';

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
  ],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
})
export class Dashboard implements OnInit {
  private authService = inject(Auth);
  private fileService = inject(FileService);
  private dialog = inject(MatDialog);

  files = signal<UserFile[]>([]);
  isLoading = signal<boolean>(false);

  ngOnInit(): void {
    this.loadFiles();
  }

  loadFiles(): void {
    this.isLoading.set(true);
    this.fileService.getFiles().subscribe({
      next: (files) => {
        this.files.set(files);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading files', err);
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
        },
        error: (err) => {
          console.error('Error uploading file', err);
          this.isLoading.set(false);
        },
      });
    }
  }

  downloadFile(file: UserFile): void {
    this.fileService.downloadFile(file.id).subscribe({
      next: (blob) => {
        saveAs(blob, file.originalName);
      },
      error: (err) => {
        console.error('Error downloading file', err);
      },
    });
  }

  logout(): void {
    this.authService.logout();
  }

  openRenameDialog(file: UserFile): void {
    const dialogRef = this.dialog.open(RenameDialog, {
      width: '500px',
      data: { fileName: file.originalName },
    });

    dialogRef.afterClosed().subscribe(newName => {
      if (newName && newName !== file.originalName) {
        this.isLoading.set(true);
        this.fileService.renameFile(file.id, newName).subscribe({
          next: (updatedFile) => {
            this.files.update(currentFiles => {
              const index = currentFiles.findIndex(f => f.id === file.id);
              const newFiles = [...currentFiles];
              if (index !== -1) {
                newFiles[index] = updatedFile;
              }
              return newFiles;
            });
            this.isLoading.set(false);
          },
          error: (err) => {
            console.error('Error renaming file', err);
            this.isLoading.set(false);
          },
        });
      }
    });
  }
}
