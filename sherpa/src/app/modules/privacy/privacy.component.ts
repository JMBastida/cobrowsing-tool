import { Component, OnInit, ViewEncapsulation } from '@angular/core';

import { LanguageService } from '../shared/services/language.service';

@Component({
  selector: 'shr-privacy',
  templateUrl: './privacy.component.html',
  styleUrls: ['./privacy.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class PrivacyComponent implements OnInit {
  lan: string;

  constructor(
    private languageService: LanguageService,
  ) {
    this.lan = this.languageService.lan;
    this.languageService.language.subscribe(lan => this.lan = lan);
  }

  ngOnInit(): void {
    window.scrollTo({ top: 0 });
  }

}
