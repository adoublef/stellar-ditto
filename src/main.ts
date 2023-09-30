import { loadable } from "./loadable";
import SampleLibrary from "./sample-library.ts?worker";
import { wrap } from "comlink";

const sampleLibrary = new SampleLibrary();
const proxy = wrap<import("./sample-library").SampleLibrary>(sampleLibrary);

class SampleUploader extends HTMLElement {
    declare upload: HTMLFormElement;
    declare file: HTMLInputElement;
    declare mainSlot: HTMLSlotElement;

    #submit = async (e: Event) => {
        e.preventDefault();

        const formData = new FormData(this.upload);
        const { file } = Object.fromEntries(formData) as { file: File; };
        // save file with webWorker
        if (file.size) {
            const bytes = await proxy.save(file, { filename: "kick.wav" });
            alert(`success writing ${bytes} bytes to file`);

            // dispatchEvent
        }
    };

    async #list(): Promise<string[]> {
        const srcs = await proxy.list();
        return srcs;
    }

    async connectedCallback() {
        console.log("hi");
        this.upload = this.#query("form");
        this.upload.onsubmit = this.#submit;

        this.file = this.#query("input[name=file]");

        this.mainSlot = this.#query("slot[name=library]");
        // listen to customEvent
        const srcs = await this.#list();

        for (const src of srcs) {

            const div = document.createElement("div");

            const [, ...rest] = (decodeURI(new URL(src).pathname));
            div.innerText = rest.join("");
            div.slot = "library";
            div.setAttribute("draggable", `${true}`);
            div.dataset.src = src;
            div.addEventListener("dragstart", e => {
                const src = (e.target as HTMLElement).dataset.src!;
                ; (e as DragEvent).dataTransfer?.setData("text/plain", src);
            });

            this.append(div);
        }
    }

    #query<T extends HTMLElement>(selector: string): T {
        return (this.shadowRoot ?? this).querySelector(selector) as T;
    }
}
customElements.define("sample-uploader", SampleUploader);


const audioContext = new AudioContext();

@loadable
class SamplePlayer extends HTMLElement {
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

document.querySelectorAll("[slot=sample]").forEach(el => {
    el.addEventListener("dragstart", e => {
        const src = (e.target as HTMLElement).dataset.src!;
        ; (e as DragEvent).dataTransfer?.setData("text/plain", src);
    });
});

/* parse */
function parseContentDisposition(response: Response) {
    const contentDisposition = response.headers.get("content-disposition");
    const matches = /filename="([^"]+)"/.exec(contentDisposition ?? "");
    if (matches && matches.length > 1) {
        return matches[1];
    }
    return null;
}