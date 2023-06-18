[![BUILD](https://github.com/TariqSaiyad/drupal-fetch/actions/workflows/main.yml/badge.svg)](https://github.com/TariqSaiyad/drupal-fetch/actions/workflows/main.yml) [![Publish](https://github.com/TariqSaiyad/drupal-fetch/actions/workflows/publish.yml/badge.svg)](https://github.com/TariqSaiyad/drupal-fetch/actions/workflows/publish.yml)

# Drupal Fetch

Helper functions to fetch JSON:API resources from a Drupal site.

This library simplifies the process of retrieving data from a Drupal backend and handles common operations such as fetching single resources, resource collections, menu items and views.

## Installation

Install drupal-fetch, use the package manager of your choice:

**Note:** [drupal-jsonapi-params](https://www.npmjs.com/package/drupal-jsonapi-params) is a helper library used to create complex queries easily.

```bash
npm install drupal-fetch drupal-jsonapi-params
```

## Usage/Examples

### Import and Instantiate Fetcher:

```typescript
import { DrupalFetch } from "drupal-fetch";

const fetcher = new DrupalFetch("https://drupal-site-base-url.com");
```

### Fetching a Single Resource:

```typescript
// fetch article with uuid.
const article = await this.drupal.getResource<DrupalNode>(
  "node--article",
  "2a8758e2-70a5-4ffb-ade1-25da62963bd6"
);

// fetch a text block paragraph with uuid.
const textBlock = await this.drupal.getResource<DrupalParagraph>(
  "paragraph-text_block",
  "2a8758e2-70a5-4ffb-ade1-25da62963bd6"
);
```

### Fetching a Collection of Resources:

```typescript
// fetch a sorted list of published node--resource content.
const resources = await this.drupal.getResourceCollection<DrupalNode[]>(
  "node--resources",
  {
    params: new DrupalJsonApiParams()
      .addFilter("status", "1") // filter out unpublished content.
      .addSort("created", "DESC"), // sort by created date.
  }
);
```

### Fetching Menu Items

The `getMenu` method returns a drupal menu in a tree-like format.

```typescript
const mainMenu = await drupal.getMenu("main");
```

### Fetching View Results

```typescript
// pass contextual filter params to drupal view.
const params = new DrupalJsonApiParams();
params.addCustomParam({ "views-argument": ['11+15+19'] });

const menuView = await drupal.getView("menu--default", { params });
```

---