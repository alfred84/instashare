import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Auth } from './auth';

// Interface for the file data model
export interface UserFile {
  id: string;
  originalName: string;
  size: number;
  mimeType: string;
  createdAt: string;
  status: string;
}

@Injectable({
  providedIn: 'root',
})
export class FileService { // Renamed from 'File' to avoid conflict
  private readonly apiUrl = 'http://localhost:3333/api/files';
  private authService = inject(Auth);
  private http = inject(HttpClient);

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.token();
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
  }

  getFiles(): Observable<UserFile[]> {
    return this.http.get<UserFile[]>(this.apiUrl, {
      headers: this.getAuthHeaders(),
    });
  }

  uploadFile(file: File): Observable<UserFile> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<UserFile>(`${this.apiUrl}/upload`, formData, {
      headers: this.getAuthHeaders(),
    });
  }

  renameFile(fileId: string, newName: string): Observable<UserFile> {
    return this.http.patch<UserFile>(`${this.apiUrl}/${fileId}/rename`, { newName }, {
      headers: this.getAuthHeaders(),
    });
  }

  downloadFile(fileId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${fileId}`, {
      headers: this.getAuthHeaders(),
      responseType: 'blob',
    });
  }
}
