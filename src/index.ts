/**
 * DrupalFetch
 * ---
 * Helper functions to fetch JSON:API resources from a Drupal site.
 * @author Tariq Saiyad <tariqsaiyad98@gmail.com>
 */

import { DrupalJsonApiParams } from "drupal-jsonapi-params";
import { Jsona } from "jsona";
import { stringify } from "qs";
import {
  JsonApiOptions,
  DrupalFetchOptions,
  JsonApiResource,
  DrupalPathData,
  JsonApiResponse,
  DrupalMenuItem,
  DrupalView,
  Locale,
} from "./types";
import { TJsonApiBody } from "jsona/lib/JsonaTypes";

const DEFAULT_API_PREFIX = "/jsonapi";
const DEFAULT_FETCH_OPTIONS: JsonApiOptions = {};

/**
 * Represents a DrupalFetch client for fetching resources from a Drupal site.
 */
export class DrupalFetch {
  baseUrl: string;
  private debug = false;
  private apiPrefix = DEFAULT_API_PREFIX;
  private serialiser = new Jsona();

  /**
   * Instantiates a new DrupalFetch client.
   * @param {string} baseUrl - The Drupal site base URL (e.g. https://admin.demo-site.com).
   * @param {DrupalFetchOptions} options - Options for the client.
   */
  constructor(baseUrl: string, options: DrupalFetchOptions = {}) {
    if (!baseUrl || typeof baseUrl !== "string") {
      throw new Error("The 'baseUrl' param is required.");
    }

    const { debug = false, apiPrefix = DEFAULT_API_PREFIX } = options;

    this.baseUrl = baseUrl;
    this.debug = debug;
    this.apiPrefix = apiPrefix;

    this._debug("Debug mode is on.");
  }

  /**
   * Fetches a single drupal resource of the specified type and UUID.
   * @param {string} type - The type of the resource.
   * @param {string} uuid - The UUID of the resource.
   * @param {JsonApiOptions} - Options for the fetch operation.
   * @returns {Promise<T>} A Promise that resolves to the fetched resource.
   */
  async getResource<T extends JsonApiResource>(type: string, uuid: string, options: JsonApiOptions = DEFAULT_FETCH_OPTIONS): Promise<T> {
    const apiPath = await this.getResourceEndpoint(type, options.locale);

    if (options.params && options.version) {
      options.params.addCustomParam({ resourceVersion: options.version });
    }

    const url = this.buildUrl(`${apiPath}/${uuid}`, options?.params);

    this._debug(`Fetching resource ${type} with id ${uuid}.`);
    this._debug(url.toString());

    const response = await fetch(url.toString(), options.fetchOptions);

    if (!response?.ok) await this.handleApiError(response);

    const json = await response.json();

    return this.deserialize(json) as T;
  }

  /**
   * Fetches a collection of resources of the specified type.
   * @param {string} type - The type of resources.
   * @param {JsonApiOptions} - Options for the fetch operation.
   * @returns {Promise<T>} A Promise that resolves to the fetched resource collection.
   */
  async getResourceCollection<T = JsonApiResource[]>(type: string, options: JsonApiOptions = DEFAULT_FETCH_OPTIONS): Promise<T> {
    const apiPath = await this.getResourceEndpoint(type, options.locale);

    const url = this.buildUrl(apiPath, options?.params);

    this._debug(`Fetching resource collection of type ${type}`);
    this._debug(url.toString());

    const response = await fetch(url.toString(), options.fetchOptions);

    if (!response?.ok) await this.handleApiError(response);

    const json = await response.json();

    return this.deserialize(json) as T;
  }

  /**
   * Retrieves static paths for the specified resource types.
   * @param {string|string[]} types - The type(s) of the resources.
   * @returns {Promise<string[][]>} A Promise that resolves to an array of paths.
   */
  async getStaticPaths(types: string | string[]): Promise<string[][]> {
    if (typeof types === "string") types = [types];

    const paths = await Promise.all(
      types.map(async (type) => {
        const resources = await this.getResourceCollection<JsonApiResource[]>(
          type,
          {
            params: new DrupalJsonApiParams().addFields(type, ["path"]),
          }
        );

        return resources.map(({ path }) => path.alias.slice(1).split("/"));
      })
    );

    return paths.flat();
  }

  /**
   * Retrieves additional path data for the specified path.
   * @param {string} path - The path to fetch.
   * @param {JsonApiOptions} - Options for the fetch operation.
   * @returns {Promise<DrupalPathData|null>} A Promise that resolves to the path data, or null if not found.
   */
  async getPathData(path: string, options: JsonApiOptions = DEFAULT_FETCH_OPTIONS): Promise<DrupalPathData | null> {
    const params = new DrupalJsonApiParams();
    params.addCustomParam({ path });

    const url = this.buildUrl("/router/translate-path", params);

    const response = await fetch(url.toString(), options.fetchOptions);

    // to be caught by the app for custom error handling. eg. show page not found.
    if (!response?.ok) return null;

    return await response.json();
  }

