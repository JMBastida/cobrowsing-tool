import {
  Component,
  OnDestroy,
  OnInit,
  inject,
  signal,
  viewChild,
  ElementRef,
  HostListener,
  computed, ViewChild,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Socket } from 'ngx-socket-io';
import { MessageService } from 'primeng/api';
import {Select, SelectModule} from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';

import { UsersService } from '../../shared/services/user.service';
import { FontsService } from '../../shared/services/fonts.service';
import { EntitiesService } from '../../shared/services/entities.service';
import { LanguageService } from '../../shared/services/language.service';

import { PUBLIC_FONTS } from '../../shared/enums/api.enums';
import { STATE_KEY } from '../../shared/enums/cookies.enums';
import { BASIC_PROPERTIES } from '../../shared/enums/session.enums';

import { LiteralPipe } from '../../shared/pipes/literal.pipe';
import { numberToString } from '../../shared/helpers/literals.helper';

import { SessionItemModel } from '../../shared/interfaces/sessions.interfaces';

import { ROUTES } from '../../shared/enums/views.enums';
import { USER_ROLES } from '../../shared/enums/user.enums';

// declare var LZString: any;

@Component({
  selector: 'app-sessions',
  standalone: true,
  imports: [CommonModule, SelectModule, LiteralPipe, FormsModule, InputTextModule],
  templateUrl: './sessions.component.html',
  styleUrls: ['./sessions.component.scss'],
  providers: [MessageService]
})
export class SessionsComponent implements OnInit, OnDestroy {
  @ViewChild('screen') iframe!: ElementRef;
  @ViewChild('clientCursor') clientCursor!: ElementRef;
  @ViewChild('agentCursor') agentCursor!: ElementRef;
  @ViewChild('box') box!: ElementRef;
  @ViewChild('sessions_select') sessionsDropdown!: Select;

  private router = inject(Router);
  private socket = inject(Socket);
  private literalPipe = inject(LiteralPipe);
  private usersService = inject(UsersService);
  private fontsService = inject(FontsService);
  private messageService = inject(MessageService);
  private activatedRouter = inject(ActivatedRoute);
  private entitiesService = inject(EntitiesService);
  private languageService = inject(LanguageService);

  user = this.usersService.user;
  entity = this.entitiesService.entity;
  lan = this.languageService.lan;
  isAdmin = computed(() => this.user()?.role === USER_ROLES.ADMIN);

  clientsData = signal<any[]>([]);
  currentClientDataSessions = signal<SessionItemModel[] | undefined>(undefined);
  selectedSession = signal<SessionItemModel | undefined>(undefined);
  watchers = signal<any[]>([]);
  session = signal<any>(undefined);
  sessionId = signal('');
  clientName = signal('');
  isCobrowsing = signal(false);
  isCobrowsingRequest = signal(false);
  isSomeoneRequesting = signal(false);
  isSomeoneCoBrowsing = signal(false);
  scale = signal(1);
  coBrowsingAgent = signal<any>(undefined);
  scrollOrder = signal(0);
  scrollValue = signal({ x: 0, y: 0 });
  searchString = signal('');
  avoidAgentEvents = signal(true);
  shadowDomElements = signal<any[]>([]);
  sessionInfo = signal<any>(undefined);
  displaySessionInfo = signal(false);
  customDataItems = signal<any[]>([]);
  tempDomData = signal<any[]>([]);
  SEARCH_DELAY = 3000;
  searchMoment = signal(0);
  MAX_SESSIONS = 10;
  totalSessions = signal(0);
  totalSessionsString = computed(() => numberToString(this.totalSessions(), this.lan()));
  isOnCall = signal(false);
  isClientOnCall = signal(false);
  hasCalls = signal(false);
  page = signal(0);
  first = signal(0);
  rows = signal(10);
  pageCount = signal(0);
  timerInterval: any;
  coBrowsingTimer = signal(0);
  fontsBaseUrl = signal('');
  selectedLocation = signal<string | undefined>(undefined);
  isSelectExpanded = signal(true);

  private queryParamsSubscription: any;

  @HostListener('window:resize') handleResize() {
     if (!this.sessionId()) return;
    const parentWidth = this.iframe.nativeElement.parentElement.clientWidth;
    const parentHeight = window.innerHeight * 0.7;
    const innerWidth = this.iframe.nativeElement.clientWidth;
    const scaleWidth = parentWidth / innerWidth;
    const scaleHeight = parentHeight / innerHeight;
    this.scale.set(Math.min(scaleWidth, scaleHeight));
    this.iframe.nativeElement.style.transform = `scale(${this.scale()})`;
  }

