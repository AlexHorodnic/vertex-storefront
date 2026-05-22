import { DecimalPipe } from '@angular/common';
import { Component, input } from '@angular/core';

@Component({
  selector: 'app-rating',
  imports: [DecimalPipe],
  templateUrl: './rating.component.html',
  styleUrl: './rating.component.scss',
})
export class RatingComponent {
  readonly rating = input.required<number>();
  readonly reviewCount = input.required<number>();
}
