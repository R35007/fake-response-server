import { FakeResponse } from "fake-response";
import { HAR } from "fake-response/dist/model";
import * as fs from "fs";
import * as path from "path";
import { URL } from "url";
import { isArray } from "util";
import * as vscode from "vscode";
import { ExtensionProperties } from "./model";
import { getValidRoute, isPlainObject, isEmpty } from "./validation";

export function activate({ subscriptions }: vscode.ExtensionContext) {
  let fakeResponse = new FakeResponse();

  let isServerStarted = false;

  const generateMockID = "fakeResponse.generateMock";
  const filterBySchemaID = "fakeResponse.filterBySchema";
  const startServerID = "fakeResponse.startServer";
  const stopServerID = "fakeResponse.stopServer";
  const getRoutesListID = "fakeResponse.getRoutesList";

  // Generate Mock
  subscriptions.push(
    vscode.commands.registerCommand(generateMockID, async () => {
      const editor = vscode.window.activeTextEditor;

      if (editor) {
        const document = editor.document;
        const workspaceConfiguration: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration("fakeResponse");
        const properties = getExtensionProperties(workspaceConfiguration);

        const textRange = getTextRange(document);
        const harDataStr = document.getText(textRange);
        try {
          const harData = generateMock(JSON.parse(harDataStr) as HAR, properties.generateMock.resourceTypeFilters);
          const notificationText = "mock generated Successfully";
          await writeMockFile(JSON.stringify(harData, null, "\t"), properties, document, editor, textRange, "json", notificationText);
        } catch (err) {
          vscode.window.showErrorMessage("Failed to generate mock. ", err);
        }
      }
    })
  );

  // Filter By Schema
  subscriptions.push(
    vscode.commands.registerCommand(filterBySchemaID, async () => {
      const editor = vscode.window.activeTextEditor;

      if (editor) {
        const document = editor.document;
        const workspaceConfiguration: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration("fakeResponse");
        const properties = getExtensionProperties(workspaceConfiguration);

        const textRange = getTextRange(document);
        const jsonData = document.getText(textRange);
        try {
          const filteredObject = filterBySchema(JSON.parse(jsonData), properties.filterSchema);
          const notificationText = "Filtered Successfully";
          await writeMockFile(
            JSON.stringify(filteredObject, null, "\t"),
            properties,
            document,
            editor,
            textRange,
            "json",
            notificationText
          );
        } catch (err) {
          vscode.window.showErrorMessage("Failed to filter.", err);
        }
      }
    })
  );

  // Gets Routes List
  subscriptions.push(
    vscode.commands.registerCommand(getRoutesListID, async () => {
      const editor = vscode.window.activeTextEditor;

      if (editor) {
        const document = editor.document;
        const workspaceConfiguration: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration("fakeResponse");
        const properties = getExtensionProperties(workspaceConfiguration);

        const textRange = getTextRange(document);
        try {
          const { availableRoutes, config } = fakeResponse.getData();
          const routesList = availableRoutes.reduce((res, routes) => {
            const url = `http://localhost:${config.port}${routes}`;
            return res.concat(url + "\n###\n");
          }, "");

          const notificationText = "Routes List Generated Successfully";
          await writeMockFile(routesList, properties, document, editor, textRange, "http", notificationText);
        } catch (err) {
          vscode.window.showErrorMessage("Failed to get Routes List.", err);
        }
      }
    })
  );

  // Start Server
  subscriptions.push(
    vscode.commands.registerCommand(startServerID, () => {
      const workspaceConfiguration: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration("fakeResponse");
      const properties = getExtensionProperties(workspaceConfiguration);

      if (!isServerStarted) {
        if (properties.mockPath.length) {
          fakeResponse.setData(properties.mockPath, properties.config, properties.injectors, properties.globals);
          fakeResponse
            .launchServer()
            .then(() => {
              isServerStarted = true;
              vscode.window.showInformationMessage(
                `Server Started Successfully... listening at http://localhost:${properties.config.port}`
              );
            })
            .catch((err) => {
              vscode.window.showErrorMessage("Server Failed to Start", err);
            });
        } else {
          vscode.window.showErrorMessage("Please Provide a mock path in settings");
        }
      } else {
        fakeResponse.stopServer().then(() => {
          isServerStarted = false;
          if (properties.mockPath.length) {
            fakeResponse.setData(properties.mockPath, properties.config, properties.injectors, properties.globals);
            fakeResponse
              .launchServer()
              .then(() => {
                isServerStarted = true;
                vscode.window.showInformationMessage("Server Restarted Successfully");
              })
              .catch((err) => {
                vscode.window.showErrorMessage("Server Failed to Start", err);
              });
          } else {
            vscode.window.showErrorMessage("Please Provide a mock path in settings");
          }
        });
      }
    })
  );

  // Stop Server
  subscriptions.push(
    vscode.commands.registerCommand(stopServerID, () => {
      if (isServerStarted) {
        isServerStarted = false;
        fakeResponse.stopServer().then(() => {
          vscode.window.showInformationMessage("Server Stopped Successfully");
        });
      } else {
        vscode.window.showErrorMessage("There is no server to Stop");
      }
    })
  );
}

