import { expose } from "comlink";

export class SampleLibrary {
    async save(f: File, opts?: { filename: string; }): Promise<number> {
        try {
            const root = await navigator
                .storage
                .getDirectory();

            const filename = encodeURI((opts?.filename ?? f.name).toLowerCase());
            console.log(filename)
            const draftFile = await root
                .getFileHandle(filename, { create: true });

            const accessHandle = await draftFile
                .createSyncAccessHandle();

            const buf = await f.arrayBuffer();
            const view = new DataView(buf);

            const size = accessHandle.write(view);

            // persist changes to disk
            accessHandle.flush();

            // NOTE -- should go in a finally block
            accessHandle.close();

            return size;
        } catch (error) {
            // @ts-expect-error
            throw new Error(`failed to save to disk: ${error.message}`);
        }
    }

    async list(): Promise<string[]> {
        try {
            const root = await navigator
                .storage
                .getDirectory();

            const srcs = [];
            for await (const handle of root.values()) {
                if (handle.kind === "file") {
                    // get file
                    const href = new URL(handle.name, "file://").href;
                    srcs.push(href);
                }
            }

            return srcs;
        } catch (error) {
            // @ts-expect-error
            throw new Error(`failed to read directory: ${error.message}`);
        }
    }

    async fetch(src: string): Promise<File> {
        try {
            const root = await navigator
                .storage
                .getDirectory();

            const fileHandle = await root
                .getFileHandle(encodeURI(src));

            const f = await fileHandle.getFile();

            return f;
        } catch (error) {
            // @ts-expect-error
            throw new Error(`failed to read file: ${error.message}`);
        }
    }
}


expose(new SampleLibrary(), self);