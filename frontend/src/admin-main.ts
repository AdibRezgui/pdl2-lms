import { bootstrapApplication } from '@angular/platform-browser';
import { AdminAppComponent } from './admin-app/admin-app.component';
import { adminAppConfig } from './admin-app/admin-app.config';

bootstrapApplication(AdminAppComponent, adminAppConfig).catch(console.error);
