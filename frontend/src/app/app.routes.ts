import { Routes } from '@angular/router';
import { AdminPageComponent } from './pages/admin-page.component';
import { PublicPageComponent } from './pages/public-page.component';

export const routes: Routes = [
  { path: '', component: PublicPageComponent },
  { path: 'admin', component: AdminPageComponent },
  { path: '**', redirectTo: '' },
];
