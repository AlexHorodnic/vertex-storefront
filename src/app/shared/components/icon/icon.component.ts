import { Component, input } from '@angular/core';

export type IconName =
  | 'cart'
  | 'card'
  | 'battery'
  | 'chip'
  | 'chevron-left'
  | 'chevron-right'
  | 'close'
  | 'drive'
  | 'gauge'
  | 'headset'
  | 'map-pin'
  | 'monitor'
  | 'package'
  | 'plug'
  | 'refresh'
  | 'search'
  | 'speaker'
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
