import * as vscode from "vscode";
import {
  filterBySchemaID,
  generateMockID,
  getRoutesListID,
  reloadID,
  sortJsonID,
  startServerID,
  stopServerID,
  switchEnvironmentID,
} from "./enum";
import { FakeResponseServer } from "./fakeResponseServer";
import { StatusbarUi } from "./StatusBarUI";

export function activate(context: vscode.ExtensionContext) {
  const fakeResponseServer = new FakeResponseServer();

  // Generate Mock
  context.subscriptions.push(vscode.commands.registerCommand(generateMockID, fakeResponseServer.generateMockFromHAR));

  // Filter By Schema
  context.subscriptions.push(vscode.commands.registerCommand(filterBySchemaID, fakeResponseServer.filterBySchema));

  // Get Routes List
  context.subscriptions.push(vscode.commands.registerCommand(getRoutesListID, fakeResponseServer.getRoutesList));

  // Start Server
  context.subscriptions.push(vscode.commands.registerCommand(startServerID, fakeResponseServer.restartServer));

  // Stop Server
  context.subscriptions.push(vscode.commands.registerCommand(stopServerID, fakeResponseServer.stopServer));

  // Switch Environment
  context.subscriptions.push(vscode.commands.registerCommand(switchEnvironmentID, fakeResponseServer.switchEnvironment));

  // Switch Environment
  context.subscriptions.push(vscode.commands.registerCommand(sortJsonID, fakeResponseServer.sortJson));

  // show status bar
  context.subscriptions.push(StatusbarUi.statusBarItem);

  // Reload Extension
  context.subscriptions.push(
    vscode.commands.registerCommand(reloadID, () => {
      deactivate();
      try {
        fakeResponseServer.stopServer();
      } catch {}
      context.subscriptions.forEach((sub) => {
        try {
          sub.dispose();
        } catch {}
      });
      setTimeout(() => {
        StatusbarUi.statusBarItem = undefined;
        activate(context);
      }, 1000);
    })
  );
}
export function deactivate() {}
