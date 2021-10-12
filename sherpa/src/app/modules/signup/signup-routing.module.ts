import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SignupComponent } from './signup.component';
import { ROUTES } from '../shared/enums/views.enums';

const routes: Routes = [
  { path: ROUTES.SIGNUP, component: SignupComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class SignupRoutingModule { }
