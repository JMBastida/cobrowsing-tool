import { Component, OnInit, inject } from '@angular/core';
import {RouterOutlet, Router, NavigationEnd, ActivatedRoute, RouterLinkActive, RouterLink} from '@angular/router';
import { MenubarModule } from 'primeng/menubar';
import { MenuItem } from 'primeng/api';
import { filter, map } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../../shared/services/auth.service';
import {Toolbar} from "primeng/toolbar";

@Component({
  selector: 'app-dashboard',
  standalone: true,
    imports: [RouterOutlet, MenubarModule, CommonModule, BreadcrumbModule, ButtonModule, RouterLinkActive, RouterLink, Toolbar],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private authService = inject(AuthService);

  items: MenuItem[] | undefined;
  home: MenuItem | undefined;
  breadcrumbs: MenuItem[] = [];

  ngOnInit() {
    this.items = [
      {
        label: 'Sessions',
        icon: 'pi pi-users',
        routerLink: '/dashboard/sessions',
        routerLinkActiveOptions: { exact: false } // Active for child routes too
      },
      {
        label: 'Settings',
        icon: 'pi pi-cog',
        routerLink: '/dashboard/settings'
      }
    ];

    this.home = { icon: 'pi pi-home', routerLink: '/dashboard' };

    // Listen to route changes to update breadcrumbs
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        map(() => this.activatedRoute)
      )
      .subscribe(() => {
        this.breadcrumbs = this.createBreadcrumbs(this.activatedRoute.root);
      });
      
    // Initial breadcrumbs
    this.breadcrumbs = this.createBreadcrumbs(this.activatedRoute.root);
  }

  private createBreadcrumbs(route: ActivatedRoute, url: string = '', breadcrumbs: MenuItem[] = []): MenuItem[] {
    const children: ActivatedRoute[] = route.children;

    if (children.length === 0) {
      return breadcrumbs;
    }

    for (const child of children) {
      const routeURL: string = child.snapshot.url.map(segment => segment.path).join('/');
      if (routeURL !== '') {
        url += `/${routeURL}`;
      }

      // Add breadcrumb if the route has a label or we can infer one
      let label = 'Dashboard';
      if (routeURL === 'sessions') label = 'Sessions';
      else if (routeURL === 'settings') label = 'Settings';
      else if (routeURL === 'cobrowsing') label = 'Co-browsing';
      else if (child.snapshot.paramMap.has('id')) label = 'Session Detail'; // Or fetch client name if possible

      // Avoid duplicate 'Dashboard' if it's the root
      if (url !== '/dashboard') {
          breadcrumbs.push({ label, routerLink: url });
      }
      
      return this.createBreadcrumbs(child, url, breadcrumbs);
    }
    
    return breadcrumbs;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
