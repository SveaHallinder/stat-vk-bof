declare module 'morgan' {
  import { RequestHandler } from 'express';
  type FormatFn = (tokens: any, req: any, res: any) => string;
  type Format = string | FormatFn;
  interface Options {
    skip?: (req: any, res: any) => boolean;
    stream?: NodeJS.WritableStream;
  }
  function morgan(format: Format, options?: Options): RequestHandler;
  export = morgan;
}

