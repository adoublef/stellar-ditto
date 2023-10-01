export function parseUrl(url: string): URL {
    if (
        url.match(/^(https?|file):\/\//i)
    ) {
        return new URL(url);
    }
    return new URL(url, location.href);
};
