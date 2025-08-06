import { Routes } from '@angular/router';
import { HomePageComponent } from './Pages/home-page/home-page.component';
import { AdminPageComponent } from './Pages/admin-page/admin-page.component';
import { EventsComponent } from './Pages/events/events.component';
import { UsersComponent } from './Pages/users/users.component';
import { GalleryComponent } from './Pages/gallery/gallery.component';


export const routes: Routes = [
  { path: '', component: HomePageComponent },
  { path: 'registrations', component: AdminPageComponent },
  { path: 'events', component: EventsComponent },
  { path: 'users', component: UsersComponent },
  { path: 'gallery', component: GalleryComponent },
];
