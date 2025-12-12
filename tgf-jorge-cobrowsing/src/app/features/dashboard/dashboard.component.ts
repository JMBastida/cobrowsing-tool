import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ProgressBarModule } from 'primeng/progressbar';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { AvatarModule } from 'primeng/avatar';
import { DividerModule } from 'primeng/divider';

import { UsersService } from '../../shared/services/user.service';
import { EntitiesService } from '../../shared/services/entities.service';
import { LanguageService } from '../../shared/services/language.service';
import { LiteralPipe } from '../../shared/pipes/literal.pipe';
import { ROUTES } from '../../shared/enums/views.enums';
import { USER_ROLES } from '../../shared/enums/user.enums';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    ProgressBarModule,
    ButtonModule,
    LiteralPipe,
    CardModule,
    AvatarModule,
    DividerModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent {
  private router = inject(Router);
  private usersService = inject(UsersService);
  private entitiesService = inject(EntitiesService);
  private languageService = inject(LanguageService);
  private literalPipe = inject(LiteralPipe);

  user = this.usersService.user;
  entity = this.entitiesService.entity;
  lan = this.languageService.lan;

  userName = computed(() => this.user()?.name);
  userInitials = computed(() => {
    const name = this.user()?.name || '';
    const lastName = this.user()?.lastName || '';
    return (name.charAt(0) + lastName.charAt(0)).toUpperCase();
  });

  isAdmin = computed(() => this.user()?.role === USER_ROLES.ADMIN);

  percent = computed(() => {
    let percent = 0;
    const inc = this.isAdmin() ? 100 / 8 : 100 / 4;
    const currentUser = this.user();
    if (currentUser) {
      if (currentUser.name) percent += inc;
      if (currentUser.lastName) percent += inc;
      if (currentUser.email) percent += inc;
      if (currentUser.avatarUrl) percent += inc;
    }

    const currentEntity = this.entity();
    if (currentEntity && this.isAdmin()) {
      if (currentEntity.companyName) percent += inc;
      if (currentEntity.companySite) percent += inc;
      if (currentEntity.companyPhone) percent += inc;
      if (currentEntity.companyEmail) percent += inc;
    }

    return Math.round(percent);
  });

  options = computed(() => {
    const baseOptions = [
      {
        label: this.literalPipe.transform('MENU.SESSIONS', this.lan()),
        description: 'Manage and view active sessions',
        url: ROUTES.SESSIONS,
        icon: 'pi pi-desktop',
        color: 'blue'
      },
      {
        label: this.literalPipe.transform('MENU.HELP_CENTER', this.lan()),
        description: 'Get support and documentation',
        url: ROUTES.HELP_CENTER,
        icon: 'pi pi-question-circle', // Changed to standard PI icon for consistency
        color: 'cyan'
      },
      {
        label: this.literalPipe.transform('MENU.SETTINGS', this.lan()),
        description: 'Configure your application',
        url: ROUTES.SETTINGS,
        icon: 'pi pi-cog',
        color: 'orange'
      },
    ];

    if (this.isAdmin()) {
      return [
        ...baseOptions,
        {
          label: this.literalPipe.transform('MENU.USERS', this.lan()),
          description: 'Manage team members',
          url: ROUTES.USERS,
          icon: 'pi pi-users',
          color: 'purple'
        },
      ];
    }

    return baseOptions;
  });

  message = '';

  onSelect(option: any) {
    this.goTo(option.url);
  }

  goTo(url: string) {
    this.router.navigate([url]);
  }

  goToSettings() {
    this.router.navigate([ROUTES.SETTINGS]);
  }
}
