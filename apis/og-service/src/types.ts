export interface OGImageParams {
    title: string;
    description?: string;
    type?: 'default' | 'article' | 'about' | 'alternative';
    theme?: 'light' | 'dark';
}

export interface OGImageResponse {
    image: Buffer;
    contentType: string;
    cacheKey: string;
}
