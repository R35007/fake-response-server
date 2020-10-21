import * as vscode from "vscode";

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
        const fileName = text.split(".");
        return fileName.length >= 2 && extensions.indexOf(fileName[1]) < 0 ? text : null;
      },
    });

    return fileName && fileName.split(".").length === 1 ? fileName + `.${extensions[0]}` : fileName;
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
