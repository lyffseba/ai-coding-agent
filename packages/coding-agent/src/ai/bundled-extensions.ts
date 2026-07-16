import { join } from "node:path";
import { getPackageDir } from "../config.ts";

/** ai extensions always loaded unless --no-extensions is set */
export function getBundledAiExtensions(): string[] {
	const base = join(getPackageDir(), "ai", "extensions");
	return [
		join(base, "mode.ts"),
		join(base, "memory.ts"),
		join(base, "telemetry.ts"),
		join(base, "play.ts"),
	];
}