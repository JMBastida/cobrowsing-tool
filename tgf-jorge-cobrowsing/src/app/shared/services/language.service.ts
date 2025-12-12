import { Injectable, signal } from '@angular/core';
import { en, es } from '../../../locale';

@Injectable({
  providedIn: 'root',
})
export class LanguageService {
  lan = signal('en');
  translations = signal<any>(en);

  constructor() {
    this.onLanguageChange(this.lan());
  }

  onLanguageChange(lan: string) {
    this.lan.set(lan);
    this.translations.set(lan === 'es' ? es : en);
  }
}
