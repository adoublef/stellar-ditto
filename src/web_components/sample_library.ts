import Worker from "../workers/sample_library?worker";
import { wrap } from "comlink";
import { html, render } from "lit-html";

const worker = new Worker();
const proxy = wrap<import("../workers/sample_library.js").SampleLibrary>(worker);

export class SampleLibrary extends HTMLElement {
    declare upload: HTMLFormElement;
    declare file: HTMLInputElement;
    declare mainSlot: HTMLSlotElement;

    #submit = async (e: Event) => {
        e.preventDefault();

        const formData = new FormData(this.upload);
        const { file } = Object.fromEntries(formData) as { file: File; };
        // save file with webWorker
        if (file.size) {
            const bytes = await proxy.save(file);
            alert(`success writing ${bytes} bytes to file`);
            // NOTE -- this is kinda wasteful
            this.#renderList()
        }
    };

    async #renderList(): Promise<void> {
        const nodes = (await proxy.list()).map(src => {
            const [, ...rest] = (decodeURI(new URL(src).pathname));

            return html`
            <div 
                @dragstart=${(e: DragEvent) => e.dataTransfer?.setData("text/plain", src)} 
                draggable="true" 
                slot="library" 
            >
                ${rest.join("")}
            </div>`;
        });

        return void render(nodes, this);
    }

    async connectedCallback() {
        this.upload = this.#query("form");
        this.upload.onsubmit = this.#submit;

        this.file = this.#query("input[name=file]");

        this.mainSlot = this.#query("slot[name=library]");
        // listen to customEvent
        this.#renderList();
    }

    #query<T extends HTMLElement>(selector: string): T {
        return (this.shadowRoot ?? this).querySelector(selector) as T;
    }
}
customElements.define("sample-library", SampleLibrary);
