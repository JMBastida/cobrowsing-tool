import { Component, ViewEncapsulation } from '@angular/core';
import { BlockUiService } from './block-ui.service';

@Component({
  selector: 'block-ui',
  templateUrl: './block-ui.component.html',
  styleUrls: ['./block-ui.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class BlockUiComponent {

  constructor(
    public blockUiService: BlockUiService
  ) { }

}
