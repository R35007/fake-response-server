import * as vscode from "vscode";
import { Settings } from "./Settings";

export class Prompt {
  static getFilePath = async (extensions: string[]) => {
    const defaultUri = vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0].uri : undefined;
    const filters = { Type: extensions.map((e) => e.slice(1)) };
    const filePaths = await vscode.window.showOpenDialog({
      defaultUri,
      filters,
      title: "Please select .json or .http file to paste the generated data",
    });

    const filePath = filePaths && filePaths[0].fsPath.toString();
    return filePath;
  };

  static shouldSaveAsNewFile = () => {
    return vscode.window.showQuickPick(["no", "yes"], {
      placeHolder: "Create a new File ?",
    });
  };

  static getEnvironment = async (envNameList: string[]) => {
    return vscode.window.showQuickPick(envNameList, {
      placeHolder: "Please select any environment",
    });
  };

  static getSortKey = async (keyList: string[]) => {
    return vscode.window.showQuickPick(keyList, {
      placeHolder: "Please select any key to sort",
    });
  };

  static showPopupMessage = (message: string, action: "info" | "warning" | "error") => {
    if (action === "info") {
      const dontShowTxt = "Don't show again";
      !Settings.donotShowInfoMsg &&
        vscode.window.showInformationMessage(message, dontShowTxt).then((choice) => {
          choice && choice === dontShowTxt && (Settings.donotShowInfoMsg = true);
        });
    } else if (action === "error") {
      vscode.window.showErrorMessage(message);
    } else if (action === "warning") {
      vscode.window.showWarningMessage(message);
    }
  };
}
