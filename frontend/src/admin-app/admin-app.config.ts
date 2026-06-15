import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withViewTransitions } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { adminRoutes } from './admin-routes';
import { jwtInterceptor } from '../app/core/interceptors/jwt-interceptor';

export const adminAppConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(adminRoutes, withViewTransitions()),
    provideHttpClient(withInterceptors([jwtInterceptor])),
    provideAnimations(),
  ],
};