  @HostListener('window:message', ['$event']) async handleMessage(event: any) {
    if (!event || !event.data || !event.data.type) return;
    if (event.data.type === 'FONTS_REQUEST') {
      const response = await this.fontsService.handleFonts(event.data.data);
      this.handleNewFontUrls(response.fileNames);
      return;
    } else if (event.data.type === 'OPEN_DOCS' && event.data.data && event.data.data.url) {
      window.open(event.data.data.url, "_blank");
      return;
    }

    if (this.avoidAgentEvents() || !this.isCobrowsing()) return;
    this.socket.emit('new-agent-event', event.data);
  }

  ngOnInit(): void {
    this.initializeSocket();
    this.initializeState();
    this.queryParamsSubscription = this.activatedRouter.queryParams.subscribe((params) => {
      const { sessionId } = params;
      if (!sessionId || this.sessionId() === sessionId || this.isCobrowsing() || this.isCobrowsingRequest()) return;
      this.socket.emit('get-smart-link-session', { sessionId });
    });
  }

  ngOnDestroy(): void {
    this.stopWatching();
    this.socket.removeAllListeners();
    this.queryParamsSubscription.unsubscribe();
  }

  onSearchChange(event: any) {
    // Implementation for search change
    this.searchString.set(event.target.value);
  }

  onNameChange() {
    // Implementation for name change
  }

  showSessionInfo(event: MouseEvent, selectedSession: any) {
    event.stopPropagation();
    this.sessionInfo.set(selectedSession);
    this.displaySessionInfo.set(true);
    this.setCustomDataItems();
  }

  tabSessionSelected(sessionId: string) {
    this.sessionId.set(sessionId);
  }

  setCustomDataItems() {
    this.customDataItems.set([]);
    const sessionInfo = this.sessionInfo();
    if (!sessionInfo || !sessionInfo.metadata) return;
    const metadata = sessionInfo.metadata;
    const properties = Object.getOwnPropertyNames(metadata);
    // const customProperties = properties.filter(p => !BASIC_PROPERTIES.includes(p));
    // const totalCustomProperties = customProperties.length;
    // for (let i = 0; i < totalCustomProperties; i += 1) {
    //   const prop = customProperties[i];
    //   this.customDataItems().push({ label: prop, value: metadata[prop] });
    // }
  }

  initializeSocket() {
    // ... all socket.on listeners will be here
  }

  stopWatching() {
    if (!this.sessionId()) return;
    this.socket.emit('stop-watching', { sessionId: this.sessionId() });
    this.sessionId.set('');
    this.session.set(null);
    this.isClientOnCall.set(false);
    // this.agentCursor.nativeElement.style.display = 'none';
    // if (this.iframe) {
    //   this.iframe.nativeElement.srcdoc = "";
    //   this.iframe.nativeElement.style.display = 'none';
    //   this.iframe.nativeElement.style.pointerEvents = 'none';
    // }

    this.isCobrowsing.set(false);
    this.isCobrowsingRequest.set(false);
    this.watchers.set([]);
    this.setState();
  }

  initializeState() {
    const state = this.recoverState();
    this.socket.emit('agent-reconnection', state);
  }

  recoverState() {
    const stateString = sessionStorage.getItem('STATE_KEY'); // Using string literal for now
    if (!stateString) return {};
    const state = JSON.parse(stateString);
    this.isOnCall.set(state.isOnCall);
    this.sessionId.set(state.sessionId);
    this.isCobrowsing.set(state.isCobrowsing);
    this.isCobrowsingRequest.set(state.isCobrowsingRequest);
    // this.handlePointerEvents(this.isCobrowsing());
    // if (this.sessionId() && this.iframe) this.iframe.nativeElement.style.display = 'block';
    // if (this.isCobrowsing() && this.iframe) this.iframe.nativeElement.style.pointerEvents = 'unset';
    return state;
  }

  handleNewFontUrls(fileNames: string[]) {
    if (!this.iframe || !fileNames || !fileNames.length) return;
    const fontEvent = { type: "NEW_FONTS", data: { fileNames } };
    this.iframe.nativeElement.contentWindow.postMessage(fontEvent, '*');
  }

  setState() {
    const state = {
      isOnCall: this.isOnCall(),
      sessionId: this.sessionId(),
      isCobrowsing: this.isCobrowsing(),
      isCobrowsingRequest: this.isCobrowsingRequest(),
    };
    const stateString = JSON.stringify(state);
    sessionStorage.setItem('STATE_KEY', stateString); // Using string literal for now
  }
}
