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
const article = await fetcher.getResource<DrupalNode>(
  "node--article",
  "2a8758e2-70a5-4ffb-ade1-25da62963bd6"
);

// fetch a text block paragraph with uuid.
const textBlock = await fetcher.getResource<DrupalParagraph>(
  "paragraph-text_block",
  "2a8758e2-70a5-4ffb-ade1-25da62963bd6"
);
```

### Fetching a Collection of Resources:

```typescript
// fetch a sorted list of published node--resource content.
const resources = await fetcher.getResourceCollection<DrupalNode[]>(
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
const mainMenu = await fetcher.getMenu("main");
```

### Fetching View Results

```typescript
// pass contextual filter params to drupal view.
const params = new DrupalJsonApiParams();
params.addCustomParam({ "views-argument": ["11+15+19"] });

const menuView = await fetcher.getView("menu--default", { params });
```

## Using `drupal-jsonapi-params`

# Using JSON API Params

- We can form requests for specific data from drupal entities, and sort, paginate, filter them as needed using the [drupal-jsonapi-params](https://www.npmjs.com/package/drupal-jsonapi-params) package.
- When making a request for content from Drupal, it is possible to inspect the json output by viewing the logs from the node docker container. See [Guide - Debugging](#debugging)
- Most fields, entities usually have an `id` that can be useful as a `key` prop when mapping through items in React.

## Examples:

Here are a few examples for fetching various fields on a drupal resource:

### Basic usage

Most fields can be accessed simply by adding the field name to the parameters.

- These include title, Text (plain), Boolean, Color etc

```typescript
const params = new DrupalJsonApiParams().addFields("node--resource", [
  "title",
  "field_subtitle",
  "field_theme_color",
  "field_is_enabled",
]);
```

Output:

```tsx
{
  type: 'node--resource',
  title: 'Example Resource',
  field_subtitle: 'Test subtitle value',
  field_theme_color: { color: '#FAFAFA', opacity: null },
  field_is_enabled: false,
}
```

**Note:** some fields may be objects like `field_theme_color` above. These can be accessed in the React component like any other json object.

### Accessing referenced fields

- Some fields are Drupal Entities themselves.
- However, these objects can get really large, so we can request only the required properties as below:

#### Media Entity

```tsx
const params = new DrupalJsonApiParams()
  .addFields("node--resource", ["field_thumbnail"]) // get Media field on Resource content type
  .addInclude(["field_thumbnail", "field_thumbnail.field_media_image"]) // request for that Media Entity, and the nested File Entity.
  .addFields("file--file", ["uri", "resourceIdObjMeta"]); // For that File Entity, get uri and metadata for alt, height, width.
```

**Output:**

```tsx
{
  type: 'media--image',
  field_media_image: {
    type: 'file--file',
    uri: {
      value: 'public://image.jpg',
      url: 'http://site/image-pathimage.jpg'
    },
    resourceIdObjMeta: {
      alt: 'alt',
      title: '',
      width: 640,
      height: 960,
    }
  },
}
```

#### Taxonomy Term

- Access data for a taxonomy vocabulary called "Audience", referenced in the `field_audience`:

```tsx
const params = new DrupalJsonApiParams()
  .addFields("node--resource", ["field_audience"]) // get taxonomy field on Resource content type
  .addInclude(["field_audience"]) // request for that taxonomy entity's data
  .addFields("taxonomy_term--audience", ["name", "path"]); // For that Taxonomy Entity, get name, path, or any other fields
```

**Output:**

```tsx
{
  type: 'node--resource',
  field_audience: {
    type: 'taxonomy_term--audience',
    id: '345feac2-e262-4298-91d3-c7d965c73f56',
    name: 'Students',
    path: { alias: '/students', pid: 3, langcode: 'en' },
  },
}
```

---
