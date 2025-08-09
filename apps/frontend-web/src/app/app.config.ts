import { ApplicationConfig, APP_INITIALIZER, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, TitleStrategy, withPreloading, PreloadAllModules } from '@angular/router';
import { appRoutes } from './app.routes';
import {
  provideHttpClient,
  withInterceptorsFromDi,
  withFetch,
} from '@angular/common/http';
import {
  provideClientHydration,
  withEventReplay,
} from '@angular/platform-browser';
import { Title } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { AppTitleStrategy } from './core/seo/title.strategy';
import { SeoService } from './core/seo/seo.service';
import { preloadStandaloneComponents } from './core/perf/component-preloader';

export function initSeo(seo: SeoService) {
  return () => seo.init();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideClientHydration(withEventReplay()),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(appRoutes, withPreloading(PreloadAllModules)),
    provideHttpClient(withInterceptorsFromDi(), withFetch()),
    provideAnimationsAsync(),
    Title,
    { provide: TitleStrategy, useClass: AppTitleStrategy },
    { provide: APP_INITIALIZER, useFactory: initSeo, deps: [SeoService], multi: true },
    { provide: APP_INITIALIZER, useFactory: preloadStandaloneComponents, multi: true },
  ],
};