const getTextRange = (document: vscode.TextDocument): vscode.Range => {
  const firstLine = document.lineAt(0);
  const lastLine = document.lineAt(document.lineCount - 1);
  const textRange = new vscode.Range(firstLine.range.start, lastLine.range.end);
  return textRange;
};

const writeMockFile = async (
  data: any,
  properties: ExtensionProperties,
  document: vscode.TextDocument,
  editor: vscode.TextEditor,
  textRange: vscode.Range,
  extension: string,
  notificationText: string
) => {
  if (properties.saveAsNewFile) {
    let folderPath = path.resolve(path.dirname(document.uri.fsPath)) || "/";
    const fileName = await getFileName(extension);

    if (fileName) {
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath);
      }
      fs.writeFileSync(path.join(folderPath, fileName), data);
      vscode.window.showInformationMessage(notificationText);
    }
  } else {
    editor.edit((editBuilder) => {
      editBuilder.replace(textRange, data);
      vscode.window.showInformationMessage(notificationText);
    });
  }
};

const getFileName = async (extension: string) => {
  const fileName = await vscode.window.showInputBox({
    value: "",
    placeHolder: "File Name",
    validateInput: (text) => {
      const fileName = text.split(".");
      return fileName.length >= 2 && fileName[1] !== extension ? text : null;
    },
  });

  return fileName && fileName.split(".").length === 1 ? fileName + `.${extension}` : fileName;
};

const generateMock = (harData: HAR = <HAR>{}, resourceTypeFilters: string[] = []) => {
  try {
    const entries = harData?.log?.entries || [];
    const resourceFilteredEntries = resourceTypeFilters.length
      ? entries.filter((e: any) => resourceTypeFilters.indexOf(e._resourceType) >= 0)
      : entries;
    const mimeTypeFilteredEntries = resourceFilteredEntries.filter(
      (e) => e?.response?.content?.mimeType === "application/json" || e?.response?.content?.mimeType === "text/plain"
    );
    const mock = mimeTypeFilteredEntries.reduce((result, entry) => {
      const route = new URL(entry?.request?.url).pathname;
      const valid_Route = getValidRoute(route);
      const responseText = entry?.response?.content?.text || "";

      let response;
      try {
        response = JSON.parse(responseText);
      } catch {
        response = responseText;
      }

      let obj = { [valid_Route]: response };

      return {
        ...result,
        ...obj,
      };
    }, {});

    const valid_Mock = Object.entries(mock).reduce((res, [key, val]) => ({ ...res, [getValidRoute(key)]: val }), {});

    return valid_Mock;
  } catch (err) {}
};

const filterBySchema = (_data: any = {}, _schema: any = {}): any => {
  if (isPlainObject(_data)) {
    const filteredObj: any = Object.entries(_data).reduce((result, [key, val]) => {
      const schemaKeys = Object.keys(_schema);
      if (schemaKeys.indexOf(key) >= 0) {
        if (isPlainObject(_schema[key])) {
          if (isPlainObject(val) || isArray(val)) {
            const value = filterBySchema(val, _schema[key]);
            if (!isEmpty(value)) {
              return { ...result, [key]: value };
            }
          } else {
            return result;
          }
        } else if (_schema[key] === true) {
          return { ...result, [key]: val };
        }
        return result;
      }
      return result;
    }, {});

    return filteredObj;
  } else if (isArray(_data)) {
    const filteredArray = _data.map((j: any) => filterBySchema(j, _schema)).filter((fa: any) => !isEmpty(fa));
    return filteredArray.length ? filteredArray : [];
  }
  return _data;
};

const getExtensionProperties = (workspaceConfig: vscode.WorkspaceConfiguration): ExtensionProperties => {
  let injectors = [];
  try {
    if (workspaceConfig.injectorsPath && fs.existsSync(path.dirname(workspaceConfig.injectorsPath))) {
      const injectorPath = path.resolve(workspaceConfig.injectorsPath);
      delete require.cache[injectorPath];
      injectors = require(workspaceConfig.injectorsPath);
    }
  } catch (_err) {}

  const extensionProperties: ExtensionProperties = {
    saveAsNewFile: workspaceConfig.saveAsNewFile,
    generateMock: workspaceConfig.generateMock,
    config: workspaceConfig.config,
    mockPath: workspaceConfig.mockPath,
    filterSchema: workspaceConfig.filterSchema,
    globals: workspaceConfig.globals,
    injectors,
  } as ExtensionProperties;

  return extensionProperties;
};

export function deactivate() {}
