import { Pipe, PipeTransform } from '@angular/core';
import { LANGUAGES } from '../enums/language.enums';
import { getLiteral } from '../helpers/literals.helper';

@Pipe({ name: 'literal' })
export class LiteralPipe implements PipeTransform {
  transform(value: string, lan?: string): string {
    if (!lan) lan = LANGUAGES.EN;
    const literal = getLiteral(value, lan);
    return literal;
  }
}
