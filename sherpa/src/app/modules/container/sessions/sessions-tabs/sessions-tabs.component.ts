import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Subscription } from 'rxjs';
import { SessionItemModel } from 'src/app/modules/shared/interfaces/sessions.interfaces';
import { LanguageService } from 'src/app/modules/shared/services/language.service';
import { UsersService } from 'src/app/modules/shared/services/user.service';

@Component({
  selector: 'shr-sessions-tabs-view',
  templateUrl: './sessions-tabs.component.html',
  styleUrls: ['./sessions-tabs.component.scss']
})
export class SessionsTabsViewComponent implements OnInit {

  @Input() selectedSessionId?: string;
  @Input() sessions?: SessionItemModel[];
  @Output() watchSession = new EventEmitter<SessionItemModel>();

  languageSubscription: Subscription = new Subscription;
  isCobrowsing: boolean = false;
  currentSession?: SessionItemModel;
  lan: string = '';
  user: any;

  constructor(private languageService: LanguageService, private usersService: UsersService,) {
    this.onLanguageChange(this.languageService.lan);
    this.user = this.usersService.user;
    this.languageSubscription = this.languageService.language.subscribe(lan => this.onLanguageChange(lan));
  }

  ngOnInit(): void {
    console.log(this.selectedSessionId);

    this.currentSession = this.sessions?.find((session: SessionItemModel) => session._id === this.selectedSessionId);
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

  isSpecialIcon(session: SessionItemModel): boolean {
    if (session.isHelpRequest || session.pin || session.isCustomFlowTriggered || (session.userCode && session.userCode === this.user.code)) return true;
    return false;
  }

  toggleTab(session: SessionItemModel): void {
    this.currentSession = session;
    this.watchSession.emit(session);
  }

  getLocationPath(session: SessionItemModel) {
    const url = session.locations[session.locations.length - 1];
    if (url.includes('/')) return "/" + url.split("/").pop();
    return url;
  }

  onLanguageChange(lan: string): void {
    this.lan = lan;
  }

}
