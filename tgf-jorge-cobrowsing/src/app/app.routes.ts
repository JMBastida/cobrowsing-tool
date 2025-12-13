import { Routes } from '@angular/router';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { SessionsComponent } from './features/sessions/sessions.component';
import { SettingsComponent } from './features/settings/settings.component';
import { LoginComponent } from './features/login/login.component';
import { authGuard } from './shared/guards/auth.guard';
import { CobrowsingComponent } from './features/cobrowsing/cobrowsing.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'sessions', pathMatch: 'full' },
      { path: 'sessions', component: SessionsComponent },
      { path: 'settings', component: SettingsComponent },
      { path: 'cobrowsing/:id', component: CobrowsingComponent }
    ]
  },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
];
