import { DrupalJsonApiParams } from "drupal-jsonapi-params";

export type DrupalFetchOptions = {
  /**
   * Set the JSON:API prefix.
   *
   * * **Default value**: `/jsonapi`
   * * **Required**: *No*
   *
   */
  apiPrefix?: string;

  /**
   * Set debug to true to enable debug messages.
   *
   * * **Default value**: `false`
   * * **Required**: *No*
   *
   */
  debug?: boolean;
};

export type Locale = "en" | "mi";

interface NextFetchRequestConfig {
  revalidate?: number | false;
  tags?: string[];
}

interface NextInit {
  next?: NextFetchRequestConfig | undefined;
}

export type JsonApiOptions = {
  fetchOptions?: NextFetchRequestConfig & RequestInit & NextInit;
  params?: DrupalJsonApiParams;
  locale?: Locale;
  version?: string;
};

// https://jsonapi.org/format/#error-objects
export interface JsonApiError {
  id?: string;
  status?: string;
  code?: string;
  title?: string;
  detail?: string;
  links?: JsonApiLinks;
}

// https://jsonapi.org/format/#document-links
export interface JsonApiLinks {
  [key: string]: string | Record<string, string>;
}

// TODO: any...ugh.
export interface JsonApiResponse extends Record<string, any> {
  jsonapi?: {
    version: string;
    meta: Record<string, any>[];
  };
  data: Record<string, any>[];
  errors: JsonApiError[];
  meta: {
    count: number;
    [key: string]: any;
  };
  links?: JsonApiLinks;
  included?: Record<string, any>[];
}

export interface DrupalPathData {
  resolved: string;
  isHomePath: boolean;
  entity: {
    canonical: string;
    type: string;
    bundle: string;
    id: string;
    uuid: string;
    langcode?: string;
    path?: string;
  };
  label?: string;
  jsonapi: {
    individual: string;
    resourceName: string;
    basePath: string;
    entryPoint: string;
  };
}

export interface DrupalMenuItem {
  description: string;
  enabled: boolean;
  expanded: boolean;
  id: string;
  menu_name: string;
  meta: Record<string, unknown>;
  options: Record<string, unknown>;
  parent: string;
  provider: string;
  route: {
    name: string;
    parameters: Record<string, unknown>;
  };
  title: string;
  type: string;
  url: string;
  weight: string;
  items?: DrupalMenuItem[];
}

export type PathAlias = {
  alias: string;
  pid: number;
  langcode: string;
};

export interface JsonApiResource extends Record<string, any> {
  id: string;
  type: string;
  langcode: string;
  status: boolean;
  path: PathAlias;
}

export interface PreviewOptions {
  errorMessages?: {
    secret?: string;
    slug?: string;
  };
}

export interface DrupalNode extends JsonApiResource {
  drupal_internal__nid: number;
  drupal_internal__vid: number;
  changed: string;
  created: string;
  title: string;
  default_langcode: boolean;
  sticky: boolean;
}

export interface DrupalParagraph extends JsonApiResource {
  drupal_internal__id: number;
  drupal_internal__revision_id: number;
}

export interface DrupalBlock extends JsonApiResource {
  info: string;
}

export interface DrupalMedia extends JsonApiResource {
  drupal_internal__mid: string;
  drupal_internal__vid: string;
  changed: string;
  created: string;
  name: string;
}

export interface DrupalFile extends JsonApiResource {
  drupal_internal__fid: string;
  changed: string;
  created: string;
  filename: string;
  uri: {
    value: string;
    url: string;
  };
  filesize: number;
  filemime: string;
  resourceIdObjMeta?: DrupalFileMeta;
}

export interface DrupalFileMeta {
  alt?: string;
  title?: string;
  width: number;
  height: number;
}

export interface DrupalTaxonomyTerm extends JsonApiResource {
  drupal_internal__tid: string;
  changed: string;
  default_langcode: boolean;
  name: string;
  description: string;
  weight: number;
}

export interface DrupalUser extends JsonApiResource {
  drupal_internal__uid: string;
  changed: string;
  created: string;
  default_langcode: boolean;
  name: string;
}

export interface DrupalView<T = Record<string, any>[]> {
  id: string;
  results: T;
  meta: JsonApiResponse["meta"];
  links: JsonApiResponse["links"];
}
