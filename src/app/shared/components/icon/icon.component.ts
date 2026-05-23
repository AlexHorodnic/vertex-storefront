import { Component, input } from '@angular/core';

export type IconName =
  | 'cart'
  | 'search'
  | 'sort'
  | 'truck'
  | 'shield'
  | 'trash'
  | 'minus'
  | 'plus'
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
