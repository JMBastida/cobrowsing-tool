import { Component, OnInit, OnDestroy, inject, signal, ChangeDetectionStrategy, ViewChild, ElementRef, HostListener, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import { SocketService } from '../../shared/services/socket.service';
import LZString from 'lz-string';
import { ButtonModule } from 'primeng/button';

interface ClickRipple {
  id: number;
  x: number;
  y: number;
}

@Component({
  selector: 'app-cobrowsing',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  templateUrl: './cobrowsing.component.html',
  styleUrls: ['./cobrowsing.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CobrowsingComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private socketService = inject(SocketService);
  private sanitizer = inject(DomSanitizer);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('iframe') iframe: ElementRef<HTMLIFrameElement> | undefined;
  @ViewChild('screenContainer') screenContainer: ElementRef<HTMLDivElement> | undefined;

  sessionId = signal<string | null>(null);
  iframeSrc = signal<SafeResourceUrl | null>(null);
  clientCursor = signal<{ x: number, y: number } | null>(null);
  scale = signal<number>(1);
  clickRipples = signal<ClickRipple[]>([]);
  
  isCobrowsing = signal(false);
  isCobrowsingRequest = signal(false);
  
  private subscriptions: Subscription[] = [];
  private tempDomData: any[] = [];
  private shadowDomElements: any[] = [];
  private scrollOrder = 0;
  private scrollValue = { x: 0, y: 0 };
  private avoidAgentEvents = true;

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    this.sessionId.set(id);

    if (id) {
      this.setupSocketListeners(id);
      this.socketService.emit('watch-session', { sessionId: id });
    }
  }

  @HostListener('window:message', ['$event']) 
  handleMessage(event: MessageEvent) {
    if (!event || !event.data || !event.data.type) return;
    if (this.avoidAgentEvents || !this.isCobrowsing()) return;
    this.socketService.emit('new-agent-event', event.data);
  }

  private setupSocketListeners(sessionId: string) {
    this.subscriptions.push(
      this.socketService.listen('update-dom').subscribe((data: any) => this.handleUpdateDom(data)),
      this.socketService.listen('dom-mutations').subscribe((data: any) => this.handleDomMutations(data)),
      this.socketService.listen('client-event').subscribe((data: any) => this.handleClientEvent(data)),
      this.socketService.listen('resize').subscribe((data: any) => this.handleRemoteResize(data)),
      this.socketService.listen('session-not-found').subscribe(() => this.router.navigate(['/dashboard/sessions'])),
      
      // Co-browsing flow events
      this.socketService.listen('co-browsing-response').subscribe((data: { isAccepted: boolean }) => {
        this.isCobrowsingRequest.set(false);
        if (data.isAccepted) {
          this.isCobrowsing.set(true);
          this.handlePointerEvents(true);
        }
      }),
      this.socketService.listen('co-browsing-stopped').subscribe(() => {
        this.isCobrowsing.set(false);
        this.isCobrowsingRequest.set(false);
        this.handlePointerEvents(false);
      }),
      this.socketService.listen('co-browsing-request-stopped').subscribe(() => {
        this.isCobrowsingRequest.set(false);
      })
    );
  }

  private handleUpdateDom(data: any) {
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
      try {
        const shadow = JSON.parse(shadowString);
        if (shadow && shadow.length) this.shadowDomElements = shadow;
      } catch (e) { console.error('Error parsing shadow DOM', e); }
    }

    const blob = new Blob([htmlParsed], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    this.iframeSrc.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
    
    this.tempDomData = this.tempDomData.filter(d => d.timeStamp !== timeStamp);
  }

  private handleDomMutations(data: any) {
    if (!data || !data.selector || !this.iframe?.nativeElement?.contentWindow) return;
    
    const { selector, addedElements, newInnerHtml, newOuterHtml, elementAttributes, textContent, embeddedSelector, shadowData } = data;
    const parentNode = this.getElementFromSelector(selector, embeddedSelector);
    
    if (!parentNode) return;

    if (addedElements) {
        addedElements.forEach((element: any) => {
            // @ts-ignore
            const placeholder = this.iframe.nativeElement.contentWindow!.document.createElement('div');
            placeholder.innerHTML = element.html;
            const node = placeholder.firstElementChild;
            if (node) {
                try {
                    parentNode.appendChild(node);
                } catch(e) { console.log(e); }
            }
        });
        if (shadowData && shadowData.length) {
            this.shadowDomElements = shadowData;
            this.onLoadIframe();
        }
    }

    if (newInnerHtml) {
        if (parentNode.localName === 'iframe') {
             const doc = (parentNode as HTMLIFrameElement).contentWindow?.document;
             if (doc) {
                 doc.open();
                 doc.write(newInnerHtml);
                 doc.close();
             }
        } else if (parentNode.localName === 'head') {
             const extraStyles = this.getExtraStyles();
             const decodedInnerHtml = LZString.decompress(newInnerHtml);
             parentNode.innerHTML = extraStyles + decodedInnerHtml;
        } else {
             parentNode.innerHTML = newInnerHtml;
        }
        this.onLoadIframe();
    }
    
    if (newOuterHtml) {
        // @ts-ignore
        const placeholder = this.iframe.nativeElement.contentWindow!.document.createElement('div');
        placeholder.innerHTML = newOuterHtml;
        const node = placeholder.firstElementChild;
        if (node) {
             node.removeAttribute('src');
             node.setAttribute('sandbox', 'allow-same-origin allow-scripts allow-forms allow-presentation');
             parentNode.replaceWith(node);
        }
        this.onLoadIframe();
    }

    if (textContent) {
        parentNode.textContent = textContent;
    }

    if (elementAttributes) {
        if (elementAttributes.type === 'src') (parentNode as HTMLImageElement).src = elementAttributes.value;
        else if (elementAttributes.type === 'class') parentNode.className = elementAttributes.value;
        else if (elementAttributes.type === 'style') parentNode.setAttribute('style', elementAttributes.value);
    }
  }

  private handleClientEvent(data: any) {
    if (!data || !data.type || !data.data) return;

    if (data.type === 'SCROLL') {
        if (!this.iframe?.nativeElement?.contentWindow) return;

        this.scrollOrder = Date.now();
        this.handlePointerEvents(false);
        this.scrollValue = data.data.value;
        
        const selector = data.data.selector;
        const scrollX = data.data.value.x || 0;
        const scrollY = data.data.value.y || 0;

        if (selector) {
            const element = this.getElementFromSelector(selector);
            if (element) {
                element.scrollTo({ top: scrollY, left: scrollX, behavior: 'auto' });
            }
        } else {
            this.iframe.nativeElement.contentWindow.scrollTo({ top: scrollY, left: scrollX, behavior: 'auto' });
        }

        // @ts-ignore
        this.iframe.nativeElement.contentWindow.postMessage(data, '*');
        
        setTimeout(() => {
             const now = Date.now();
             if (this.isCobrowsing() && now >= this.scrollOrder + 1500) this.handlePointerEvents(true);
        }, 1500);
    } else if (data.type === 'MOUSE_MOVE') {
        let left = data.data.left;
        let top = data.data.top;
        
        if (data.data.iframeSelector && this.iframe?.nativeElement?.contentWindow) {
             const iframe = this.getElementFromSelector(data.data.iframeSelector);
             if (iframe) {
                 const position = iframe.getBoundingClientRect();
                 left += position.left;
                 top += position.top;
             }
        }
        this.clientCursor.set({ x: this.scale() * left, y: this.scale() * top });
    } else if (data.type === 'CLICK') {
        this.createClickRipple(data.data.x, data.data.y);
        if (data.data.selector && this.iframe?.nativeElement?.contentWindow) {
             const element = this.getElementFromSelector(data.data.selector);
             if (element && (element.type === 'checkbox' || element.type === 'radio')) {
                 element.checked = data.data.value;
             }
        }
    } else if (data.type === 'VALUE_CHANGE') {
        if (!this.iframe?.nativeElement?.contentWindow) return;
        
        const element = this.getElementFromSelector(data.data.selector, data.data.iframeSelector);
        if (element) {
             if (['checkbox', 'radio'].includes(element.type)) {
                 element.checked = data.data.checked;
             } else {
                 element.value = data.data.value;
             }
        }
    }
  }

  private createClickRipple(x: number, y: number) {
    const newRipple: ClickRipple = {
      id: Date.now(),
      x: this.scale() * x,
      y: this.scale() * y
    };
    this.clickRipples.update(ripples => [...ripples, newRipple]);
    
    setTimeout(() => {
      this.clickRipples.update(ripples => ripples.filter(r => r.id !== newRipple.id));
    }, 500);
  }

  private handleRemoteResize(data: any) {
      if (!data || !data.innerWidth || !data.innerHeight) return;
      if (!this.screenContainer?.nativeElement || !this.iframe?.nativeElement) return;

      const { innerWidth, innerHeight } = data;
      
      const containerWidth = this.screenContainer.nativeElement.clientWidth;
      const containerHeight = window.innerHeight * 0.8; 
      
      const scaleWidth = containerWidth / innerWidth;
      const scaleHeight = containerHeight / innerHeight;
      const newScale = Math.min(scaleWidth, scaleHeight);
      
      this.scale.set(newScale);

      const iframeStyle = this.iframe.nativeElement.style;
      iframeStyle.width = `${innerWidth}px`;
      iframeStyle.height = `${innerHeight}px`;
      iframeStyle.transform = `scale(${newScale})`;
      iframeStyle.transformOrigin = '0 0';
  }

  onLoadIframe() {
    if (!this.iframe?.nativeElement?.contentWindow) return;

    try {
      this.nonInitIframeDisplay();
      this.loadShadowDom();
      
      const doc = this.iframe.nativeElement.contentWindow.document;
      const checkInputs: HTMLInputElement[] = Array.from(doc.querySelectorAll("input[checked]"));
      const textInputs: HTMLInputElement[] = Array.from(doc.querySelectorAll("input:not([checked]), select"));
      
      checkInputs.forEach(input => {
        input.checked = input.getAttribute('checked') === 'true';
      });

      textInputs.forEach(input => {
        const value = input.getAttribute('value');
        if (value) {
          input.value = value;
        }
      });
      
      if (this.scrollValue.x || this.scrollValue.y) {
          this.iframe.nativeElement.contentWindow.scrollTo(this.scrollValue.x, this.scrollValue.y);
      }
      
    } catch (e) {
      console.error("Could not access iframe content.", e);
    }
  }

  private nonInitIframeDisplay() {
      // Logic to handle nested iframes that might be blocked
  }

  private loadShadowDom() {
      if (!this.shadowDomElements.length || !this.iframe?.nativeElement?.contentWindow) return;
      
      for (const shadow of this.shadowDomElements) {
          const element = this.getElementFromSelector(shadow.selector);
          if (element && !element.shadowRoot) {
              try {
                  element.attachShadow({ mode: 'open' });
                  element.shadowRoot.innerHTML = shadow.cssValue + shadow.htmlValue;
              } catch(e) {}
          }
      }
      this.shadowDomElements = [];
  }

  private getElementFromSelector(selector: string, iframeSelector?: string): any {
    let element;
    try {
      // @ts-ignore
        const doc = this.iframe.nativeElement.contentWindow!.document;
      if (iframeSelector) {
        const iframe: HTMLIFrameElement | null = doc.querySelector(iframeSelector);
        element = iframe?.contentWindow?.document.querySelector(selector);
      } else {
        element = doc.querySelector(selector);
      }
    } catch (error) {
      element = undefined;
    }
    return element;
  }

  private parseHtml(html: string) {
    const index = html.indexOf('<head>') + 6;
    let htmlParsed = html.substr(0, index);
    const script = this.getIframeListeners();
    const extraStyles = this.getExtraStyles();
    htmlParsed += script + extraStyles;
    htmlParsed += html.substr(index);
    return htmlParsed;
  }

  private getExtraStyles() {
    return `
      <style>
        html::-webkit-scrollbar { display: none; }
        html { -ms-overflow-style: none; scrollbar-width: none; }
      </style>
    `;
  }

  private getIframeListeners() {
    return `
      <script>
        var avoidAgentEvents = ${this.avoidAgentEvents};
        var ticking = false;

        function getSelector(node) {
          if (!node || !node.localName) return 'window';
          if (node.localName === 'html') return 'html';
          if (node.localName === 'body') return 'body';

          var id = node.getAttribute('id');
          if (id) return '#' + id;
          
          var path = node.localName;
          var parent = node.parentNode;
          while (parent && parent.localName && parent.localName !== 'html') {
             path = parent.localName + ' > ' + path;
             parent = parent.parentNode;
          }
          return path;
        }

        window.addEventListener("message", (event) => {
          if (!event || !event.data || !event.data.type) return;
          
          if (event.data.type === "SCROLL") {
            var selector = event.data.data.selector;
            var value = event.data.data.value;
            var element;

            if (selector === 'html' || selector === 'window' || selector === 'body') {
              window.scrollTo({ top: value.y, left: value.x, behavior: 'auto' });
              if (document.documentElement) document.documentElement.scrollTop = value.y;
              if (document.body) document.body.scrollTop = value.y;
            } else {
              element = document.querySelector(selector);
              if (element) {
                element.scrollTo({ top: value.y, left: value.x, behavior: 'auto' });
              }
            }
          } else if (event.data.type === "AVOID_EVENTS") {
             avoidAgentEvents = event.data.data.value;
          }
        });

        function scrollHandler(event) {
          if (ticking) return;
          ticking = true;
          window.requestAnimationFrame(function() {
            var target = event.target === document ? document.documentElement : event.target;
            var scrollEvent = {
              type: "SCROLL",
              data: {
                selector: getSelector(target),
                value: { x: target.scrollLeft || window.scrollX, y: target.scrollTop || window.scrollY }
              },
            };
            window.parent.postMessage(scrollEvent, '*');
            ticking = false;
          });
        }

        window.addEventListener("scroll", scrollHandler, true);

        window.addEventListener("click", (event) => {
          if (avoidAgentEvents) return;
          var path = getSelector(event.target);
          var clickEvent = {
            type: 'CLICK',
            data: { x: event.clientX, y: event.clientY, path: path }
          };
          window.parent.postMessage(clickEvent, '*');
        });

        window.addEventListener("mousemove", (event) => {
          if (avoidAgentEvents) return;
          var moveEvent = {
            type: 'MOUSE_MOVE',
            data: { top: event.clientY, left: event.clientX },
          };
          window.parent.postMessage(moveEvent, '*');
        });
      </script>
    `;
  }

  private handlePointerEvents(isAllowed: boolean) {
    this.avoidAgentEvents = !isAllowed;
    const data = { type: 'AVOID_EVENTS', data: { value: this.avoidAgentEvents } };
    if (!this.iframe?.nativeElement?.contentWindow) return;
    this.iframe.nativeElement.contentWindow.postMessage(data, '*');
    
    if (isAllowed) this.iframe.nativeElement.style.pointerEvents = 'unset';
    else this.iframe.nativeElement.style.pointerEvents = 'none';
  }

  requestCoBrowsing() {
    this.isCobrowsingRequest.set(true);
    this.socketService.emit('request-co-browsing', {});
  }

  stopCoBrowsing() {
    this.socketService.emit('agent-stop-co-browsing', {});
  }

  ngOnDestroy() {
    const id = this.sessionId();
    if (id) {
      this.socketService.emit('stop-watching', { sessionId: id });
    }
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}
