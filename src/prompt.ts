import * as vscode from "vscode";
import * as path from "path";

export class Prompt {
  window;

  constructor() {
    this.window = vscode.window;
  }

  getFileName = async (extensions: string[]) => {
    const fileName = await vscode.window.showInputBox({
      value: "",
      placeHolder: "File Name",
      validateInput: (text) => {
        return text.length && extensions.indexOf(path.extname(text) || extensions[0]) < 0 ? text : null;
      },
    });

    return fileName && !path.extname(fileName).length ? fileName + `${extensions[0]}` : fileName;
  };

  shouldSaveAsNewFile = () => {
    return vscode.window.showQuickPick(["no", "yes"], {
      placeHolder: "Create a new File ?",
    });
  };

  getEnvironment = async (envNameList: string[]) => {
    return vscode.window.showQuickPick(envNameList, {
      placeHolder: "Please select any environment",
    });
  };
}
