import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { LiteralPipe } from './pipes/literal.pipe';

@NgModule({
  declarations: [LiteralPipe],
  exports: [
    CommonModule,
    FormsModule,
    LiteralPipe,
  ],
  providers: []
})
export class SharedModule { }
