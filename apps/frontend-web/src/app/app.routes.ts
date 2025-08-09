import { Route } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const appRoutes: Route[] = [
    { 
        path: 'login', 
        loadComponent: () => import('./features/auth/login/login').then(m => m.Login)
    },
    { 
        path: 'register', 
        loadComponent: () => import('./features/auth/register/register').then(m => m.Register)
    },
    { 
        path: 'dashboard', 
        loadComponent: () => import('./features/files/dashboard/dashboard').then(m => m.Dashboard),
        canActivate: [authGuard]
    },
    { path: '', redirectTo: '/login', pathMatch: 'full' },
    { path: '**', redirectTo: '/dashboard' } 
];
