import { routes } from './app.routes';

describe('application routes', () => {
  const featureRoutes = routes[0].children ?? [];

  it('lazy-loads every route-level storefront feature', () => {
    expect(featureRoutes).toHaveLength(4);

    featureRoutes.forEach((route) => {
      expect(route.component).toBeUndefined();
      expect(route.loadComponent).toBeTypeOf('function');
    });
  });

  it('resolves every lazy feature component', async () => {
    const components = await Promise.all(
      featureRoutes.map((route) => Promise.resolve(route.loadComponent!())),
    );

    components.forEach((component) => {
      expect(component).toBeTypeOf('function');
    });
  });
});
