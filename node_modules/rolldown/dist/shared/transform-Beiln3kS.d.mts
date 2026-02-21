import { a as RolldownLog } from "./logging-CKYae7lu.mjs";
import { I as ParseResult, L as ParserOptions, N as MinifyOptions$1, P as MinifyResult, U as TsconfigCache, V as SourceMap, a as BindingEnhancedTransformOptions, o as BindingEnhancedTransformResult } from "./binding-B4HaVp87.mjs";

//#region src/utils/parse.d.ts
/**
* Parse JS/TS source asynchronously on a separate thread.
*
* Note that not all of the workload can happen on a separate thread.
* Parsing on Rust side does happen in a separate thread, but deserialization of the AST to JS objects
* has to happen on current thread. This synchronous deserialization work typically outweighs
* the asynchronous parsing by a factor of between 3 and 20.
*
* i.e. the majority of the workload cannot be parallelized by using this method.
*
* Generally `parseSync` is preferable to use as it does not have the overhead of spawning a thread.
* If you need to parallelize parsing multiple files, it is recommended to use worker threads.
*/
declare function parse(filename: string, sourceText: string, options?: ParserOptions | null): Promise<ParseResult>;
/**
* Parse JS/TS source synchronously on current thread.
*
* This is generally preferable over `parse` (async) as it does not have the overhead
* of spawning a thread, and the majority of the workload cannot be parallelized anyway
* (see `parse` documentation for details).
*
* If you need to parallelize parsing multiple files, it is recommended to use worker threads
* with `parseSync` rather than using `parse`.
*/
declare function parseSync(filename: string, sourceText: string, options?: ParserOptions | null): ParseResult;
//#endregion
//#region src/utils/minify.d.ts
type MinifyOptions = MinifyOptions$1 & {
  inputMap?: SourceMap;
};
/**
* Minify asynchronously.
*
* Note: This function can be slower than `minifySync` due to the overhead of spawning a thread.
*
* @experimental
*/
declare function minify(filename: string, sourceText: string, options?: MinifyOptions | null): Promise<MinifyResult>;
/**
* Minify synchronously.
*
* @experimental
*/
declare function minifySync(filename: string, sourceText: string, options?: MinifyOptions | null): MinifyResult;
//#endregion
//#region src/utils/transform.d.ts
type TransformResult = Omit<BindingEnhancedTransformResult, "errors" | "warnings"> & {
  errors: Error[];
  warnings: RolldownLog[];
};
/**
* Transpile a JavaScript or TypeScript into a target ECMAScript version, asynchronously.
*
* Note: This function can be slower than `transformSync` due to the overhead of spawning a thread.
*
* @param filename The name of the file being transformed. If this is a
* relative path, consider setting the {@link TransformOptions#cwd} option.
* @param source_text The source code to transform.
* @param options The transform options including tsconfig and inputMap. See {@link
* BindingEnhancedTransformOptions} for more information.
* @param cache Optional tsconfig cache for reusing resolved tsconfig across multiple transforms.
* Only used when `options.tsconfig` is `true`.
*
* @returns a promise that resolves to an object containing the transformed code,
* source maps, and any errors that occurred during parsing or transformation.
*
* @experimental
*/
declare function transform(filename: string, sourceText: string, options?: BindingEnhancedTransformOptions | null, cache?: TsconfigCache | null): Promise<TransformResult>;
/**
* Transpile a JavaScript or TypeScript into a target ECMAScript version.
*
* @param filename The name of the file being transformed. If this is a
* relative path, consider setting the {@link TransformOptions#cwd} option.
* @param source_text The source code to transform.
* @param options The transform options including tsconfig and inputMap. See {@link
* BindingEnhancedTransformOptions} for more information.
* @param cache Optional tsconfig cache for reusing resolved tsconfig across multiple transforms.
* Only used when `options.tsconfig` is `true`.
*
* @returns an object containing the transformed code, source maps, and any errors
* that occurred during parsing or transformation.
*
* @experimental
*/
declare function transformSync(filename: string, sourceText: string, options?: BindingEnhancedTransformOptions | null, cache?: TsconfigCache | null): TransformResult;
//#endregion
export { minify as a, parseSync as c, MinifyOptions as i, transform as n, minifySync as o, transformSync as r, parse as s, TransformResult as t };