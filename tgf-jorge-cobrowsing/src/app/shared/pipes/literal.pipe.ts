import { inject, Injectable, Pipe, PipeTransform } from '@angular/core';
import { LanguageService } from '../services/language.service';

@Injectable({
  providedIn: 'root',
})
@Pipe({
  name: 'literal',
  standalone: true,
})
export class LiteralPipe implements PipeTransform {
  private languageService = inject(LanguageService);
  private translations = this.languageService.translations;

  transform(value: string, ...args: any[]): string {
    const keys = value.split('.');
    let result: any = this.translations();

    for (const key of keys) {
      if (result && typeof result === 'object' && key in result) {
        result = result[key];
      } else {
        return value;
      }
    }

    return result;
  }
}
