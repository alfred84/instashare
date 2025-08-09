import { Injectable, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly router = inject(Router);
  private readonly meta = inject(Meta);
  private readonly title = inject(Title);
  private readonly document = inject(DOCUMENT);

  init(): void {
    // Initial pass
    this.updateForCurrentRoute();

    // Update on navigation end
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => {
      this.updateForCurrentRoute();
    });
  }

  private updateForCurrentRoute(): void {
    const deepest = this.getDeepest(this.router.routerState.root);
    const data = (deepest.snapshot.data ?? {}) as Record<string, unknown>;
    const routeTitle = typeof data['title'] === 'string' ? (data['title'] as string) : undefined;
    const description = typeof data['description'] === 'string'
      ? (data['description'] as string)
      : 'Upload, manage, and share files securely with InstaShare.';
    const currentTitle = routeTitle ? `InstaShare — ${routeTitle}` : (this.title.getTitle() || 'InstaShare');
    const url = this.absoluteUrl();

    // Open Graph / Twitter / Description
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ property: 'og:title', content: currentTitle });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: currentTitle });
    this.meta.updateTag({ name: 'twitter:description', content: description });

    // Canonical
    this.setCanonical(url);
  }

  private getDeepest(route: ActivatedRoute): ActivatedRoute {
    let r = route;
    while (r.firstChild) {
      r = r.firstChild;
    }
    return r;
  }

  private absoluteUrl(): string {
    if (typeof window !== 'undefined' && window?.location) {
      return window.location.href;
    }
    return '/';
  }

  private setCanonical(url: string) {
    const head = this.document.head as HTMLHeadElement;
    let link = head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = this.document.createElement('link') as HTMLLinkElement;
      link.setAttribute('rel', 'canonical');
      head.appendChild(link);
    }
    link.setAttribute('href', url);
  }
}
