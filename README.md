# data-comparison-widget

Staffbase-Custom-Widget. Entwickelt, gebaut und released wird es aus dem
Meta-Repo [`ps-mhp/man-staffbase-cms-extensions`](https://github.com/ps-mhp/man-staffbase-cms-extensions);
dieses Repo enthält nur Quellcode und das ausgelieferte Bundle unter `dist/`.

```bash
scripts/sync.sh data-comparison-widget
npm run build -- --env widget=data-comparison-widget
npm test -- src/widgets/data-comparison-widget
scripts/release.sh data-comparison-widget
```
