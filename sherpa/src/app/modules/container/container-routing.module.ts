import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { UsersComponent } from './users/users.component';
import { ContainerComponent } from './container.component';
import { SessionsComponent } from './sessions/sessions.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ContactCenterComponent } from './contact-center/contact-center.component';

import { ROUTES } from '../shared/enums/views.enums';
import { SettingsComponent } from './settings/settings.component';

const containerRoutes: Routes = [
  {
    path: ROUTES.CONTAINER,
    component: ContainerComponent,
    children: [
      {
        path: ROUTES.DASHBOARD,
        component: DashboardComponent,
      },
      {
        path: ROUTES.SESSIONS,
        component: SessionsComponent,
      },
      {
        path: ROUTES.USERS,
        component: UsersComponent,
      },
      {
        path: ROUTES.HELP_CENTER,
        component: ContactCenterComponent,
      },
      {
        path: ROUTES.SETTINGS,
        component: SettingsComponent,
      },
    ]
  },
];

@NgModule({
  imports: [RouterModule.forChild(containerRoutes)],
  exports: [RouterModule]
})
export class ContainerRoutingModule { }
