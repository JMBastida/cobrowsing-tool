import { Component, OnInit, ViewEncapsulation } from '@angular/core';

import { LanguageService } from '../../shared/services/language.service';

import { environment } from '../../../../environments/environment';

@Component({
  selector: 'shr-contact-center',
  templateUrl: './contact-center.component.html',
  styleUrls: ['./contact-center.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class ContactCenterComponent implements OnInit {
  lan: string = '';
  docsUrl: string = environment.DOCS_URLS.BASE;
  isFrogedActive: boolean = false;

  constructor(
    private languageService: LanguageService,
  ) {
    this.onLanguageChange(this.languageService.lan);
    this.languageService.language.subscribe(lan => this.onLanguageChange(lan));
  }

  ngOnInit() {
    this.checkFrogedApp(0);
  }

  onLanguageChange(lan: string) {
    this.lan = lan;
  }

  checkFrogedApp(n: number) {
    n += 1;
    if (n > 5) return;
    try {
      const Froged = eval('window.Froged');
      if (!Froged) {
        setTimeout(() => this.checkFrogedApp(n), 3000);
        return;
      }

      this.isFrogedActive = true;
    } catch (error) {
      setTimeout(() => this.checkFrogedApp(n), 3000);
    }
  }

  openChat() {
    const Froged = eval('window.Froged');
    if (Froged) Froged('open', 'contact');
  }

}
