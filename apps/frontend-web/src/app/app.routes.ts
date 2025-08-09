import { Route } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const appRoutes: Route[] = [
    { 
        path: 'login', 
        loadComponent: () => import('./features/auth/login/login').then(m => m.Login),
        data: { title: 'Login', description: 'Login to your InstaShare account.' }
    },
    { 
        path: 'register', 
        loadComponent: () => import('./features/auth/register/register').then(m => m.Register),
        data: { title: 'Register', description: 'Create your InstaShare account and start sharing files.', preload: true }
    },
    { 
        path: 'dashboard', 
        loadComponent: () => import('./features/files/dashboard/dashboard').then(m => m.Dashboard),
        canActivate: [authGuard],
        data: { title: 'Dashboard', description: 'Upload, manage, and download your files.', preload: true }
    },
    { path: '', redirectTo: '/login', pathMatch: 'full' },
    { path: '**', redirectTo: '/dashboard' } 
];
