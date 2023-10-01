import { assert } from "./asset";
import Worker from "../workers/sample_library?worker";
import { wrap } from "comlink";

const worker = new Worker();
const proxy = wrap<import("../workers/sample_library.js").SampleLibrary>(worker);

export async function fetchResource(url: URL): Promise<Response> {
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

