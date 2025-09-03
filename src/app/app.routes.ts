import { Routes } from '@angular/router';
import { HomePageComponent } from './pages/home-page/home-page.component';
import { AdminPageComponent } from './pages/admin-page/admin-page.component';
import { EventsComponent } from './pages/events/events.component';
import { UsersComponent } from './pages/users/users.component';
import { GalleryComponent } from './pages/gallery/gallery.component';


export const routes: Routes = [
  { path: '', component: HomePageComponent },
  { path: 'registrations', component: AdminPageComponent },
  { path: 'events', component: EventsComponent },
  { path: 'users', component: UsersComponent },
  { path: 'gallery', component: GalleryComponent },
];
