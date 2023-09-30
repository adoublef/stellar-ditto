import SampleLibrary from "./sample-library.ts?worker";
import { wrap } from "comlink";

const sampleLibrary = new SampleLibrary();
const proxy = wrap<import("./sample-library").SampleLibrary>(sampleLibrary);

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

interface HTMLCustomElementConstructor<T extends HTMLCustomElement = HTMLCustomElement> {
    new(...args: any[]): T;
    observedAttributes?: string[];
}

interface HTMLCustomElement extends HTMLElement {
    connectedCallback?(): void;
    disconnectedCallback?(): void;
    attributeChangedCallback?(name: string, oldValue: string | null, value: string | null): void;
}

function parseUrl(url: string): URL {
    if (
        url.match(/^(https?|file):\/\//i)
    ) {
        return new URL(url);
    }
    return new URL(url, location.href);
};

async function fetchResource(url: URL): Promise<Response> {
    if (
        // NOTE -- maybe use regex /^(https?):\/\//i
        assert(url.protocol, "http:") ||
        assert(url.protocol, "https:")
    ) {
        // maybe check the response header here?
        return await fetch(url);
    } else if (
        // NOTE -- /^(file):\/\//i
        assert(url.protocol, "file:")
    ) {
        // TODO -- origin private file system 
        const [, ...src] = (decodeURI(new URL(url).pathname));
        const file = await proxy.fetch(src.join(""));

        // res.setHeader('Cache-Control', 'public, max-age=3600');
        const headers = new Headers([
            ["Content-Type", file.type],
            ["Content-Length", file.size.toString()],
            ["Content-Disposition", `attachment; filename="${file.name}"`]
        ]);

        return new Response(file, { headers });
    }

    throw new Error(`unsupported protocol ${url.protocol}`);
};

function assert<T extends unknown>(a: T, b: T): boolean {
    return a === b;
}
