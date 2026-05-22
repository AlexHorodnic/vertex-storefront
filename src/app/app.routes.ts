import { Routes } from '@angular/router';

import { ShellComponent } from './layout/shell/shell.component';

export const routes: Routes = [
  {
    path: '',
    component: ShellComponent,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/home/home.component').then((component) => component.HomeComponent),
      },
      {
        path: 'products',
        loadComponent: () =>
          import('./features/products/products.component').then(
            (component) => component.ProductsComponent,
          ),
      },
      {
        path: 'products/:slug',
        loadComponent: () =>
          import('./features/product-detail/product-detail.component').then(
            (component) => component.ProductDetailComponent,
          ),
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
