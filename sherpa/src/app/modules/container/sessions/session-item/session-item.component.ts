import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';

import { Subscription } from 'rxjs';

import { UsersService } from '../../../shared/services/user.service';
import { LanguageService } from '../../../shared/services/language.service';

import { BASIC_PROPERTIES, IconSelect, SeverityRange } from '../../../shared/enums/session.enums';
import { SessionItemModel } from 'src/app/modules/shared/interfaces/sessions.interfaces';

@Component({
  selector: 'shr-session-list-item',
  templateUrl: './session-item.component.html',
  styleUrls: ['./session-item.component.scss']
})
export class SessionListItemComponent implements OnInit, OnDestroy {
  @Input() selectedSessionId: any;
  @Input() clientData: any;
  @Input() agents: any;
  @Output() watchSession = new EventEmitter<SessionItemModel>();

  user: any;
  basicProperties = BASIC_PROPERTIES;
  lan: string = '';
  isAccordionCollapsed = true;
  subTabExpanded: boolean[] = [];
  customDataItems: any[] = [];
  languageSubscription: Subscription = new Subscription;
  userSubscription: Subscription = new Subscription;
  customer: UserModel = {};
  sessions: SessionItemModel[] = [];

  constructor(
    private usersService: UsersService,
    private languageService: LanguageService,
  ) {
    this.onLanguageChange(this.languageService.lan);
    this.languageSubscription = this.languageService.language.subscribe(lan => this.onLanguageChange(lan));
    this.user = this.usersService.user;
    this.userSubscription = this.usersService.userSubject.subscribe(user => this.user = user);
  }

  ngOnDestroy(): void {
    this.languageSubscription.unsubscribe();
    this.userSubscription.unsubscribe();
  }

  ngOnInit(): void {
    this.customer = this.clientData.customer;
    this.sessions = this.clientData.sessions;
  }

  filterSessions() {
    let icons: string[] = [];
    const iconSessionFilteredArray: SessionItemModel[] = this.sessions.filter((session) => {
      const icon = this.setIconToSession(session);
      if (icons.indexOf(icon) === -1) {
        icons.push(icon);
        return true;
      }

      return false;
    });

    return iconSessionFilteredArray
  }

  toggleTabAccordion(event: MouseEvent): void {
    event.stopPropagation();
    this.isAccordionCollapsed = !this.isAccordionCollapsed;
  }

  toggleSubTabAccordion(event: MouseEvent, index: number): void {
    event.stopPropagation();
    this.subTabExpanded[index] = !this.subTabExpanded[index];
  }

  setIconToSession(session: SessionItemModel): string {
    let icon = '../../../../../assets/icons/fontawesome/non-active-tab.svg'
    if (session.userCode && session.userCode === this.user.code) icon = '../../../../../assets/icons/fontawesome/smart-link-icon.svg';
    if (session.pin) icon = '../../../../../assets/icons/fontawesome/pin-icon.svg';
    if (session.isHelpRequest) icon = '../../../../../assets/icons/fontawesome/help-btn-icon.svg';
    if (session.isCustomFlowTriggered) icon = '../../../../../assets/icons/fontawesome/ray-vector.svg';
    if (session.isInTab) icon = '../../../../../assets/icons/fontawesome/active-tab.svg';
    return icon;
  }

  onLanguageChange(lan: string): void {
    this.lan = lan;
  }

  onSessionSelect(session: SessionItemModel): void {
    this.watchSession.emit(session);
  }

  isSpecialIcon(session: SessionItemModel): boolean {
    if (session.isHelpRequest || session.pin || session.isCustomFlowTriggered || (session.userCode && session.userCode === this.user.code)) return true;
    return false;
  }

}

interface UserModel {
  uid?: string,
  name?: string,
  firstConnectionDate?: string,
  city?: string,
}