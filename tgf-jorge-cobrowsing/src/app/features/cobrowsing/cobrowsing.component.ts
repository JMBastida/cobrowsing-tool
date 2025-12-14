import { Component, OnInit, OnDestroy, inject, signal, ChangeDetectionStrategy, ViewChild, ElementRef, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import { SocketService } from '../../shared/services/socket.service';
import LZString from 'lz-string';

@Component({
  selector: 'app-cobrowsing',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cobrowsing.component.html',
  styleUrls: ['./cobrowsing.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CobrowsingComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private socketService = inject(SocketService);
  private sanitizer = inject(DomSanitizer);

  @ViewChild('iframe') iframe: ElementRef<HTMLIFrameElement> | undefined;
  @ViewChild('screenContainer') screenContainer: ElementRef<HTMLDivElement> | undefined;

  sessionId = signal<string | null>(null);
  iframeSrc = signal<SafeResourceUrl | null>(null);
  clientCursor = signal<{ x: number, y: number } | null>(null);
  scale = signal<number>(1);
  
  private subscriptions: Subscription[] = [];
  private tempDomData: any[] = [];
  private shadowDomElements: any[] = [];
  private scrollOrder = 0;
  private scrollValue = { x: 0, y: 0 };
  private avoidAgentEvents = true; // Initially true until co-browsing starts
  private isCobrowsing = false; // Track co-browsing state

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    this.sessionId.set(id);

    if (id) {
      this.setupSocketListeners(id);
      console.log('Emitting watch-session for:', id);
      this.socketService.emit('watch-session', { sessionId: id });
    }
  }

  @HostListener('window:resize') 
  handleResize() {
    // Logic to update scale will be implemented here or triggered by socket resize event
    // For now, we rely on the socket 'resize' event to set dimensions and scale
  }

  @HostListener('window:message', ['$event']) 
  handleMessage(event: MessageEvent) {
    if (!event || !event.data || !event.data.type) return;
    
    // Handle FONTS_REQUEST if needed (omitted for brevity, can be added)
    
    if (this.avoidAgentEvents || !this.isCobrowsing) return;
    this.socketService.emit('new-agent-event', event.data);
  }

  private setupSocketListeners(sessionId: string) {
    // Update DOM (Initial Load)
    this.subscriptions.push(
      this.socketService.listen('update-dom').subscribe((data: any) => {
        console.log('Received update-dom:', data);
        if (!data) return;
        this.tempDomData.push(data);
        const last = this.tempDomData.find(d => d.isLast);
        
        if (!last) {
            console.log('Waiting for last DOM packet...');
            return;
        }
        
        console.log('Last DOM packet received. Assembling DOM...');
        const { timeStamp } = last;
        const validData = this.tempDomData.filter(d => d.timeStamp === timeStamp);
        if (last.order >= validData.length) {
             console.log('Missing packets. Expected:', last.order + 1, 'Received:', validData.length);
             return;
        }
        
        validData.sort((a, b) => a.order - b.order);
        const tempData = validData.reduce((prev, curr) => {
          if (curr.html) prev.html += curr.html;
          if (curr.shadowString) prev.shadowString += curr.shadowString;
          return prev;
        }, { html: '', shadowString: '' });
        
        const { html, shadowString } = tempData;
        console.log('DOM assembled. Parsing HTML...');
        const htmlParsed = this.parseHtml(html);
        
        if (shadowString) {
          try {
            const shadow = JSON.parse(shadowString);
            if (shadow && shadow.length) this.shadowDomElements = shadow;
          } catch (e) { console.error('Error parsing shadow DOM', e); }
        }

        // Set the iframe source. The iframe element will be created by Angular when iframeSrc has a value.
        // We cannot access this.iframe.nativeElement here immediately because it might not be rendered yet.
        // The content will be loaded via [src] binding.
        const blob = new Blob([htmlParsed], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        console.log('Setting iframeSrc...');
        this.iframeSrc.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
        
        this.tempDomData = this.tempDomData.filter(d => d.timeStamp !== timeStamp);
      })
    );

    // DOM Mutations
    this.subscriptions.push(
      this.socketService.listen('dom-mutations').subscribe((data: any) => {
        // console.log('Received dom-mutations'); // Can be noisy
        this.handleDomMutations(data);
      })
    );

    // Client Events (Mouse, Scroll, Click, Input)
    this.subscriptions.push(
      this.socketService.listen('client-event').subscribe((data: any) => {
        // console.log('Received client-event', data.type);
        this.handleClientEvent(data);
      })
    );

    // Resize
    this.subscriptions.push(
      this.socketService.listen('resize').subscribe((data: any) => {
        this.handleRemoteResize(data);
      })
    );

    // Session Not Found
    this.subscriptions.push(
      this.socketService.listen('session-not-found').subscribe(() => {
        console.warn('Session not found');
        this.router.navigate(['/dashboard/sessions']);
      })
    );
  }

  private handleDomMutations(data: any) {
    if (!data || !data.selector || !this.iframe?.nativeElement?.contentWindow) return;
    
    const { selector, addedElements, newInnerHtml, newOuterHtml, elementAttributes, textContent, embeddedSelector, shadowData } = data;
    const parentNode = this.getElementFromSelector(selector, embeddedSelector);
    
    if (!parentNode) return;

    if (addedElements) {
        // Logic for added elements (simplified from reference)
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
        
        // Forward the event to the iframe's internal script
        this.iframe.nativeElement.contentWindow.postMessage(data, '*');
        
        setTimeout(() => {
             const now = Date.now();
             if (this.isCobrowsing && now >= this.scrollOrder + 1500) this.handlePointerEvents(true);
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
      
      // Apply initial scroll if available
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
      // console.log('wrong selector:', selector);
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
    // Inject a standard CSS reset to normalize styles and fix margin issues.
    return `
      <style>
        /* A simple but effective CSS Reset */
        html, body, div, span, applet, object, iframe,
        h1, h2, h3, h4, h5, h6, p, blockquote, pre,
        a, abbr, acronym, address, big, cite, code,
        del, dfn, em, img, ins, kbd, q, s, samp,
        small, strike, strong, sub, sup, tt, var,
        b, u, i, center,
        dl, dt, dd, ol, ul, li,
        fieldset, form, label, legend,
        table, caption, tbody, tfoot, thead, tr, th, td,
        article, aside, canvas, details, embed, 
        figure, figcaption, footer, header, hgroup, 
        menu, nav, output, ruby, section, summary,
        time, mark, audio, video {
          margin: 0;
          padding: 0;
          border: 0;
          font-size: 100%;
          font: inherit;
          vertical-align: baseline;
        }
        /* HTML5 display-role reset for older browsers */
        article, aside, details, figcaption, figure, 
        footer, header, hgroup, menu, nav, section {
          display: block;
        }
        body {
          line-height: 1;
        }
        ol, ul {
          list-style: none;
        }
        blockquote, q {
          quotes: none;
        }
        blockquote:before, blockquote:after,
        q:before, q:after {
          content: '';
          content: none;
        }
        table {
          border-collapse: collapse;
          border-spacing: 0;
        }
        /* Custom scrollbar styles */
        html::-webkit-scrollbar { display: none; }
        html { -ms-overflow-style: none; scrollbar-width: none; }
      </style>
    `;
  }

  private getIframeListeners() {
    // Injects the script that listens to events inside the iframe and posts them to parent
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

        // Listen for messages from the parent window (the Angular app)
        window.addEventListener("message", (event) => {
          if (!event || !event.data || !event.data.type) return;
          
          if (event.data.type === "SCROLL") {
            console.log("IFRAME: Received SCROLL event", event.data.data);
            var selector = event.data.data.selector;
            var value = event.data.data.value;
            var element;

            if (selector === 'html' || selector === 'window' || selector === 'body') {
              console.log("IFRAME: Scrolling window/html/body to", value.x, value.y);
              // Try scrolling everything to be sure
              window.scrollTo({ top: value.y, left: value.x, behavior: 'auto' });
              if (document.documentElement) document.documentElement.scrollTop = value.y;
              if (document.body) document.body.scrollTop = value.y;
            } else {
              element = document.querySelector(selector);
              if (element) {
                console.log("IFRAME: Scrolling element", selector, "to", value.x, value.y);
                element.scrollTo({ top: value.y, left: value.x, behavior: 'auto' });
              } else {
                console.warn("IFRAME: Element not found for selector", selector);
              }
            }
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

  ngOnDestroy() {
    const id = this.sessionId();
    if (id) {
      this.socketService.emit('stop-watching', { sessionId: id });
    }
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}
