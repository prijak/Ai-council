import { n as __toESM, t as require_binding } from "./shared/binding-eAM5CAoo.mjs";
import { n as onExit, t as watch } from "./shared/watch-C6wffQAJ.mjs";
import "./shared/normalize-string-or-regex-Dqznrk6L.mjs";
import { b as VERSION, y as RUNTIME_MODULE_ID } from "./shared/bindingify-input-options-BAtaPAL4.mjs";
import "./shared/rolldown-build-CZ74hiRH.mjs";
import "./shared/error-CpxG7etL.mjs";
import "./shared/parse-cfElc8c8.mjs";
import { t as rolldown } from "./shared/rolldown-CV3Yxv82.mjs";
import { t as defineConfig } from "./shared/define-config-B-Hn45NS.mjs";
import { isMainThread } from "node:worker_threads";

//#region src/setup.ts
var import_binding = /* @__PURE__ */ __toESM(require_binding(), 1);
if (isMainThread) {
	const subscriberGuard = (0, import_binding.initTraceSubscriber)();
	onExit(() => {
		subscriberGuard?.close();
	});
}

//#endregion
//#region src/api/build.ts
/**
* The API similar to esbuild's `build` function.
*
* @example
* ```js
* import { build } from 'rolldown';
*
* const result = await build({
*   input: 'src/main.js',
*   output: {
*     file: 'bundle.js',
*   },
* });
* console.log(result);
* ```
*
* @experimental
* @category Programmatic APIs
*/
async function build(options) {
	if (Array.isArray(options)) return Promise.all(options.map((opts) => build(opts)));
	else {
		const { output, write = true, ...inputOptions } = options;
		const build = await rolldown(inputOptions);
		try {
			if (write) return await build.write(output);
			else return await build.generate(output);
		} finally {
			await build.close();
		}
	}
}

//#endregion
var BindingMagicString = import_binding.BindingMagicString;
export { BindingMagicString, RUNTIME_MODULE_ID, VERSION, build, defineConfig, rolldown, watch };