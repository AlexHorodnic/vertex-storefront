import { Component, input } from '@angular/core';

export type IconName =
  | 'cart'
  | 'card'
  | 'chevron-left'
  | 'chevron-right'
  | 'close'
  | 'headset'
  | 'refresh'
  | 'search'
  | 'sort'
  | 'truck'
  | 'shield'
  | 'trash'
  | 'minus'
  | 'plus'
  | 'wallet'
  | 'reset'
  | 'stock'
  | 'spec';

@Component({
  selector: 'app-icon',
  templateUrl: './icon.component.html',
  styleUrl: './icon.component.scss',
})
export class IconComponent {
  readonly name = input.required<IconName>();
}
