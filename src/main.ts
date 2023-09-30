import SampleLibrary from "./sample-library.ts?worker";
import { wrap } from "comlink";

const sampleLibrary = new SampleLibrary();
const proxy = wrap<import("./sample-library").SampleLibrary>(sampleLibrary);

class SampleUploader extends HTMLElement {
    declare upload: HTMLFormElement;
    declare file: HTMLInputElement;

    #submit = async (e: Event) => {
        e.preventDefault();

        const formData = new FormData(this.upload);
        const { file } = Object.fromEntries(formData) as { file: File; };
        // save file with webWorker
        if (file.size) {
            const bytes = await proxy.save(file, { filename: "kick.wav" });
            alert(`success writing ${bytes} bytes to file`);
        }
    };

    connectedCallback() {
        this.upload = this.#query("form");
        this.upload.onsubmit = this.#submit;

        this.file = this.#query("input[name=file]");
    }

    #query<T extends HTMLElement>(selector: string): T {
        return (this.shadowRoot ?? this).querySelector(selector) as T;
    }
}
customElements.define("sample-uploader", SampleUploader);

class SamplePlayer extends HTMLElement {
    declare cta: HTMLButtonElement;

    src = "";

    static get observedAttributes(): string[] {
        return ["src"];
    }

    #play = async () => {
        // src cannot be empty
        if (!this.src) return;

        const [_slash, ...src] = (decodeURI(new URL(this.src).pathname));
        try {
            const file = await proxy.play(src.join(""));
            const audioContext = new AudioContext();
            const fileData = await file.arrayBuffer();
            const buffer = await audioContext.decodeAudioData(fileData);

            const source = new AudioBufferSourceNode(audioContext, { buffer });

            source.connect(audioContext.destination);
            source.start();
        } catch (error) {
            // @ts-expect-error
            console.error(`error found: ${error.message}`);
        }
    };

    connectedCallback() {
        this.cta = this.#query("button");
        this.cta.onclick = this.#play;
    }

    attributeChangedCallback(
        name: string,
        _oldValue: string | null,
        value: string | null,
    ) {
        if (
            name === "src" &&
            !!value
        ) {
            this.src = value;
        }
    }

    #query<T extends HTMLElement>(selector: string): T {
        return (this.shadowRoot ?? this).querySelector(selector) as T;
    }
}
customElements.define("sample-player", SamplePlayer);
