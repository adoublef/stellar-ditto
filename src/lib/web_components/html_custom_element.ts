export interface HTMLCustomElementConstructor<T extends HTMLCustomElement = HTMLCustomElement> {
    new(...args: any[]): T;
    observedAttributes?: string[];
}

export interface HTMLCustomElement extends HTMLElement {
    connectedCallback?(): void;
    disconnectedCallback?(): void;
    attributeChangedCallback?(name: string, oldValue: string | null, value: string | null): void;
}

export function register<
    C extends HTMLCustomElementConstructor
>(ctor: C): C {
    const name = dasherize(ctor.name).replace(/-element$/, '');

    if (
        !customElements.get(name)
    ) {
        customElements.define(name, ctor);
    }

    return ctor;
}

export const dasherize = (str: unknown): string =>
    String(typeof str === 'symbol' ? str.description : str)
        .replace(/([A-Z]($|[a-z]))/g, '-$1')
        .replace(/--/g, '-')
        .replace(/^-|-$/, '')
        .toLowerCase();