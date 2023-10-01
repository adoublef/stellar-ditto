import { loadable } from "../lib/web_components/loadable.ts";

const audioContext = new AudioContext();

@loadable
export class SamplePlayer extends HTMLElement {
    declare cta: HTMLButtonElement;

    declare buffer: AudioBuffer;

    async load(response: Response): Promise<void> {
        const arrayBuffer = await response.arrayBuffer();
        this.buffer = await audioContext.decodeAudioData(arrayBuffer);

        const filename = parseContentDisposition(response);
        if (
            filename
        ) {
            this.cta.innerText = filename;
        }
    }

    #play = async () => {
        try {
            const buffer = this.buffer;
            const source = new AudioBufferSourceNode(audioContext, { buffer });

            source.connect(audioContext.destination);
            source.start();
        } catch (error) {
            // @ts-expect-error
            console.error(`error found: ${error.message}`);
        }
    };

    #dragOver = (e: DragEvent) => e.preventDefault();

    #drop = (e: DragEvent) => {
        e.preventDefault();
        // dropEffect
        const src = e.dataTransfer?.getData("text/plain");
        this.setAttribute("src", `${src}`);
    };

    connectedCallback() {
        this.cta = this.#query("button");
        this.cta.onclick = this.#play;

        this.addEventListener("drop", this.#drop);
        this.addEventListener("dragover", this.#dragOver);
    }

    #query<T extends HTMLElement>(selector: string): T {
        return (this.shadowRoot ?? this).querySelector(selector) as T;
    }
}
customElements.define("sample-player", SamplePlayer);

/* parse */
function parseContentDisposition(response: Response) {
    const contentDisposition = response.headers.get("content-disposition");
    const matches = /filename="([^"]+)"/.exec(contentDisposition ?? "");
    if (matches && matches.length > 1) {
        return matches[1];
    }
    return null;
}