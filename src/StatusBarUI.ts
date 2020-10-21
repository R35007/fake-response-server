import * as vscode from "vscode";
import { startServerID, stopServerID } from "./enum";
import { Utils } from "./utils";

export class StatusbarUi {
  statusBarItem!: vscode.StatusBarItem;

  constructor(showOnStatusbar: boolean) {
    this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    showOnStatusbar && this.statusBarItem.show();
    this.Init();
  }

  Init() {
    this.Working("loading...");
    this.startServer(1000);
  }

  Working(workingMsg = "Working on it...") {
    this.statusBarItem.text = `$(pulse) ${workingMsg}`;
    this.statusBarItem.tooltip = "In case if it takes long time, try to close all browser window.";
    this.statusBarItem.command = undefined;
  }

  startServer(delay: number, statusMsg?: string) {
    setTimeout(() => {
      this.statusBarItem.text = "$(broadcast) Mock it";
      this.statusBarItem.command = startServerID;
      this.statusBarItem.tooltip = "Click to start mock server";
      statusMsg && vscode.window.showInformationMessage(statusMsg);
    }, delay);
  }

  stopServer(delay: number, port: number, statusMsg?: string) {
    setTimeout(() => {
      this.statusBarItem.text = `$(circle-slash) Port : ${port}`;
      this.statusBarItem.command = stopServerID;
      this.statusBarItem.tooltip = "Click to stop mock server";
      statusMsg && vscode.window.showInformationMessage(statusMsg);
    }, delay);
  }
}
