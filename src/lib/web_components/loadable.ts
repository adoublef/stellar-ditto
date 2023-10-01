import { assert } from "../../lib/asset.ts";
import { fetchResource } from "../../lib/fetch_response.ts";
import { parseUrl } from "../../lib/parse_url.ts";
import { HTMLCustomElement, HTMLCustomElementConstructor } from "./html_custom_element";

interface LoadableElement extends HTMLCustomElement {
    src: string;
    load: (response: Response) => Promise<void>;
}

export function loadable<
    C extends HTMLCustomElementConstructor<
        HTMLCustomElement & Pick<LoadableElement, keyof HTMLElement | "load">
    >
>(
    ctor: C
): C {
    return class extends ctor {
        static get observedAttributes(): string[] {
            return ["src", ...(ctor.observedAttributes ?? [])];
        }

        set src(value: string) {
            this.setAttribute("src", value);
        }

        get src(): string {
            return this.getAttribute("src") ?? "";
        }

        constructor(...args: any[]) {
            super(...args);
        }

        attributeChangedCallback(name: string, oldValue: string | null, value: string | null): void {
            // check the value has changed
            // check name of 
            if (
                assert(name, "src") &&
                value !== null &&
                value !== oldValue
            ) {
                const url = parseUrl(value);
                this.#load(url);
            }

            super.attributeChangedCallback?.(name, oldValue, value);
        }

        async #load(url: URL) {
            this.dispatchEvent(new Event("loadstart"));
            try {
                const response = await fetchResource(url);
                this.dispatchEvent(new Event("load"));
                await super.load(response);
            } catch (error) {
                this.dispatchEvent(new Event("error"));
                // @ts-expect-error
                throw new Error(`failed to fetch ${error.message}`);
            } finally {
                this.dispatchEvent(new Event("loadend"));
            }
        }
    };
}

