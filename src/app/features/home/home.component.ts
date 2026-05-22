import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ProductService } from '../../core/services/product.service';
import { ProductGridComponent } from '../../shared/components/product-grid/product-grid.component';
import { SectionHeaderComponent } from '../../shared/components/section-header/section-header.component';

@Component({
  selector: 'app-home',
  imports: [RouterLink, ProductGridComponent, SectionHeaderComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  protected readonly productService = inject(ProductService);
}
