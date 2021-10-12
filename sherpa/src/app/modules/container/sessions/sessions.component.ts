import {
  OnInit,
  Component,
  OnDestroy,
  ViewChild,
  ElementRef,
  ViewEncapsulation,
  HostListener,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { Subscription } from 'rxjs';
import { Socket } from 'ngx-socket-io';
import { MessageService } from 'primeng/api';

import { UsersService } from '../../shared/services/user.service';
import { FontsService } from '../../shared/services/fonts.service';
import { EntitiesService } from '../../shared/services/entities.service';
import { LanguageService } from '../../shared/services/language.service';

import { PUBLIC_FONTS } from '../../shared/enums/api.enums';
import { STATE_KEY } from '../../shared/enums/cookies.enums';
import { BASIC_PROPERTIES } from '../../shared/enums/session.enums';

import { LiteralPipe } from '../../shared/pipes/literal.pipe';
import { numberToString } from '../../shared/helpers/literals.helper';

import { environment } from '../../../../environments/environment';
import { SessionItemModel } from '../../shared/interfaces/sessions.interfaces';

import { ROUTES } from '../../shared/enums/views.enums';
import { USER_ROLES } from '../../shared/enums/user.enums';
import { Dropdown } from 'primeng/dropdown';

declare var LZString: any;

@Component({
  selector: 'shr-sessions',
  templateUrl: './sessions.component.html',
  styleUrls: ['./sessions.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class SessionsComponent implements OnInit, OnDestroy {
  @ViewChild('screen') iframe!: ElementRef;
  @ViewChild('clientCursor') clientCursor!: ElementRef;
  @ViewChild('agentCursor') agentCursor!: ElementRef;
  @ViewChild('box') box!: ElementRef;
  @ViewChild('sessions_select') sessionsDropdown!: Dropdown;

  user: any;
  entity: any;
  lan: string = '';
  isAdmin: boolean = false;
  clientsData: any[] = [];
  currentClientDataSessions?: SessionItemModel[];
  selectedSession?: SessionItemModel;
  watchers: any[] = [];
  session: any;
  sessionId: string = '';
  clientName: string = '';
  isCobrowsing: boolean = false;
  isCobrowsingRequest: boolean = false;
  isSomeoneRequesting: boolean = false;
  isSomeoneCoBrowsing: boolean = false;
  scale: number = 1;
  coBrowsingAgent: any;
  scrollOrder: number = 0;
  scrollValue = { x: 0, y: 0 };
  searchString: string = '';
  avoidAgentEvents: boolean = true;
  shadowDomElements: any[] = [];
  sessionInfo: any;
  displaySessionInfo: boolean = false;
  customDataItems: any[] = [];
  queryParamsSubscription: any;
  tempDomData: any[] = [];
  SEARCH_DELAY: number = 3000;
  searchMoment: number = 0;
  MAX_SESSIONS: number = 10;
  totalSessions: number = 0;
  totalSessionsString: string = '0';
  isOnCall: boolean = false;
  isClientOnCall: boolean = false;
  hasCalls: boolean = false;
  userSubscription: Subscription = new Subscription;
  entitySubscription: Subscription = new Subscription;
  languageSubscription: Subscription = new Subscription;
  page: number = 0;
  first: number = 0;
  rows: number = 10;
  pageCount: number = 0;
  timerInterval: any;
  coBrowsingTimer: number = 0;
  fontsBaseUrl: string = '';
  selectedLocation?: string;
  isSelectExpanded: boolean = true;

  constructor(
    private router: Router,
    private socket: Socket,
    private literalPipe: LiteralPipe,
    private usersService: UsersService,
    private fontsService: FontsService,
    private messageService: MessageService,
    private activatedRouter: ActivatedRoute,
    private entitiesService: EntitiesService,
    private languageService: LanguageService,
  ) {
    this.onLanguageChange(this.languageService.lan);
    this.languageSubscription = this.languageService.language.subscribe(lan => this.onLanguageChange(lan));
    this.user = this.usersService.user;
    this.handleEntity(this.entitiesService.entity);
    this.userSubscription = this.usersService.userSubject.subscribe(user => this.handleUser(user));
    this.entitySubscription = this.entitiesService.entitySubject.subscribe(entity => this.handleEntity(entity));
  }

  @HostListener('window:resize') handleResize() {
    if (!this.sessionId) return;
    const parentWidth = this.iframe.nativeElement.parentElement.clientWidth;
    const parentHeight = window.innerHeight * 0.7;
    const innerWidth = this.iframe.nativeElement.clientWidth;
    const scaleWidth = parentWidth / innerWidth;
    const scaleHeight = parentHeight / innerHeight;
    this.scale = Math.min(scaleWidth, scaleHeight);
    this.iframe.nativeElement.style.transform = `scale(${this.scale})`;
    this.iframe.nativeElement.style.oTransform = `scale(${this.scale})`;
    this.iframe.nativeElement.style.msTransform = `scale(${this.scale})`;
    this.iframe.nativeElement.style.mozTransform = `scale(${this.scale})`;
    this.iframe.nativeElement.style.webkitTransform = `scale(${this.scale})`;
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

    if (this.avoidAgentEvents || !this.isCobrowsing) return;
    this.socket.emit('new-agent-event', event.data);
  }

  ngOnInit(): void {
    this.initializeSocket();
    this.initializeState();
    this.queryParamsSubscription = this.activatedRouter.queryParams.subscribe((params) => {
      const { sessionId } = params;
      if (!sessionId || this.sessionId === sessionId || this.isCobrowsing || this.isCobrowsingRequest) return;
      this.socket.emit('get-smart-link-session', { sessionId });
    });
  }

  ngOnDestroy(): void {
    this.stopWatching();
    this.socket.removeListener('resize');
    this.socket.removeListener('connect');
    this.socket.removeListener('call-ended');
    this.socket.removeListener('update-dom');
    this.socket.removeListener('new-session');
    this.socket.removeListener('agent-event');
    this.socket.removeListener('mouse-event');
    this.socket.removeListener('new-watcher');
    this.socket.removeListener('call-started');
    this.socket.removeListener('client-event');
    this.socket.removeListener('set-watchers');
    this.socket.removeListener('dom-mutations');
    this.socket.removeListener('remove-watcher');
    this.socket.removeListener('update-watcher');
    this.socket.removeListener('update-session');
    this.socket.removeListener('remove-session');
    this.socket.removeListener('client-join-call');
    this.socket.removeListener('client-left-call');
    this.socket.removeListener('smart-link-session');
    this.socket.removeListener('session-not-found');
    this.socket.removeListener('session-connected');
    this.socket.removeListener('sessions-recovered');
    this.socket.removeListener('co-browsing-stopped');
    this.socket.removeListener('co-browsing-response');
    this.socket.removeListener('on-going-co-browsing');
    this.socket.removeListener('co-browsing-request-stopped');
    this.socket.removeListener('on-going-co-browsing-request');
    this.userSubscription.unsubscribe();
    this.entitySubscription.unsubscribe();
    this.languageSubscription.unsubscribe();
    this.queryParamsSubscription.unsubscribe();
  }

  onLanguageChange(lan: string) {
    this.lan = lan;
    this.setTotalSessions(this.totalSessions);
  }

  handleUser(user: any) {
    this.user = user;
    if (user) this.isAdmin = user.role === USER_ROLES.ADMIN;
  }

  handleEntity(entity: any) {
    this.entity = entity;
    if (this.entity && this.entity.modules && this.entity.modules.hasCalls) this.hasCalls = true;
    if (this.entity) this.fontsBaseUrl = `${PUBLIC_FONTS}/${this.entity.code}/`;
  }

  showSessionInfo(event: MouseEvent, selectedSession: any) {
    event.stopPropagation();
    this.sessionInfo = selectedSession;
    this.displaySessionInfo = true;
    this.setCustomDataItems();
  }

  tabSessionSelected(sessionId: string) {
    this.sessionId = sessionId;
  }

  setCustomDataItems() {
    this.customDataItems = [];
    if (!this.sessionInfo || !this.sessionInfo.metadata) return;
    const metadata = this.sessionInfo.metadata;
    const properties = Object.getOwnPropertyNames(metadata);
    const customProperties = properties.filter(p => !BASIC_PROPERTIES.includes(p));
    const totalCustomProperties = customProperties.length;
    for (let i = 0; i < totalCustomProperties; i += 1) {
      const prop = customProperties[i];
      this.customDataItems.push({ label: prop, value: metadata[prop] });
    }
  }

  initializeSocket() {
    this.socket.on('smart-link-session', (data: any) => {
      if (!data || !data.session) return;
      this.watchSession(data.session);
    });
    this.socket.on('sessions-recovered', (data: any) => {
      if (data && data.result) this.clientsData = data.result;
      this.setTotalSessions(data.total);
      if (this.sessionId) {
        const clientDataIndex = this.clientsData.findIndex(d => d.sessions.some((s: any) => s._id === this.sessionId));
        if (clientDataIndex === -1) return;
        this.session = this.clientsData[clientDataIndex].sessions.find((s: any) => s._id === this.sessionId);
        if (this.session) {
          this.clientName = this.session.clientName;
          const isPointEventsAllowed = this.isCobrowsing && this.session.isInTab;
          this.handlePointerEvents(isPointEventsAllowed);
          this.isClientOnCall = !!this.session.callUrl;
        }
      }
    });
    this.socket.on('new-session', (data: any) => {
      if (!data || !data.session || this.searchString) return;
      const { session, total, uid } = data;
      this.setTotalSessions(total);
      if (session && session._id) {
        const clientDataIndex = this.clientsData.findIndex(d => d.customer.uid === uid);
        if (clientDataIndex === -1) {
          const {
            userCode,
            clientName,
            geolocation,
            isHelpRequest,
            isCustomFlowTriggered,
          } = session;
          if (
            isHelpRequest ||
            isCustomFlowTriggered ||
            userCode === this.user.code ||
            this.clientsData.length < this.MAX_SESSIONS
          ) {
            const firstConnectionDate = new Date();
            const newClientData = {
              customer: {
                uid,
                firstConnectionDate,
                name: clientName,
                city: geolocation ? geolocation.city : '',
              },
              sessions: [session],
            };
            this.clientsData.unshift(newClientData);
          }

          return;
        }

        const sessionIndex = this.clientsData[clientDataIndex].sessions.findIndex((s: any) => s._id && s._id === session._id);
        if (sessionIndex !== -1) this.clientsData[clientDataIndex].sessions[sessionIndex] = session;
        else this.clientsData[clientDataIndex].sessions.push(session);
        this.sortSessions(clientDataIndex);
      }

      if (this.session && session._id === this.session._id) {
        this.session.isTabClosed = false;
        const isPointEventsAllowed = this.isCobrowsing && this.session.isInTab;
        this.handlePointerEvents(isPointEventsAllowed);
      }
    });
    this.socket.on('update-session', (data: any) => {
      if (!data || !data._id) return;
      const {
        _id,
        userCode,
        clientName,
        geolocation,
        isHelpRequest,
        isCustomFlowTriggered,
      } = data;
      const clientDataIndex = this.clientsData.findIndex(d => d.sessions.some((s: any) => s._id === _id));
      if (clientDataIndex !== -1) {
        const sessionIndex = this.clientsData[clientDataIndex].sessions.findIndex((s: any) => s._id === _id);
        this.clientsData[clientDataIndex].sessions[sessionIndex] = data;
        this.sortSessions(clientDataIndex);
      } else if (
        isHelpRequest ||
        isCustomFlowTriggered ||
        userCode === this.user.code ||
        this.clientsData.length < this.MAX_SESSIONS
      ) {
        const firstConnectionDate = new Date();
        const newClientData = {
          customer: {
            firstConnectionDate,
            name: clientName,
            city: geolocation ? geolocation.city : '',
          },
          sessions: [data],
        };
        this.clientsData.unshift(newClientData);
      }

      if (_id === this.sessionId) {
        this.clientName = clientName;
        this.session = data;
        this.isClientOnCall = !!this.session.callUrl;
        const isPointEventsAllowed = this.isCobrowsing && this.session.isInTab;
        this.handlePointerEvents(isPointEventsAllowed);
      }

      if (this.sessionInfo && _id === this.sessionInfo._id) {
        this.sessionInfo = data;
        this.setCustomDataItems();
      }
    });
    this.socket.on('remove-session', (data: any) => {
      if (!data) return;
      const { sessionId, total } = data;
      this.setTotalSessions(total);
      if (!sessionId) return;
      const clientDataIndex = this.clientsData.findIndex(d => d.sessions.some((s: any) => s._id === sessionId));
      if (clientDataIndex === -1) return;
      const sessionIndex = this.clientsData[clientDataIndex].sessions.findIndex((s: any) => s._id === sessionId);
      this.clientsData[clientDataIndex].sessions.splice(sessionIndex, 1);
      if (!this.clientsData[clientDataIndex].sessions.length) this.clientsData.splice(clientDataIndex, 1);
      if (this.session && sessionId === this.session._id) {
        this.handlePointerEvents(false);
        setTimeout(() => {
          if (!this.session || this.session._id !== sessionId) return;
          const isReconnected = this.clientsData.some(d => d.sessions.some((s: any) => s._id === this.session._id));
          if (isReconnected) return;
          this.session.isTabClosed = true;
          if (this.isCobrowsingRequest) this.stopCoBrowsingRequest();
          else if (this.isCobrowsing) this.stopCoBrowsing();
          this.requestMoreSessions();
        }, 8000);
        return;
      }

      this.requestMoreSessions();
    });
    this.socket.on('session-not-found', (data: any) => {
      this.messageService.add({ severity: 'error', summary: this.literalPipe.transform('SESSIONS.NOT_FOUND', this.lan) });
    });
    this.socket.on('session-connected', (data: any) => {
      if (!data || !data.sessionId) return;
      this.sessionId = data.sessionId;
      if (this.iframe) this.iframe.nativeElement.style.display = 'block';
      this.setState();
      this.handlePointerEvents(false);
      setTimeout(() => {
        if (!this.session || this.session._id !== data.sessionId) return;
        const isReconnected = this.clientsData.some(d => d.sessions.some((s: any) => s._id === this.session._id));
        if (isReconnected) return;
        this.session.isTabClosed = true;
        if (this.isCobrowsingRequest) this.stopCoBrowsingRequest();
        else if (this.isCobrowsing) this.stopCoBrowsing();
      }, 5000);
    });
    this.socket.on('session-not-found', (data: any) => {
      this.messageService.add({ severity: 'error', summary: this.literalPipe.transform('SESSIONS.NOT_FOUND', this.lan) });
    });
    this.socket.on('on-going-co-browsing-request', (data: any) => {
      this.isCobrowsingRequest = false;
      this.messageService.add({ severity: 'error', summary: this.literalPipe.transform('SESSIONS.EXISTING_REQUEST', this.lan) });
      this.setState();
    });
    this.socket.on('on-going-co-browsing', (data: any) => {
      this.isCobrowsingRequest = false;
      this.messageService.add({ severity: 'error', summary: this.literalPipe.transform('SESSIONS.EXISTING_CO_BROWSING', this.lan) });
      this.setState();
    });
    this.socket.on('co-browsing-response', (data: any) => {
      const { isAccepted } = data;
      this.isCobrowsingRequest = false;
      if (isAccepted) {
        this.messageService.add({ severity: 'success', summary: this.literalPipe.transform('SESSIONS.CO_BROWSING_ACCEPTED', this.lan) });
        this.isCobrowsing = true;
        this.handlePointerEvents(true);
      } else {
        this.messageService.add({ severity: 'error', summary: this.literalPipe.transform('SESSIONS.CO_BROWSING_REJECTED', this.lan) });
      }

      this.setState();
    });
    this.socket.on('co-browsing-request-stopped', (data: any) => {
      this.isCobrowsing = false;
      this.isCobrowsingRequest = false;
      this.handlePointerEvents(false);
      this.setState();
      this.watchers = this.watchers.map(w => ({ ...w, isCobrowsing: false, isCobrowsingRequest: false }));
      this.handleWatchersStatus();
    });
    this.socket.on('co-browsing-stopped', (data: any) => {
      this.isCobrowsing = false;
      this.isCobrowsingRequest = false;
      this.handlePointerEvents(false);
      this.setState();
      this.watchers = this.watchers.map(w => ({ ...w, isCobrowsing: false, isCobrowsingRequest: false }));
      this.handleWatchersStatus();
    });
    this.socket.on('set-watchers', (data: any) => {
      if (!data || !data.watchers) return;
      this.watchers = data.watchers;
      this.handleWatchersStatus();
    });
    this.socket.on('new-watcher', (data: any) => {
      if (data && !this.watchers.some(w => w._id === data._id)) this.watchers.push(data);
      this.handleWatchersStatus();
    });
    this.socket.on('update-watcher', (data: any) => {
      if (!data || !data._id) return;
      const watcher = this.watchers.find(w => w._id === data._id);
      if (!watcher) return;
      watcher.isCobrowsing = data.isCobrowsing;
      watcher.isCobrowsingRequest = data.isCobrowsingRequest;
      this.handleWatchersStatus();
    });
    this.socket.on('remove-watcher', (data: any) => {
      if (!data || !data.userId) return;
      const index = this.watchers.findIndex(w => w._id === data.userId);
      if (index !== -1) this.watchers.splice(index, 1);
      this.handleWatchersStatus();
    });
    this.socket.on('update-dom', (data: any) => {
      if (!data) return;
      this.tempDomData.push(data);
      const last = this.tempDomData.find(d => d.isLast);
      if (!last) return;
      const { timeStamp } = last;
      const validData = this.tempDomData.filter(d => d.timeStamp === timeStamp);
      if (last.order >= validData.length) return;
      validData.sort((a, b) => a.order - b.order);
      const tempData = validData.reduce((prev, curr) => {
        if (curr.html) prev.html += curr.html;
        if (curr.shadowString) prev.shadowString += curr.shadowString;
        return prev;
      }, { html: '', shadowString: '' });
      const { html, shadowString } = tempData;
      const htmlParsed = this.parseHtml(html);
      if (shadowString) {
        const shadow = JSON.parse(shadowString);
        if (shadow && shadow.length) this.shadowDomElements = shadow;
      }

      this.iframe.nativeElement.srcdoc = htmlParsed;
      this.tempDomData = this.tempDomData.filter(d => d.timeStamp !== timeStamp);
      this.requestFonts();
    });
    this.socket.on('dom-mutations', (data: any) => {
      if (!data || !data.selector) return;
      const { selector, addedElements, newInnerHtml, newOuterHtml, elementAttributes, previousElementSiblings, textContent, embeddedSelector, shadowData } = data;
      const parentNode = this.getElementFromSelector(selector, embeddedSelector);
      if (!parentNode) return;
      if (addedElements) {
        let referenceNode;
        const totalAddedElement = addedElements.length;
        for (let i = 0; i < totalAddedElement; i += 1) {
          const element = addedElements[i];
          if (element.selector) {
            referenceNode = this.getElementFromSelector(element.selector, embeddedSelector);
            if (referenceNode) {
              let newOuterHtml = element.html;
              let outerHtml = referenceNode.outerHTML;
              const hasInputs = outerHtml.includes('<input');
              if (hasInputs) {
                outerHtml = this.removeInputsValues(outerHtml);
                newOuterHtml = this.removeInputsValues(newOuterHtml);
              }

              if (outerHtml === newOuterHtml) continue;
            }
          }

          const placeholder = this.iframe.nativeElement.contentWindow.document.createElement('div');
          placeholder.innerHTML = element.html;
          const node = placeholder.firstElementChild;
          let isNextElementSibling = true;
          if (!referenceNode && previousElementSiblings && previousElementSiblings[i]) {
            referenceNode = this.getElementFromSelector(previousElementSiblings[i], embeddedSelector);
            isNextElementSibling = false;
          }

          try {
            if (node) {
              if (referenceNode) {
                isNextElementSibling ? parentNode.insertBefore(node, referenceNode) : parentNode.appendChild(node);
              } else if (parentNode.children && !parentNode.children.length) {
                parentNode.appendChild(node);
              }
            }
          } catch (err) {
            console.log(err)
          }

          if (shadowData && shadowData.length) {
            this.shadowDomElements = shadowData;
            this.onLoadIframe();
          }
        }
      }

      if (newInnerHtml) {
        if (parentNode.localName === 'iframe') {
          const doc = parentNode.contentWindow.document;
          doc.open();
          doc.write(newInnerHtml);
          doc.close();
        } else if (parentNode.localName === 'head') {
          const extraStyles = this.getExtraStyles();
          const decodedInnerHtml = LZString.decompress(newInnerHtml);
          parentNode.innerHTML = extraStyles + decodedInnerHtml;
          this.requestFonts();
        } else {
          parentNode.innerHTML = newInnerHtml;
        }

        this.onLoadIframe();
      }

      if (newOuterHtml) {
        const placeholder = this.iframe.nativeElement.contentWindow.document.createElement('div');
        placeholder.innerHTML = newOuterHtml;
        const node = placeholder.firstElementChild;
        node.removeAttribute('src');
        node.setAttribute('sandbox', 'allow-same-origin allow-scripts allow-forms allow-presentation');
        if (node.localName === 'iframe' && parentNode.localName === 'iframe') {
          parentNode.replaceWith(node);
          setTimeout(() => {
            const scriptNode = node.contentWindow.document.getElementById('shr-cobrowsing-script');
            if (scriptNode) {
              const script = node.contentWindow.document.createElement('script');
              script.innerHTML = scriptNode.innerHTML;
              node.contentWindow.document.head.appendChild(script);
              scriptNode.remove();
            }
          }, 2000);
        } else parentNode.outerHtml = newOuterHtml;
        this.onLoadIframe();
      }

      if (textContent) {
        const nodes: HTMLElement[] = [...parentNode.childNodes];
        if (nodes && nodes.length) {
          const node = nodes.find((child) => child.nodeName === '#text');
          if (node) node.textContent = textContent;
        } else {
          parentNode.textContent = textContent;
        }
      }

      if (elementAttributes) {
        if (elementAttributes.type === 'src') (parentNode as HTMLImageElement).src = elementAttributes.value;
        else if (elementAttributes.type === 'class') {
          if (parentNode.className.baseVal || parentNode.className.baseVal === '') parentNode.className.baseVal = elementAttributes.value;
          else parentNode.className = elementAttributes.value;
        } else if (elementAttributes.type === 'style') {
          if (parentNode.style) parentNode.style.cssText = elementAttributes.value;
          else parentNode.setAttribute('style', elementAttributes.value);
        }
      }
    });
    this.socket.on('resize', (data: any) => {
      if (!data || !data.innerWidth || !data.innerHeight) return;
      const { innerWidth, innerHeight } = data;
      const parentWidth = this.iframe.nativeElement.parentElement.clientWidth * 0.8;
      const parentHeight = window.innerHeight * 0.7;
      const scaleWidth = parentWidth / innerWidth;
      const scaleHeight = parentHeight / innerHeight;
      this.scale = Math.min(scaleWidth, scaleHeight);
      let borderRadius = '30px';
      if (
        !this.session ||
        !this.session.deviceInfo ||
        !this.session.deviceInfo.device ||
        this.session.deviceInfo.device === 'DESKTOP'
      ) borderRadius = '6px';
      this.iframe.nativeElement.style.width = `${innerWidth}px`;
      this.iframe.nativeElement.style.border = '3px solid black';
      this.iframe.nativeElement.style.height = `${innerHeight}px`;
      this.iframe.nativeElement.style.borderRadius = borderRadius;
      this.iframe.nativeElement.style.transform = `scale(${this.scale})`;
      this.iframe.nativeElement.style.oTransform = `scale(${this.scale})`;
      this.iframe.nativeElement.style.msTransform = `scale(${this.scale})`;
      this.iframe.nativeElement.style.mozTransform = `scale(${this.scale})`;
      this.iframe.nativeElement.style.webkitTransform = `scale(${this.scale})`;
    });
    this.socket.on('client-event', (data: any) => {
      if (!data || !data.type || !data.data) return;
      if (data.type === 'SCROLL') {
        this.scrollOrder = Date.now();
        this.handlePointerEvents(false);
        this.scrollValue = data.data.value;
        this.iframe.nativeElement.contentWindow.postMessage(data, '*');
        setTimeout(() => {
          const now = Date.now();
          if (this.isCobrowsing && now >= this.scrollOrder + 1500) this.handlePointerEvents(true);
        }, 1500);
      } else if (data.type === 'MOUSE_MOVE') {
        let left = data.data.left;
        let top = data.data.top;
        if (data.data.iframeSelector) {
          const iframe = this.getElementFromSelector(data.data.iframeSelector);
          const position = iframe.getBoundingClientRect();
          left += position.left;
          top += position.top;
        }

        this.clientCursor.nativeElement.style.left = `${this.scale * left}px`;
        this.clientCursor.nativeElement.style.top = `${this.scale * top}px`;
      } else if (data.type === 'CLICK') {
        const element = document.getElementById('client-cursor-svg');
        if (data.data.selector) {
          const element = this.getElementFromSelector(data.data.selector);
          if (!element) return;
          element.checked = data.data.value;
        }

        if (!element) return;
        element.style.animation = 'blink-2 0.9s both';
        setTimeout(() => element.style.animation = '', 1000);
      } else if (data.type === 'VALUE_CHANGE') {
        const element = this.getElementFromSelector(data.data.selector, data.data.iframeSelector);
        if (!element) return;
        const elementType = element.getAttribute('type');
        if (['checkbox', 'radio'].includes(elementType)) {
          element.checked = data.data.checked;
          element.removeAttribute('checked');
        } else {
          element.value = data.data.value;
          element.removeAttribute('value');
        }
      }
    });
    this.socket.on('agent-event', (data: any) => {
      if (this.avoidAgentEvents) return;
      if (!data || !data.type || !data.data || !data.user) return;
      if (data.type === 'MOUSE_MOVE') {
        this.agentCursor.nativeElement.style.left = `${this.scale * data.data.left}px`;
        this.agentCursor.nativeElement.style.top = `${this.scale * data.data.top}px`;
      } else if (data.type === 'CLICK') {
        const element = document.getElementById('agent-cursor-svg');
        if (!element) return;
        element.style.animation = 'blink-2 0.9s both';
        setTimeout(() => element.style.animation = '', 1000);
      }
    });
    this.socket.on('call-started', () => {
      this.isOnCall = true;
      this.setState();
    });
    this.socket.on('call-ended', () => {
      this.isOnCall = false;
      this.setState();
    });
    this.socket.on('client-join-call', (data: any) => {
      if (!data || !data.sessionId) return;
      const { sessionId, callUrl } = data;
      const clientDataIndex = this.clientsData.findIndex(d => d.sessions.some((s: any) => s._id === this.sessionId));
      if (clientDataIndex === -1) return;
      const session = this.clientsData[clientDataIndex].sessions.find((s: any) => s._id === sessionId);
      if (!session) return;
      session.callUrl = callUrl;
      this.isClientOnCall = callUrl && callUrl.includes(this.user.code);
    });
    this.socket.on('client-left-call', (data: any) => {
      if (!data || !data.sessionId) return;
      const { sessionId } = data;
      const index = this.clientsData.findIndex(d => d.sessions.some((s: any) => s._id === this.session._id));
      if (index === -1) return;
      const session = this.clientsData[index].sessions.find((s: any) => s._id === sessionId);
      if (!session) return;
      session.callUrl = '';
      if (this.sessionId && this.sessionId === sessionId) {
        this.isClientOnCall = false;
      }
    });
    this.socket.on('connect', () => {
      this.initializeState();
    });
  }

  removeInputsValues(html: string) {
    if (!html) return html;
    let newHtml = html;
    let start = newHtml.indexOf('<input');
    let end;
    let length;
    while (start !== -1) {
      end = newHtml.indexOf('>', start);
      if (end === -1) break;
      length = end - start + 1;
      const string = newHtml.substr(start, length);
      if (string.includes('value')) {
        const startValue = newHtml.indexOf(' value', start);
        if (startValue !== -1) {
          let endValue = newHtml.indexOf('"', startValue + 8);
          if (endValue > end) endValue = end;
          if (endValue !== -1) newHtml = newHtml.substr(0, startValue) + newHtml.substr(endValue + 1);
        }
      }

      start = newHtml.indexOf('<input', end);
    }

    return newHtml;
  }

  requestMoreSessions() {
    const socketData = {
      skip: this.first,
      limit: this.rows,
      searchString: this.searchString,
    };
    this.socket.emit('search-sessions', socketData);
  }

  getElementFromSelector(selector: string, iframeSelector?: string) {
    let element;
    try {
      if (iframeSelector) {
        const iframe: HTMLIFrameElement = this.iframe.nativeElement.contentWindow.document.querySelector(iframeSelector);
        element = iframe.contentWindow?.document.querySelector(selector);
      } else element = this.iframe.nativeElement.contentWindow.document.querySelector(selector);
    } catch (error) {
      console.log('wrong selector:', selector);
      element = undefined;
    }

    return element;
  }

  handleWatchersStatus() {
    this.isSomeoneRequesting = this.watchers.some(w => w.isCobrowsingRequest);
    this.isSomeoneCoBrowsing = this.watchers.some(w => w.isCobrowsing);
    if (this.isSomeoneCoBrowsing && !this.isCobrowsing) {
      this.agentCursor.nativeElement.style.display = 'block';
      this.coBrowsingAgent = this.watchers.find(w => w.isCobrowsing);
    } else this.agentCursor.nativeElement.style.display = 'none';
    this.handleCoBrowsingTimer();
  }

  getIframeListeners() {
    return `
      <script>
        var html;
        var latestKnownScrollX = 0;
        var latestKnownScrollY = 0;
        var ticking = false;
        var avoidAgentEvents = ${this.avoidAgentEvents};
        setTimeout(function() {
          html = document.getElementsByTagName('html')[0];
          if (avoidAgentEvents) html.style.overflow = 'hidden';
          else html.style.overflow = 'unset';
        }, 100);

        function getSelector(node) {
          var id = node.getAttribute('id');
          if (id) return '#' + id;
          var path = '';
          while (node && node.localName && node.parentNode) {
            var name = node.localName;
            var parent = node.parentNode;
            var nodeId = node.getAttribute('id');
            if (nodeId) {
              path = '#' + nodeId + ' > ' + path;
              break;
            }

            if (name.includes('hx')) {
              var className = node.getAttribute('class');
              if (className) {
                path = '.' + className.replace(' ', '.') + ' > ' + path;
                node = parent;
                continue;
              }
            }

            var sameTagSiblings = [];
            var children = parent.childNodes;
            children = Array.prototype.slice.call(children);
            children.forEach(function(child) {
              if (child.localName === name) sameTagSiblings.push(child);
            });

            // if there are more than one children of that type use nth-of-type
            if (sameTagSiblings.length > 1) {
              var index = sameTagSiblings.indexOf(node);
              name += ':nth-of-type(' + (index + 1) + ')';
            }

            if (path) path = name + ' > ' + path;
            else path = name;
            node = parent;
          }

          return path;
        }

        function getElementFromSelector(selector, iframeSelector) {
          let element;
          try {
            if (iframeSelector) {
              const iframe = document.querySelector(iframeSelector);
              element = iframe.contentWindow.document.querySelector(selector);
            } else element = document.querySelector(selector);
          } catch (error) {
            console.log('wrong selector:', selector);
            element = undefined;
          }
      
          return element;
        }

        function notifyFontsToParent() {
          var validExtensions = [".woff"];
          var performance = window.performance || window.mozPerformance|| window.msPerformance || window.webkitPerformance || {};
          var entries = performance.getEntries();
          var element = document.getElementsByTagName('base')[0];
          var filter = entries.filter(function(e) {
            if (e.initiatorType !== 'css' || !e.name.includes(element.href)) return false;
            return validExtensions.some(function(ext) { return e.name.includes(ext); });
          });
          var fontEndpoints = filter.map(function(e) { return e.name });
          var fontEvent = { type: "FONTS_REQUEST", data: { fontEndpoints } };
          window.parent.postMessage(fontEvent, '*');
        }

        window.addEventListener('load', notifyFontsToParent);

        window.addEventListener("message", (event) => {
          if (!event || !event.data || !event.data.type) return;
          if (event.data.type === "AVOID_EVENTS") {
            avoidAgentEvents = event.data.data.value;
            if (avoidAgentEvents) {
              html.style.overflow = 'hidden';
              window.removeEventListener("scroll", scrollHandler, true);
            }
            else {
              html.style.overflow = 'unset';
              window.addEventListener("scroll", scrollHandler, true);
            } 
          } else if (event.data.type === "SCROLL") {
            var element = getElementFromSelector(event.data.data.selector, event.data.data.iframeSelector);
            if (element) {
               element.scrollTo({ top: event.data.data.value.y, left: event.data.data.value.x, behavior: 'smooth' });
               lastPositionX = event.data.data.value.x;
               lastPositionY = event.data.data.value.y;
            }
          } else if (event.data.type === "FONTS_REQUEST") {
            notifyFontsToParent();
          } else if (event.data.type === "NEW_FONTS") {
            var fontStyles = document.getElementsByClassName('shr-font-tag');
            var arrayFontStyles = Array.prototype.slice.call(fontStyles);
            if (!arrayFontStyles || !arrayFontStyles.length) return;
            var fileNames = event.data.data.fileNames;
            var totalFiles = fileNames.length;
            for (var i = 0; i < totalFiles; i += 1) {
              var fileName = fileNames[i];
              var styleTags = arrayFontStyles.filter(function (s) {return s.innerHTML.includes(fileName)});
              var totalStyleTags = styleTags.length;
              for (var j = 0; j < totalStyleTags; j += 1) {
                var styleTag = styleTags[j];
                var fileIndex = styleTag.innerHTML.indexOf(fileName);
                if (fileIndex === -1) continue;
                var newFilePath = '${this.fontsBaseUrl}';
                var isChanged = styleTag.innerHTML.includes(newFilePath + fileName);
                if (isChanged) continue;
                var totalLength = styleTag.innerHTML.length;
                var lastStringLength = totalLength - fileIndex;
                styleTag.innerHTML = styleTag.innerHTML.substr(0, fileIndex) + newFilePath + styleTag.innerHTML.substr(fileIndex, lastStringLength);
                if (styleTag.innerHTML.substr(0,2) === '/*') styleTag.innerHTML = styleTag.innerHTML.substr(2);
                if (styleTag.innerHTML.substr(-2) === '*/') styleTag.innerHTML = styleTag.innerHTML.substr(0, styleTag.innerHTML.length - 2);
              }
            }
          }
        });

        window.addEventListener("click", (event) => {
          if (avoidAgentEvents) return;
          var path = getSelector(event.composedPath()[0]);
          if (path && path.includes('shr-co-browsing-advise')) return;
          var clickEvent = {
            type: 'CLICK',
            data: {
              x: event.x,
              y: event.y,
              path: path,
              pageX: event.pageX,
              pageY: event.pageY,
              clientX: event.clientX,
              clientY: event.clientY,
              offsetX: event.offsetX,
              offsetY: event.offsetY,
            }
          };
          window.parent.postMessage(clickEvent, '*');
        });

        window.addEventListener("mousemove", (event) => {
          if (avoidAgentEvents) return;
          var moveEvent = {
            type: 'MOUSE_MOVE',
            data: { top: event.y, left: event.x },
          };
          window.parent.postMessage(moveEvent, '*');
        });
        
        const scrollHandler = function(event) {
          var scrollTop = event.target.scrollTop;
          var scrollLeft = event.target.scrollLeft;
          var scrollingElement = event.target;
          if (event.target === document) {
            scrollTop = event.target.scrollingElement.scrollTop;
            scrollLeft = event.target.scrollingElement.scrollLeft;
            scrollingElement = event.target.scrollingElement;
          }
        
          latestKnownScrollX = 0;
          latestKnownScrollY = 0;
          if (scrollTop) latestKnownScrollY = scrollTop;
          if (scrollLeft) latestKnownScrollX = scrollLeft;
          if (!ticking) {
            window.requestAnimationFrame(function () {
              ticking = false;
              var scrollEvent = {
                type: "SCROLL",
                data: {
                  path: getSelector(scrollingElement),
                  value: { x: latestKnownScrollX || 0, y: latestKnownScrollY || 0 }
                },
              };
              window.parent.postMessage(scrollEvent, '*');
            });
          }

          ticking = true;
        };

        window.addEventListener("scroll", scrollHandler, true);

        window.addEventListener("input", function(e) {
          var input = e.composedPath()[0];
          var selector = getSelector(input);
          let keyEvent = {
            type: "VALUE_CHANGE",
            data: {
              element: input.outerHTML,
              path: selector,
              value: input.value,
            },
          }
          window.parent.postMessage(keyEvent, '*');
        });

        setTimeout(function() {
          window.scrollTo({ left: ${this.scrollValue.x}, top: ${this.scrollValue.y} });
        }, 400);
      </script>
    `;
  }

  getExtraStyles() {
    if (
      !this.session ||
      !this.session.deviceInfo ||
      !this.session.deviceInfo.device ||
      this.session.deviceInfo.device === 'DESKTOP'
    ) return '';
    return `
      <style>
        html::-webkit-scrollbar {
          display: none;
        }

        html {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
      </style>
    `;
  }

  handlePointerEvents(isAllowed: boolean) {
    this.avoidAgentEvents = !isAllowed;
    const data = { type: 'AVOID_EVENTS', data: { value: this.avoidAgentEvents } };
    if (!this.iframe) return;
    this.iframe.nativeElement.contentWindow.postMessage(data, '*');
    if (isAllowed) this.iframe.nativeElement.style.pointerEvents = 'unset';
    else this.iframe.nativeElement.style.pointerEvents = 'none';
  }

  parseHtml(html: string) {
    const index = html.indexOf('<head>') + 6;
    let htmlParsed = html.substr(0, index);
    const script = this.getIframeListeners();
    const extraStyles = this.getExtraStyles();
    htmlParsed += script + extraStyles;
    htmlParsed += html.substr(index);
    return htmlParsed;
  }

  setTotalSessions(totalSessions: number) {
    this.totalSessions = totalSessions;
    this.totalSessionsString = numberToString(this.totalSessions, this.lan);
  }

  initializeState() {
    const state = this.recoverState();
    this.socket.emit('agent-reconnection', state);
  }

  findSessionInClientDataArray(sessionId: string): SessionItemModel[] | undefined {
    const currentClientData = this.clientsData.find((clientData) => {
      console.log(clientData);

      if (clientData.sessions) {
        console.log(clientData.sessions, this.sessionId);
        return clientData.sessions.some((session: SessionItemModel) => session._id === sessionId);
      }
    });

    return currentClientData.sessions;
  }

  watchSession(session: SessionItemModel) {
    if (!session || !session._id || session._id === this.sessionId) return;
    if (this.sessionId) {
      if (this.isCobrowsing || this.isCobrowsingRequest) {
        this.messageService.add({ severity: 'error', summary: this.literalPipe.transform('SESSIONS.ON_SESSION_ADVISE_TITLE', this.lan), detail: this.literalPipe.transform('SESSIONS.ON_SESSION_ADVISE_DESCRIPTION', this.lan) });
        return;
      }

      this.socket.emit('stop-watching', { sessionId: this.sessionId });
    }

    const sessionId = session._id;
    this.session = session;
    this.currentClientDataSessions = this.findSessionInClientDataArray(sessionId);
    this.isClientOnCall = !!this.session.callUrl;
    this.socket.emit('watch-session', { sessionId });
  }

  requestAccess() {
    this.socket.emit('request-co-browsing', {});
    this.isCobrowsingRequest = true;
    this.setState();
  }

  stopCoBrowsingRequest() {
    this.socket.emit('agent-stop-co-browsing-request', {});
  }

  stopCoBrowsing() {
    this.socket.emit('agent-stop-co-browsing', {});
  }

  stopWatching() {
    if (!this.sessionId) return;
    this.socket.emit('stop-watching', { sessionId: this.sessionId });
    this.sessionId = '';
    this.session = null;
    this.isClientOnCall = false;
    this.agentCursor.nativeElement.style.display = 'none';
    if (this.iframe) {
      this.iframe.nativeElement.srcdoc = "";
      this.iframe.nativeElement.style.display = 'none';
      this.iframe.nativeElement.style.pointerEvents = 'none';
    }

    this.isCobrowsing = false;
    this.isCobrowsingRequest = false;
    this.watchers = [];
    this.setState();
  }

  onNameChange() {
    if (!this.session) return;
    if (this.session.clientName !== this.clientName) {
      this.socket.emit('update-session-client', { sessionId: this.sessionId, clientName: this.clientName });
    }
  }

  recoverState() {
    const stateString = sessionStorage.getItem(STATE_KEY);
    if (!stateString) return {};
    const state = JSON.parse(stateString);
    this.isOnCall = state.isOnCall;
    this.sessionId = state.sessionId;
    this.isCobrowsing = state.isCobrowsing;
    this.isCobrowsingRequest = state.isCobrowsingRequest;
    this.handlePointerEvents(this.isCobrowsing);
    if (this.sessionId && this.iframe) this.iframe.nativeElement.style.display = 'block';
    if (this.isCobrowsing && this.iframe) this.iframe.nativeElement.style.pointerEvents = 'unset';
    return state;
  }

  setState() {
    const state = {
      isOnCall: this.isOnCall,
      sessionId: this.sessionId,
      isCobrowsing: this.isCobrowsing,
      isCobrowsingRequest: this.isCobrowsingRequest,
    };
    const stateString = JSON.stringify(state);
    sessionStorage.setItem(STATE_KEY, stateString);
  }

  onSearchChange() {
    const now = Date.now();
    this.searchMoment = now;
    setTimeout((args: any[]) => {
      if (this.searchMoment !== args[0]) return;
      const socketData = {
        skip: this.first,
        limit: this.rows,
        searchString: this.searchString,
      };
      this.socket.emit('search-sessions', socketData);
    }, this.SEARCH_DELAY, [this.searchMoment]);
  }

  sortSessions(clientDataIndex: number) {
    this.clientsData[clientDataIndex].sessions.sort((a: any, b: any) => {
      if (a._id === this.sessionId || (a.userCode && a.userCode === this.user.code)) return -1;
      if (b._id === this.sessionId || (b.userCode && b.userCode === this.user.code)) return 1;
      if (b.isHelpRequest || b.isCustomFlowTriggered) return 1;
      if (a.isHelpRequest || a.isCustomFlowTriggered) return -1;
      return 0;
    });
  }

  loadShadowDom() {
    if (!this.shadowDomElements) return;
    const totalShadows = this.shadowDomElements.length;
    for (let i = 0; i < totalShadows; i += 1) {
      const shadow = this.shadowDomElements[i];
      const element = this.getElementFromSelector(shadow.selector);
      if (!element || element.shadowRoot) continue;
      element.attachShadow({ mode: 'open' });
      element.shadowRoot.innerHTML = shadow['cssValue'] + shadow['htmlValue'];
    }

    this.shadowDomElements = [];
  }

  nonInitIframeDisplay() {
    const iFrames: [HTMLIFrameElement] = this.iframe.nativeElement.contentDocument.getElementsByTagName('iframe');
    const totalIframes = iFrames.length;
    for (let i = 0; i < totalIframes; i++) {
      const iframe = iFrames[i];
      const hasSandbox = iframe.getAttribute('sandbox');
      if (hasSandbox) continue;
      const html = `
        <html>
          <head>
            <style>
              body { font-family: Helvetica; margin: 0; background-image:repeating-linear-gradient(45deg, rgba(255, 255, 255, 1), rgba(255, 255, 255, 1) 8px, rgba(204, 204, 204, 1) 8px, rgba(204, 204, 204, 1) 16px); }
              body .content { border: 4px solid #CCCCCC; box-sizing: border-box; display: flex; width: 100vw; height: 100vh; align-items: center; justify-content: center; text-align: center; }
              body .content h3 { font-size: 3rem; }
              body .content a { font-size: 2rem; }
            </style>
            <script>
              function openIframesDocs() {
                var event = { type: "OPEN_DOCS", data: { url: '${environment.DOCS_URLS.SET_UP_IFRAMES}' } };
                window.parent.parent.postMessage(event, '*');
              }
            </script>
          </head>
          <body>
            <div class="content">
              <div>
                <h3>${this.literalPipe.transform('SESSIONS.IFRAME_NOT_AVAILABLE', this.lan)}</h3>
                <a href="#" onclick="openIframesDocs()" >${this.literalPipe.transform('SESSIONS.IFRAME_DOCS', this.lan)}</a>
              </div>
            </div>
          </body>
        </html>
      `;
      const tempDiv = this.iframe.nativeElement.contentWindow.document.createElement('div');
      tempDiv.innerHTML = iframe.outerHTML;
      const node = tempDiv.firstElementChild;
      node.removeAttribute('src');
      node.setAttribute('sandbox', 'allow-same-origin allow-scripts');
      iframe.replaceWith(node);
      const doc = node.contentWindow.document;
      doc.open();
      doc.write(html);
      doc.close();
    }
  }

  onLoadIframe() {
    if (!this.iframe) return;
    this.nonInitIframeDisplay();
    this.loadShadowDom();
    const checkInputs: HTMLInputElement[] = Array.from(this.iframe.nativeElement.contentWindow.document.querySelectorAll("input[checked]"));
    const textInputs: HTMLInputElement[] = Array.from(this.iframe.nativeElement.contentWindow.document.querySelectorAll("input:not([checked]), select"));
    const totalCheckInputs = checkInputs.length;
    for (let i = 0; i < totalCheckInputs; i += 1) {
      const checkInput = checkInputs[i];
      checkInput.checked = checkInput.getAttribute('checked') === 'true';
    }

    const totalTextInputs = textInputs.length;
    for (let i = 0; i < totalTextInputs; i += 1) {
      const textInput = textInputs[i];
      const value = textInput.getAttribute('value');
      if (value) textInput.value = value;
    }
  }

  requestFonts() {
    const fontsRequestData = { type: 'FONTS_REQUEST', data: {} };
    this.iframe.nativeElement.contentWindow.postMessage(fontsRequestData, '*');
  }

  handleNewFontUrls(fileNames: string[]) {
    if (!this.iframe || !fileNames || !fileNames.length) return;
    const fontEvent = { type: "NEW_FONTS", data: { fileNames } };
    this.iframe.nativeElement.contentWindow.postMessage(fontEvent, '*');
  }

  async startCall() {
    if (!this.hasCalls) return;
    const url = `${environment.BASE_CALLS_URL}?appId=${environment.AGORA_APP_ID}&channel=${this.user.code}&uid=agent_${this.user._id}`;
    const newWindow = window.open(url, 'sidebyCalls', 'width=300,height=400,resizable=0,menubar=0,location=0,status=0');
    if (!newWindow) return;
    this.socket.emit('request-join-call', {});
  }

  endCall() {
    this.socket.emit('agent-end-call-request', {});
  }

  reCall() {
    if (!this.hasCalls) return;
    this.socket.emit('request-join-call', {});
  }

  joinClientCall() {
    const callUrl = this.session.callUrl;
    const index = callUrl.indexOf('/v/calls');
    let path = callUrl.substr(index);
    const uidIndex = path.indexOf('&uid=');
    path = `${path.substr(0, uidIndex + 1)}&uid=agent_${this.user._id}`;
    const url = `${environment.BASE_API_URL}${path}`;
    window.open(url, 'sidebyCalls', 'width=300,height=400,resizable=0,menubar=0,location=0,status=0');
  }

  onPageChange(event: any) {
    const { first, rows, page, pageCount } = event;
    this.rows = rows;
    this.first = first;
    this.pageCount = pageCount;
    const socketData = {
      skip: this.first,
      limit: this.rows,
      searchString: this.searchString,
    };
    if (this.page !== page) this.socket.emit('search-sessions', socketData);
    this.page = page;
  }

  handleCoBrowsingTimer() {
    this.coBrowsingTimer = 0;
    if (this.timerInterval) clearInterval(this.timerInterval);
    if (!this.session || !this.isSomeoneCoBrowsing) return;
    this.timerInterval = setInterval(() => {
      const coBrowsingInfo = this.session.coBrowsingInfo;
      if (!coBrowsingInfo) {
        clearInterval(this.timerInterval);
        return;
      }

      const lastItem = coBrowsingInfo[coBrowsingInfo.length - 1];
      let { startDate } = lastItem;
      const startDateTime = new Date(startDate).getTime();
      const now = Date.now();
      this.coBrowsingTimer = now - startDateTime;
    }, 1000);
  }

  openInstallationScriptPopup() {
    if (!this.isAdmin) return;
    this.router.navigate([ROUTES.SETTINGS]).then(() => {
      setTimeout(() => {
        const button = document.getElementsByClassName('installation-button')[0];
        if (!button) return;
        eval('button.click();');
      }, 500);
    });
  }

  selectedSessionFromDropdown() {
    console.log(this.sessionsDropdown,this.isSelectExpanded);
      //this.sessionsDropdown.focus();
      console.log(this.sessionsDropdown.options);
      this.sessionsDropdown.show();
    
    //else this.sessionsDropdown.hide();
  }

}
