import { Config, Injectors, KeyValString } from "fake-Response/dist/model";
import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import { Prompt } from "./prompt";

export class Settings {
  static get configuration() {
    return vscode.workspace.getConfiguration("fake-response-server.settings");
  }
  static getSettings(val: string) {
    return Settings.configuration.get(val);
  }
  static setSettings(key: string, val: any, isGlobal = true) {
    return Settings.configuration.update(key, val, isGlobal);
  }
  static get port() {
    return (Settings.getSettings("port") as number) || 3000;
  }
  static get environment() {
    const env = Settings.getSettings("environment") as string;
    return env || "none";
  }
  static set environment(env: string) {
    Settings.setSettings("environment", env ? env.toLowerCase() : "none");
  }
  static get baseUrl() {
    return Settings.getSettings("baseUrl") as string;
  }
  static get resourceTypeFilters() {
    return Settings.getSettings("resourceTypeFilters") as string[];
  }
  static get filterSchema() {
    return Settings.getSettings("filterSchema") as object;
  }
  static get globals() {
    return Settings.getSettings("globals") as object;
  }
  static get groupings() {
    return Settings.getSettings("groupings") as KeyValString;
  }
  static get delay() {
    return {
      time: Settings.getSettings("commonDelay") as number,
      override: Settings.getSettings("overrideCommonDelay") as boolean,
    };
  }
  static get showOnStatusbar() {
    return Settings.getSettings("showOnStatusbar") as boolean;
  }
  static get donotShowInfoMsg() {
    return Settings.getSettings("donotShowInfoMsg") as boolean;
  }
  static set donotShowInfoMsg(val: boolean) {
    Settings.setSettings("donotShowInfoMsg", val);
  }
  static get proxyExactMatch() {
    return Settings.getSettings("proxy.exactMatch") as KeyValString;
  }
  static get proxyPatternMatch() {
    return Settings.getSettings("proxy.patternMatch") as KeyValString;
  }
  static get proxy() {
    return {
      exactMatch: Settings.proxyExactMatch,
      patternMatch: Settings.proxyPatternMatch,
    };
  }
  static get excludeRoutes() {
    const excludeRoutesExactMatch = Settings.getSettings("excludeRoutes.exactMatch") as string[];
    const excludeRoutesPatternMatch = Settings.getSettings("excludeRoutes.patternMatch") as string[];
    const addGroupings = Settings.getSettings("excludeRoutes.addGroupings") as boolean;
    const addProxyPatternMatch = Settings.getSettings("excludeRoutes.addProxyPatternMatch") as boolean;
    const addProxyExactMatch = Settings.getSettings("excludeRoutes.addProxyExactMatch") as boolean;

    const exactMatch = [...excludeRoutesExactMatch];
    const patternMatch = [...excludeRoutesPatternMatch];

    if (addGroupings) patternMatch.push(...Object.keys(Settings.groupings));
    if (addProxyPatternMatch) patternMatch.push(...Object.keys(Settings.proxyPatternMatch));
    if (addProxyExactMatch) exactMatch.push(...Object.keys(Settings.proxyExactMatch));

    return {
      exactMatch,
      patternMatch,
    };
  }
  static get rootPath() {
    const rootPathStr = Settings.getSettings("paths.rootPath") as string;
    const workSpaceFolderPath = vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0].uri.fsPath : "./";
    return Settings.getValidPath("rootPath", workSpaceFolderPath, rootPathStr) || workSpaceFolderPath;
  }
  static get mockPath() {
    const mockPathStr = Settings.getSettings("paths.mockPath") as string;
    return Settings.getValidPath("mockPath", Settings.rootPath, mockPathStr) || "";
  }
  static get envPath() {
    const envPathStr = Settings.getSettings("paths.envPath") as string;
    return Settings.getValidPath("envPath", Settings.rootPath, envPathStr) || "";
  }
  static get injectorsPath() {
    const injectorsPathStr = Settings.getSettings("paths.injectorsPath") as string;
    return Settings.getValidPath("injectorsPath", Settings.rootPath, injectorsPathStr, true);
  }
  static get callbackPath() {
    const callbackPathPathStr = Settings.getSettings("paths.generateMockCallbackPath") as string;
    return Settings.getValidPath("generateMockCallbackPath", Settings.rootPath, callbackPathPathStr, true);
  }
  static get injectors() {
    const injectorsPath = Settings.injectorsPath;
    if (injectorsPath) {
      delete require.cache[injectorsPath];
      return require(injectorsPath) as Injectors[];
    }
    return undefined;
  }
  static get callback() {
    const callbackPath = Settings.callbackPath;
    if (callbackPath) {
      delete require.cache[callbackPath];
      return require(callbackPath) as (entry: object, route: string, response: any) => object;
    }
    return undefined;
  }
  static get config(): Config {
    return {
      port: Settings.port,
      env: Settings.environment,
      rootPath: Settings.rootPath,
      groupings: Settings.groupings,
      proxy: Settings.proxy,
      baseUrl: Settings.baseUrl,
      delay: Settings.delay,
      excludeRoutes: Settings.excludeRoutes,
      throwError: true,
    };
  }
  static getValidPath(settingsName: string, rootPath: string, relativePath: string, shouldBeFile: boolean = false) {
    if (relativePath && relativePath.trim().length) {
      const resolvedPath = path.resolve(rootPath, relativePath);
      if (fs.existsSync(resolvedPath)) {
        if (shouldBeFile && !fs.statSync(resolvedPath).isFile() && path.extname(resolvedPath) !== ".js") {
          Prompt.showPopupMessage(`Invalid ${settingsName} - ${resolvedPath}`, "error");
          return undefined;
        }
        return resolvedPath;
      }
      Prompt.showPopupMessage(`Invalid ${settingsName} - ${resolvedPath}`, "error");
      return undefined;
    } else {
      return undefined;
    }
  }
}
