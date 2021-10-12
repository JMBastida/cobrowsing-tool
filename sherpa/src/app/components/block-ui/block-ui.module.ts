import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BlockUiComponent } from './block-ui.component';
import { BlockUiService } from './block-ui.service';
import { ProgressSpinnerModule } from 'primeng/progressspinner';


@NgModule({
  declarations: [
    BlockUiComponent
  ],
  exports: [BlockUiComponent],
  imports: [
    CommonModule,
    ProgressSpinnerModule,
  ],
  providers: [BlockUiService]
})
export class BlockUiModule { }
