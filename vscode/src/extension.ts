"use strict";
import { ExtensionContext, extensions, version as vscodeVersion, workspace } from "vscode";
import { GitExtension } from "./@types/git";
import { AgentOptions } from "./agent/agentConnection";
import { SessionStatusChangedEvent } from "./api/session";
import { ContextKeys, setContext } from "./common";
import { Config, configuration, Configuration } from "./configuration";
import { extensionQualifiedId } from "./constants";
import { Container } from "./container";
import { Logger } from "./logger";
import { FileSystem, Strings } from "./system";

const extension = extensions.getExtension(extensionQualifiedId)!;
export const extensionVersion = extension.packageJSON.version;

export async function activate(context: ExtensionContext) {
	const start = process.hrtime();

	Configuration.configure(context);
	Logger.configure(context);

	// Check for an optional build number
	let info = { buildNumber: "", assetEnvironment: "dev" };
	try {
		info = await FileSystem.loadJsonFromFile<{ buildNumber: string; assetEnvironment: string }>(
			context.asAbsolutePath(`codestream-${extensionVersion}.info`)
		);
	} catch {}

	const formattedVersion = `${extensionVersion}${info.buildNumber ? `-${info.buildNumber}` : ""}${
		info.assetEnvironment && info.assetEnvironment !== "prod" ? ` (${info.assetEnvironment})` : ""
	}`;
	Logger.log(
		`CodeStream v${formattedVersion} starting ${Logger.isDebugging ? "in debug mode" : ""}...`
	);

	const git = await gitPath();

	const cfg = configuration.get<Config>();
	await Container.initialize(context, cfg, {
		extensionBuild: info.buildNumber,
		extensionBuildEnv: info.assetEnvironment,
		extensionVersion: extensionVersion,
		extensionVersionFormatted: formattedVersion,
		gitPath: git,
		ideVersion: vscodeVersion,
		isDebugging: Logger.isDebugging,
		traceLevel: Logger.level,
		serverUrl: cfg.serverUrl
	} as AgentOptions);

	context.subscriptions.push(Container.session.onDidChangeSessionStatus(onSessionStatusChanged));

	if (cfg.autoSignIn) {
		Container.commands.signIn();
	}

	Logger.log(
		`CodeStream v${formattedVersion} started \u2022 ${Strings.getDurationMilliseconds(start)} ms`
	);
}

export async function deactivate(): Promise<void> {}

function onSessionStatusChanged(e: SessionStatusChangedEvent) {
	const status = e.getStatus();
	setContext(ContextKeys.Status, status);
}

let _gitPath: string | undefined;
export async function gitPath(): Promise<string> {
	if (_gitPath === undefined) {
		try {
			const gitExtension = extensions.getExtension("vscode.git");
			if (gitExtension !== undefined) {
				const gitApi = ((gitExtension.isActive
					? gitExtension.exports
					: await gitExtension.activate()) as GitExtension).getAPI(1);
				_gitPath = gitApi.git.path;
			}
		} catch {}

		if (_gitPath === undefined) {
			_gitPath = workspace.getConfiguration("git").get<string>("path") || "git";
		}
	}
	return _gitPath;
}
