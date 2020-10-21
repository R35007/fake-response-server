import * as vscode from "vscode";
import { filterBySchemaID, generateMockID, getRoutesListID, startServerID, stopServerID, switchEnvironmentID } from "./enum";
import { FakeResponseServer } from "./fakeResponseServer";

export function activate({ subscriptions }: vscode.ExtensionContext) {
  const fakeResponseServer = new FakeResponseServer();

  // Generate Mock
  subscriptions.push(vscode.commands.registerCommand(generateMockID, fakeResponseServer.generateMockFromHAR));

  // Filter By Schema
  subscriptions.push(vscode.commands.registerCommand(filterBySchemaID, fakeResponseServer.filterBySchema));

  // Get Routes List
  subscriptions.push(vscode.commands.registerCommand(getRoutesListID, fakeResponseServer.getRoutesList));

  // Start Server
  subscriptions.push(vscode.commands.registerCommand(startServerID, fakeResponseServer.restartServer));

  // Stop Server
  subscriptions.push(vscode.commands.registerCommand(stopServerID, fakeResponseServer.stopServer));

  // Switch Environment
  subscriptions.push(vscode.commands.registerCommand(switchEnvironmentID, fakeResponseServer.switchEnvironment));

  // show status bar
  subscriptions.push(fakeResponseServer.statusBarItem);
}
export function deactivate() {}
