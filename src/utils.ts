import { FakeResponse } from "fake-response";
import { Valid_RoutesMatchList } from "fake-response/dist/model";
import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import { filterBySchemaID, generateMockID } from "./enum";
import { EnvironmentFileStats, ExtensionProperties } from "./model";
import { Prompt } from "./prompt";

export class Utils extends Prompt {
  constructor() {
    super();
  }

  getEditorProps = () => {
    const editor = this.window.activeTextEditor;
    if (editor) {
      const document = editor.document;
      const firstLine = document.lineAt(0);
      const lastLine = document.lineAt(document.lineCount - 1);
      const textRange = new vscode.Range(firstLine.range.start, lastLine.range.end);
      const editorText = document.getText(textRange);
      return { editor, document, textRange, editorText };
    }

    return false;
  };

  getExtensionProperties = () => {
    const workspaceConfig = vscode.workspace.getConfiguration("fake-response-server");
    const { config } = workspaceConfig;

    const { rootPath, mockPath, envPath, injectorsPath, generateMockCallbackPath } = config.paths;

    const validMockPath = mockPath && mockPath.trim().length && path.resolve(rootPath, mockPath);
    const validEnvPath = envPath && envPath.trim().length && path.resolve(rootPath, envPath);
    const validInjectorsPath = injectorsPath && injectorsPath.trim().length && path.resolve(rootPath, injectorsPath);
    const validCallbackPath =
      generateMockCallbackPath && generateMockCallbackPath.trim().length && path.resolve(rootPath, generateMockCallbackPath);

    const extensionProperties: ExtensionProperties = {
      saveAsNewFile: workspaceConfig.config.saveAsNewFile,
      showOnStatusbar: workspaceConfig.config.showOnStatusbar,
      generateMock: {
        resourceTypeFilters: workspaceConfig.config.resourceTypeFilters,
        callback: this.requireFromPath(rootPath, generateMockCallbackPath, true),
      },
      config: {
        port: config.port,
        rootPath,
        groupings: config.groupings,
        proxy: config.proxy,
        baseUrl: config.baseUrl,
        delay: config.delay,
        excludeRoutes: this.getExcludedRoutes(config),
      },
      paths: {
        rootPath,
        mockPath: validMockPath,
        envPath: validEnvPath,
        injectorsPath: validInjectorsPath,
        callBackPath: validCallbackPath,
      },
      filterSchema: config.filterSchema,
      globals: config.globals,
      injectors: this.requireFromPath(rootPath, injectorsPath, true),
    } as ExtensionProperties;

    return extensionProperties;
  };

  requireFromPath = (rootPath: string, configPath: string, shouldBeFile: boolean = false) => {
    try {
      const resolvedPath = configPath?.trim().length && path.resolve(rootPath, configPath);
      if (resolvedPath && fs.existsSync(resolvedPath)) {
        const stats = fs.statSync(resolvedPath);
        if (stats.isFile() !== shouldBeFile) {
          return false;
        }
        delete require.cache[resolvedPath];
        return require(resolvedPath);
      }
      return false;
    } catch (_err) {
      return false;
    }
  };

  getExcludedRoutes = (config: any) => {
    const { excludeRoutes, proxy, groupings } = config;

    const { exactMatch, patternMatch, addGroupings, addProxyPatternMatch, addProxyExactMatch } = JSON.parse(JSON.stringify(excludeRoutes));

    const excludedRoutes: Valid_RoutesMatchList = {
      exactMatch: [],
      patternMatch: [],
    };

    if (addProxyExactMatch) excludedRoutes.exactMatch = [...exactMatch, ...Object.keys(proxy.exactMatch)];
    if (addProxyPatternMatch) excludedRoutes.patternMatch = [...patternMatch, ...Object.keys(proxy.patternMatch)];
    if (addGroupings) excludedRoutes.patternMatch = [...patternMatch, ...Object.keys(groupings)];

    return excludedRoutes;
  };

  getWritables = async (extensions: string[], action: string) => {
    const editorProps = this.getEditorProps();

    if (editorProps) {
      const { editor, document, textRange, editorText } = editorProps;

      if ((action === generateMockID || action === filterBySchemaID) && !editorProps.editorText.trim().length) {
        const extension = path.extname(path.resolve(document.fileName));
        if (extensions.indexOf(extension) < 0) return false;
      }

      const shouldSaveAsNewFile = await this.shouldSaveAsNewFile();

      if (shouldSaveAsNewFile) {
        if (shouldSaveAsNewFile === "yes") {
          const fileName = await this.getFileName(extensions);
          if (fileName && fileName.length) {
            return { editorText, fileName, editor, document, textRange };
          }
          return false;
        } else {
          return { editorText, fileName: "", editor, document, textRange };
        }
      }
      return false;
    }
    return false;
  };

  writeFile = async (
    data: any,
    fileName: string,
    notificationText: string,
    editor: vscode.TextEditor,
    document: vscode.TextDocument,
    textRange: vscode.Range
  ) => {
    if (fileName.length) {
      const filePath = path.resolve(path.dirname(document.fileName), fileName);
      const folderPath = path.dirname(filePath) || "/";
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }
      fs.writeFileSync(filePath, data);
      vscode.window.showInformationMessage(notificationText);
    } else {
      editor.edit((editBuilder) => {
        editBuilder.replace(textRange, data);
        vscode.window.showInformationMessage(notificationText);
      });
    }
  };

  getJsonFilesFromFolder = (directoryPath: string = "./", excludeFolders: string[] = []): EnvironmentFileStats[] => {
    try {
      const stats = fs.statSync(directoryPath);
      if (stats.isFile()) {
        this.window.showErrorMessage("Please provide a environment folder path in settings");
        return [];
      } else if (stats.isDirectory() && excludeFolders.indexOf(directoryPath) < 0) {
        const files = fs.readdirSync(directoryPath);
        const filteredFiles = files.filter((file) => excludeFolders.indexOf(file) < 0);
        const onlyJsonFiles = filteredFiles.filter((file) => path.extname(file) === ".json");

        const environmentsList = onlyJsonFiles.reduce((res: EnvironmentFileStats[], file: string) => {
          const filePath = directoryPath + "/" + file;
          const extension = path.extname(file);
          const fileName = path.basename(filePath, extension);
          return [...res, { fileName, filePath }];
        }, []);

        if (!environmentsList.length) {
          this.window.showErrorMessage("Environment Folder is Empty. Please provide any json files.");
        }
        return environmentsList;
      }
      return [];
    } catch (err) {
      this.window.showErrorMessage("Something Failed", err);
      return [];
    }
  };

  getMockFromPath = (mockPath: string, environment: string, environmentList: EnvironmentFileStats[], fakeResponse: FakeResponse) => {
    if (environment === "none") return mockPath;
    const mock = fakeResponse.getMockFromPath(mockPath, []);
    const envPath = environmentList.find((e) => e.fileName === environment)!.filePath;
    const env = fakeResponse.getMockFromPath(envPath, []);
    return { ...mock, ...env };
  };
}
