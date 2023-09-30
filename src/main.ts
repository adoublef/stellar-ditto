import { loadable } from "./loadable";
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

const audioContext = new AudioContext();

@loadable
class SamplePlayer extends HTMLElement {
    declare cta: HTMLButtonElement;

    declare buffer: AudioBuffer;

    async load(response: Response): Promise<void> {
        const arrayBuffer = await response.arrayBuffer();
        this.buffer = await audioContext.decodeAudioData(arrayBuffer);
    }

    #play = async () => {
        try {
            const buffer = this.buffer
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

    #query<T extends HTMLElement>(selector: string): T {
        return (this.shadowRoot ?? this).querySelector(selector) as T;
    }
}
customElements.define("sample-player", SamplePlayer);
