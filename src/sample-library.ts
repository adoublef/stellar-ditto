import { expose } from "comlink";

export class SampleLibrary {
    async save(f: File, opts?: { filename: string; }): Promise<number> {
        try {
            const root = await navigator
                .storage
                .getDirectory();

            const draftFile = await root
                .getFileHandle(encodeURI((opts?.filename ?? f.name).toLocaleLowerCase()), { create: true });

            const accessHandle = await draftFile
                .createSyncAccessHandle();

            const buf = await f.arrayBuffer();
            const view = new DataView(buf);

            const size = accessHandle.write(view);

            // persist changes to disk
            accessHandle.flush();

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

            const fileNames = [];
            for await (const handle of root.values()) {
                if (handle.kind === "file") {
                    // get file
                    fileNames.push(handle.name);
                }
            }

            return fileNames;
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
                .getFileHandle(src);

            const f = await fileHandle.getFile();

            return f;
        } catch (error) {
            // @ts-expect-error
            throw new Error(`failed to read file: ${error.message}`);
        }
    }
}


expose(new SampleLibrary(), self);