  /**
   * Retrieves the JSON:API index.
   * @returns {Promise<JsonApiResponse|null>} A Promise that resolves to the JSON:API index, or null if the fetch operation fails.
   */
  async getIndex(): Promise<JsonApiResponse | null> {
    const url = this.buildUrl(this.apiPrefix);

    try {
      const response = await fetch(url.toString());
      return await response.json();
    } catch (error: any) {
      new Error(`Failed to fetch JSON:API index at ${url.toString()} - ${error.message}`);
    }
    return null;
  }

  /**
   * Retrieves the menu items for the specified menu.
   * @param {string} name - The name of the menu.
   * @param {JsonApiOptions} - Options for the fetch operation.
   * @returns {Promise<DrupalMenuItem[]>} A Promise that resolves to the menu items.
   */
  async getMenu(name: string, options: JsonApiOptions = DEFAULT_FETCH_OPTIONS): Promise<DrupalMenuItem[]> {
    const url = this.buildUrl(`${this.apiPrefix}/menu_items/${name}`, options?.params);

    this._debug(`Fetching menu items for ${name}.`);
    this._debug(url.toString());

    const response = await fetch(url.toString(), options.fetchOptions);

    if (!response?.ok) await this.handleApiError(response);

    const data = await response.json();

    const items = this.deserialize(data) as DrupalMenuItem[];
    return this.buildMenuTree(items);
  }

  /**
   * Retrieves the drupal view results for the specified view params.
   * @param {string} name - The name of the view.
   * @param {JsonApiOptions} - Options for the fetch operation.
   * @returns {Promise<DrupalView<T>>} A Promise that resolves to the view results.
   */
  async getView<T = JsonApiResource>(name: string, options: JsonApiOptions = DEFAULT_FETCH_OPTIONS): Promise<DrupalView<T>> {
    const [viewId, displayId] = name.split("--");
    const url = this.buildUrl(`${this.apiPrefix}/views/${viewId}/${displayId}`, options?.params);
    const response = await fetch(url.toString(), options.fetchOptions);

    if (!response?.ok) await this.handleApiError(response);

    const data = await response.json();
    const results = this.deserialize(data) as T;

    return {
      id: name,
      results,
      meta: data.meta,
      links: data.links,
    };
  }

  /**
   * Retrieves the endpoint URL for the specified resource type and locale.
   * @param {string} type - The type of the resource.
   * @param {Locale} [locale] - The locale of the resource.
   * @returns {Promise<string>} A Promise that resolves to the endpoint URL.
   */
  private async getResourceEndpoint(type: string, locale?: Locale): Promise<string> {
    const index = await this.getIndex();

    const link = index?.links?.[type] as { href: string };

    if (!link) console.error(`Resource of type '${type}' and locale ${locale} not found.`);

    return link?.href;
  }

  /**
   * Builds a hierarchical menu tree from a flat array of menu items.
   * @param {DrupalMenuItem[]} links - The flat array of menu items.
   * @param {string} - The ID of the parent menu item.
   * @returns {DrupalMenuItem[]} The hierarchical menu tree.
   */
  private buildMenuTree(links: DrupalMenuItem[], parent: DrupalMenuItem["id"] = ""): DrupalMenuItem[] {
    if (!links?.length) return [];

    const children = links.filter((link) => link?.parent === parent);
    return children.length
      ? children.map((link) => ({
        ...link,
        items: this.buildMenuTree(links, link.id),
      }))
      : [];
  }

  /**
   * Builds a URL with the given path and optional parameters.
   * @param {string} path - The base path for the URL.
   * @param {DrupalJsonApiParams} [params] - The parameters for the URL.
   * @returns {URL} The built URL with all params included.
   */
  private buildUrl(path: string, params?: DrupalJsonApiParams): URL {
    const url = new URL(
      path.charAt(0) === "/" ? `${this.baseUrl}${path}` : path
    );

    if (params) url.search = stringify(params.getQueryObject());

    url.protocol='https'
    return url;
  }

  /**
   * Deserializes a JSON API response using the Jsona deserializer.
   */
  private deserialize(body: string | TJsonApiBody, options?: any) {
    if (!body) return null;

    return this.serialiser.deserialize(body, options);
  }

  /**
   * Logs a debug message if debug mode is enabled.
   * @param {string} message
   */
  private _debug(message: string) {
    if (!this.debug) return;
    console.debug(`[debug]  ${message}`);
  }

  /**
   * Handles JSON API errors in the response.
   * @param {Response} response - The response to handle errors for.
   * @throws {Error} If the response status is not ok.
   */
  private async handleApiError(response: Response) {
    if (!response?.ok) {
      throw new Error(response.statusText);
    }
  }
}
