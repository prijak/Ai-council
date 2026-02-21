import "./shared/binding-eAM5CAoo.mjs";
import { l as locate, n as error, s as logParseError, t as augmentCodeLocation, u as getCodeFrame } from "./shared/logs-COHDsWqD.mjs";
import { n as parseSync, t as parse } from "./shared/parse-cfElc8c8.mjs";

//#region src/parse-ast-index.ts
function wrap(result, filename, sourceText) {
	if (result.errors.length > 0) return normalizeParseError(filename, sourceText, result.errors);
	return result.program;
}
function normalizeParseError(filename, sourceText, errors) {
	let message = `Parse failed with ${errors.length} error${errors.length < 2 ? "" : "s"}:\n`;
	const pos = errors[0]?.labels?.[0]?.start;
	for (let i = 0; i < errors.length; i++) {
		if (i >= 5) {
			message += "\n...";
			break;
		}
		const e = errors[i];
		message += e.message + "\n" + e.labels.map((label) => {
			const location = locate(sourceText, label.start, { offsetLine: 1 });
			if (!location) return;
			return getCodeFrame(sourceText, location.line, location.column);
		}).filter(Boolean).join("\n");
	}
	const log = logParseError(message, filename, pos);
	if (pos !== void 0 && filename) augmentCodeLocation(log, pos, sourceText, filename);
	return error(log);
}
const defaultParserOptions = {
	lang: "js",
	preserveParens: false
};
function parseAst(sourceText, options, filename) {
	return wrap(parseSync(filename ?? "file.js", sourceText, {
		...defaultParserOptions,
		...options
	}), filename, sourceText);
}
async function parseAstAsync(sourceText, options, filename) {
	return wrap(await parse(filename ?? "file.js", sourceText, {
		...defaultParserOptions,
		...options
	}), filename, sourceText);
}

//#endregion
export { parseAst, parseAstAsync };