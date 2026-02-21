import { n as __toESM, t as require_binding } from "./binding-eAM5CAoo.mjs";
import { a as bindingifySourcemap, n as normalizeBindingError } from "./error-CpxG7etL.mjs";

//#region src/utils/minify.ts
var import_binding = /* @__PURE__ */ __toESM(require_binding(), 1);
/**
* Minify asynchronously.
*
* Note: This function can be slower than `minifySync` due to the overhead of spawning a thread.
*
* @experimental
*/
async function minify(filename, sourceText, options) {
	const inputMap = bindingifySourcemap(options?.inputMap);
	const result = await (0, import_binding.minify)(filename, sourceText, options);
	if (result.map && inputMap) result.map = {
		version: 3,
		...(0, import_binding.collapseSourcemaps)([inputMap, bindingifySourcemap(result.map)])
	};
	return result;
}
/**
* Minify synchronously.
*
* @experimental
*/
function minifySync(filename, sourceText, options) {
	const inputMap = bindingifySourcemap(options?.inputMap);
	const result = (0, import_binding.minifySync)(filename, sourceText, options);
	if (result.map && inputMap) result.map = {
		version: 3,
		...(0, import_binding.collapseSourcemaps)([inputMap, bindingifySourcemap(result.map)])
	};
	return result;
}

//#endregion
//#region src/utils/transform.ts
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
async function transform(filename, sourceText, options, cache) {
	const result = await (0, import_binding.enhancedTransform)(filename, sourceText, options, cache);
	return {
		...result,
		errors: result.errors.map(normalizeBindingError),
		warnings: result.warnings.map((w) => w.field0)
	};
}
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
function transformSync(filename, sourceText, options, cache) {
	const result = (0, import_binding.enhancedTransformSync)(filename, sourceText, options, cache);
	return {
		...result,
		errors: result.errors.map(normalizeBindingError),
		warnings: result.warnings.map((w) => w.field0)
	};
}

//#endregion
export { minifySync as a, minify as i, transform as n, transformSync as r, import_binding as t };