"use strict";
import { CodeStreamAgent } from "./agent";
// import { Telemetry } from './telemetry';

// const ConsolePrefix = `[CodeStreamAgent]`;

export enum TraceLevel {
	Silent = "silent",
	Errors = "errors",
	Verbose = "verbose",
	Debug = "debug"
}

export class Logger {
	static level: TraceLevel = TraceLevel.Silent;
	private static _agent: CodeStreamAgent | undefined;

	static initialize(agent: CodeStreamAgent) {
		this._agent = agent;
	}

	static debug(message?: any, ...params: any[]): void {
		// if (Logger.isDebugging) {
		// 	console.log(this.timestamp, ConsolePrefix, message || "", ...params);
		// }

		if (this.level !== TraceLevel.Debug && !Logger.isDebugging) return;

		if (this._agent !== undefined) {
			this._agent.log(`${this.timestamp} ${message || ""} ${this.toLoggableParams(true, params)}`);
		}
	}

	static error(ex: Error, message?: string, ...params: any[]): void {
		// if (Logger.isDebugging) {
		// 	console.error(this.timestamp, ConsolePrefix, message || "", ...params, ex);
		// }

		if (this.level === TraceLevel.Silent && !Logger.isDebugging) return;

		if (this._agent !== undefined) {
			this._agent.error(
				`${this.timestamp} ${message || ""} ${this.toLoggableParams(false, params)}\n${ex}`
			);
		}

		// Telemetry.trackException(ex);
	}

	static log(message?: any, ...params: any[]): void {
		// if (Logger.isDebugging) {
		// 	console.log(this.timestamp, ConsolePrefix, message || "", ...params);
		// }

		if (
			this.level !== TraceLevel.Verbose &&
			this.level !== TraceLevel.Debug &&
			!Logger.isDebugging
		) {
			return;
		}

		if (this._agent !== undefined) {
			this._agent.log(`${this.timestamp} ${message || ""} ${this.toLoggableParams(false, params)}`);
		}
	}

	static logWithDebugParams(message?: any, ...params: any[]): void {
		// if (Logger.isDebugging) {
		// 	console.log(this.timestamp, ConsolePrefix, message || "", ...params);
		// }

		if (
			this.level !== TraceLevel.Verbose &&
			this.level !== TraceLevel.Debug &&
			!Logger.isDebugging
		) {
			return;
		}

		if (this._agent !== undefined) {
			this._agent.log(`${this.timestamp} ${message || ""} ${this.toLoggableParams(true, params)}`);
		}
	}

	static warn(message?: any, ...params: any[]): void {
		// if (Logger.isDebugging) {
		// 	console.warn(this.timestamp, ConsolePrefix, message || "", ...params);
		// }

		if (this.level === TraceLevel.Silent && !Logger.isDebugging) return;

		if (this._agent !== undefined) {
			this._agent.warn(
				`${this.timestamp} ${message || ""} ${this.toLoggableParams(false, params)}`
			);
		}
	}

	static sanitizeSerializableParam(key: string, value: any) {
		return /(password|token)/i.test(key) ? `<${key}>` : value;
	}

	private static get timestamp(): string {
		const now = new Date();
		return `[${now
			.toISOString()
			.replace(/T/, " ")
			.replace(/\..+/, "")}:${("00" + now.getUTCMilliseconds()).slice(-3)}]`;
	}

	private static toLoggableParams(debugOnly: boolean, params: any[]) {
		if (
			params.length === 0 ||
			(debugOnly && this.level !== TraceLevel.Debug && !Logger.isDebugging)
		) {
			return "";
		}

		const loggableParams = params
			.map(p => {
				if (typeof p !== "object") return String(p);

				try {
					return JSON.stringify(p, this.sanitizeSerializableParam);
				} catch {
					return `<error>`;
				}
			})
			.join(", ");

		return loggableParams || "";
	}

	private static _isDebugging: boolean | undefined;
	static get isDebugging() {
		if (this._isDebugging === undefined) {
			const env = process.env;
			this._isDebugging =
				env && env.DEBUG_EXT ? env.DEBUG_EXT.toLowerCase().includes("codestream") : false;
		}

		return this._isDebugging;
	}

	static overrideIsDebugging() {
		this._isDebugging = true;
	}
}
