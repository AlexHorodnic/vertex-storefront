import { Component, OnDestroy, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';

import { ProductService } from '../../core/services/product.service';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';

@Component({
  selector: 'app-home',
  imports: [CurrencyPipe, RouterLink, ProductCardComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnDestroy {
  protected readonly productService = inject(ProductService);

  protected readonly heroTiltX = signal('0deg');
  protected readonly heroTiltY = signal('0deg');
  protected readonly heroGlowX = signal('50%');
  protected readonly heroGlowY = signal('50%');
  protected readonly heroShadowX = signal('0px');
  protected readonly heroShadowY = signal('32px');

  private heroFrame = 0;

  protected onHeroPointerMove(event: PointerEvent): void {
    if (!this.canUsePointerMotion(event)) {
      return;
    }

    const target = event.currentTarget;

    if (!(target instanceof HTMLElement)) {
      return;
    }

    const rect = target.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;

    cancelAnimationFrame(this.heroFrame);
    this.heroFrame = requestAnimationFrame(() => {
      this.heroTiltX.set(`${(-y * 4).toFixed(2)}deg`);
      this.heroTiltY.set(`${(x * 5).toFixed(2)}deg`);
      this.heroGlowX.set(`${((x + 0.5) * 100).toFixed(1)}%`);
      this.heroGlowY.set(`${((y + 0.5) * 100).toFixed(1)}%`);
      this.heroShadowX.set(`${(x * 18).toFixed(1)}px`);
      this.heroShadowY.set(`${(32 + y * 12).toFixed(1)}px`);
    });
  }

  protected resetHeroPointer(): void {
    cancelAnimationFrame(this.heroFrame);
    this.heroFrame = requestAnimationFrame(() => {
      this.heroTiltX.set('0deg');
      this.heroTiltY.set('0deg');
      this.heroGlowX.set('50%');
      this.heroGlowY.set('50%');
      this.heroShadowX.set('0px');
      this.heroShadowY.set('32px');
    });
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.heroFrame);
  }

  private canUsePointerMotion(event: PointerEvent): boolean {
    return (
      event.pointerType === 'mouse' &&
      typeof window !== 'undefined' &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches &&
      window.matchMedia('(hover: hover) and (pointer: fine)').matches
    );
  }
}
