import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PrivacyComponent } from './privacy.component';
import { ROUTES } from '../shared/enums/views.enums';

const routes: Routes = [
  { path: ROUTES.PRIVACY, component: PrivacyComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class PrivacyRoutingModule { }
