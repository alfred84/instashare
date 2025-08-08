import { Route } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const appRoutes: Route[] = [
    { 
        path: 'login', 
        loadComponent: () => import('./components/login/login').then(m => m.Login)
    },
    { 
        path: 'register', 
        loadComponent: () => import('./components/register/register').then(m => m.Register)
    },
    { 
        path: 'dashboard', 
        loadComponent: () => import('./components/dashboard/dashboard').then(m => m.Dashboard),
        canActivate: [authGuard]
    },
    { path: '', redirectTo: '/login', pathMatch: 'full' },
    { path: '**', redirectTo: '/dashboard' } 
];
