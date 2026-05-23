import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { STORE_NAVIGATION } from '../../core/constants/storefront.constants';
import { CartService } from '../../core/services/cart.service';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive, IconComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  protected readonly cartService = inject(CartService);
  protected readonly navigation = STORE_NAVIGATION;
}
