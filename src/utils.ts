import { FakeResponse } from "fake-response";
import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import { filterBySchemaID, generateMockID } from "./enum";
import { Prompt } from "./prompt";
import { Settings } from "./Settings";

export class Utils {
  protected fakeResponse: FakeResponse;
  protected environment = "none";

  constructor() {
    const workSpaceFolderPath = vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0].uri.fsPath : "./";
    this.fakeResponse = new FakeResponse(undefined, { rootPath: workSpaceFolderPath, throwError: true });
  }

  protected getEditorProps = () => {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      const document = editor.document;
      const selection = editor.selection;
      const firstLine = document.lineAt(0);
      const lastLine = document.lineAt(document.lineCount - 1);
      const textRange = new vscode.Range(firstLine.range.start, lastLine.range.end);
      const editorText = document.getText(textRange);
      const selectedText = document.getText(selection);
      return { editor, document, selection, textRange, editorText, selectedText };
    }

    return false;
  };

  protected getWritables = async (extensions: string[], action: string) => {
    const editorProps = this.getEditorProps();

    if (editorProps) {
      const { editor, document, textRange, editorText } = editorProps;

      if ((action === generateMockID || action === filterBySchemaID) && !editorProps.editorText.trim().length) {
        const extension = path.extname(path.resolve(document.fileName));
        if (extensions.indexOf(extension) < 0) return false;
      }

      const shouldSaveAsNewFile = await Prompt.shouldSaveAsNewFile();

      if (shouldSaveAsNewFile) {
        if (shouldSaveAsNewFile === "yes") {
          const fileName = await Prompt.getFilePath(extensions);
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

  protected writeFile = async (
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
      const doc = await vscode.workspace.openTextDocument(filePath);
      await vscode.window.showTextDocument(doc, undefined, true);
      Prompt.showPopupMessage(notificationText, "info");
    } else {
      editor.edit((editBuilder) => {
        editBuilder.replace(textRange, data);
        Prompt.showPopupMessage(notificationText, "info");
      });
    }
  };

  protected getMockFromPath = (mockPath: string) => {
    const environmentList = this.getEnvironmentList();
    const environment = this.environment.toLowerCase();
    if (!environment.trim().length || environment === "none" || !environmentList.find((e) => e.fileName === environment)) {
      Settings.environment = "none";
      return mockPath;
    }

    Settings.environment = environment;
    const mock = this.fakeResponse.getMockFromPath(mockPath, []);
    const envPath = environmentList.find((e) => e.fileName === environment)!.filePath;
    const env = this.fakeResponse.getMockFromPath(envPath, []);
    return { ...mock, ...env };
  };

  protected getEnvironmentList = () => {
    const filesList = this.fakeResponse.getFilesList(Settings.envPath);
    const envList = filesList.filter((f) => f.extension === ".json").map((f) => ({ ...f, fileName: f.fileName.toLowerCase() }));
    return envList;
  };

  protected getSortedObject = (obj: { [key: string]: any }) => {
    const sortKeyList = [...new Set(Settings.sortObjectKeyList)];
    const isAscending = Settings.isObjectAscending;
    const objectKeys = Settings.preserveOrder ? Object.keys(obj) : this.getSortedArrayString(Object.keys(obj), isAscending);
    const sortedKeys = isAscending
      ? [...sortKeyList, ...objectKeys.filter((k) => sortKeyList.indexOf(k) < 0)]
      : [...objectKeys.filter((k) => sortKeyList.indexOf(k) < 0), ...sortKeyList.reverse()];

    return sortedKeys.reduce((res: object, key: string) => {
      if (obj[key] !== null && obj[key] !== undefined) {
        return { ...res, [key]: obj[key] };
      }
      return res;
    }, {});
  };

  protected getSortedArray = async <T>(array: T[]): Promise<T[]> => {
    const isAscending = Settings.isArrayAscending;
    const isCaseInsensitive = Settings.isCaseInsensitive;
    if (array.every((a) => a && typeof a === "object")) {
      const keyList = this.getKeyList(array);
      const sortKey = await Prompt.getSortKey(keyList);
      if (sortKey?.length) {
        const sortedArray = isCaseInsensitive
          ? array.sort((a: any, b: any) => {
              if (a[sortKey].toLowerCase() < b[sortKey].toLowerCase()) return -1;
              if (a[sortKey].toLowerCase() > b[sortKey].toLowerCase()) return 1;
              return 0;
            })
          : array.sort((a: any, b: any) => {
              if (a[sortKey] < b[sortKey]) return -1;
              if (a[sortKey] > b[sortKey]) return 1;
              return 0;
            });
        return isAscending ? sortedArray.map(this.getSortedObject) : sortedArray.map(this.getSortedObject).reverse();
      } else {
        return array;
      }
    } else {
      return this.getSortedArrayString(array, isAscending);
    }
  };

  protected getSortedArrayString = (array: any[], isAscending: boolean) => {
    const isCaseInsensitive = Settings.isCaseInsensitive;
    if (array.every((a) => typeof a === "number")) {
      return isAscending ? array.sort((a: any, b: any) => a - b) : array.sort((a: any, b: any) => b - a);
    } else {
      const sortedArray = isCaseInsensitive
        ? array.sort((a: any, b: any) => {
            if (a.toLowerCase() < b.toLowerCase()) return -1;
            if (a.toLowerCase() > b.toLowerCase()) return 1;
            return 0;
          })
        : array.sort();
      return isAscending ? sortedArray : sortedArray.reverse();
    }
  };

  protected getKeyList = (array: any[]) => {
    const allKeys = array.reduce((keyList: string[], obj: object) => {
      const filteredKeys = Object.entries(obj)
        .filter(([key, val]) => {
          if (typeof val !== "object") {
            return true;
          }
          return false;
        })
        .map(([key, _val]) => key);

      return keyList.concat(filteredKeys);
    }, []);
    return [...new Set(allKeys)] as string[];
  };
}
