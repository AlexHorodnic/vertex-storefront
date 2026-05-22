import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { CartDrawerComponent } from '../../features/cart/cart-drawer/cart-drawer.component';
import { FooterComponent } from '../footer/footer.component';
import { HeaderComponent } from '../header/header.component';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, HeaderComponent, FooterComponent, CartDrawerComponent],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
})
export class ShellComponent {}
