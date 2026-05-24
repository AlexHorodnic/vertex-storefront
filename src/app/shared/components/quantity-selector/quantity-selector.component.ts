import { Component, input, output } from '@angular/core';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-quantity-selector',
  imports: [IconComponent],
  templateUrl: './quantity-selector.component.html',
  styleUrl: './quantity-selector.component.scss',
})
export class QuantitySelectorComponent {
  readonly value = input.required<number>();
  readonly min = input(1);
  readonly max = input(99);
  readonly label = input('Quantity');
  readonly valueChange = output<number>();

  decrease(): void {
    this.setValue(this.value() - 1);
  }

  increase(): void {
    this.setValue(this.value() + 1);
  }

  private setValue(value: number): void {
    const nextValue = Math.min(Math.max(value, this.min()), this.max());
    this.valueChange.emit(nextValue);
  }
}
