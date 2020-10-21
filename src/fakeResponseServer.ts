import { FakeResponse } from "fake-response";
import { HAR } from "fake-response/dist/model";
import * as fs from "fs";
import * as vscode from "vscode";
import { filterBySchemaID, generateMockID, getRoutesListID } from "./enum";
import { EnvironmentFileStats, ExtensionProperties } from "./model";
import { StatusbarUi } from "./StatusBarUI";
import { Utils } from "./utils";

export class FakeResponseServer extends Utils {
  fakeResponse: FakeResponse;
  statusBarUi: StatusbarUi;
  statusBarItem: vscode.StatusBarItem;

  isServerStarted = false;
  environmentList: EnvironmentFileStats[] = [];
  environment = "none";

  constructor() {
    super();
    const props = this.getExtensionProperties();
    this.fakeResponse = new FakeResponse();
    this.statusBarUi = new StatusbarUi(props.showOnStatusbar);
    this.statusBarItem = this.statusBarUi.statusBarItem;
  }

  generateMockFromHAR = async () => {
    const writables = await this.getWritables([".json"], generateMockID);
    if (writables) {
      const { editorText, fileName, editor, document, textRange } = writables;
      try {
        const { resourceTypeFilters, callback } = this.getExtensionProperties().generateMock;
        const harObject = JSON.parse(editorText) as HAR;
        const mock = this.fakeResponse.transformHar(harObject, resourceTypeFilters, callback);
        this.writeFile(JSON.stringify(mock, null, "\t"), fileName, "Mock generated Successfully", editor, document, textRange);
      } catch (err) {
        this.window.showErrorMessage("Failed to generate mock. ", err);
      }
    }
  };

  filterBySchema = async () => {
    const writables = await this.getWritables([".json"], filterBySchemaID);
    if (writables) {
      const { editorText, fileName, editor, document, textRange } = writables;
      try {
        const { filterSchema } = this.getExtensionProperties();
        const filteredObject = this.fakeResponse.filterBySchema(JSON.parse(editorText), filterSchema);
        this.writeFile(JSON.stringify(filteredObject, null, "\t"), fileName, "Filtered Successfully", editor, document, textRange);
      } catch (err) {
        this.window.showErrorMessage("Failed to Filter", err);
      }
    }
  };

  getRoutesList = async () => {
    const writables = await this.getWritables([".http"], getRoutesListID);
    if (writables) {
      const { fileName, editor, document, textRange } = writables;
      try {
        const { availableRoutes, config } = this.fakeResponse.getData();

        const defaultRoutes = ["/routesList", "/db"];
        const totalUniqueRoutes = [...new Set([...availableRoutes, ...defaultRoutes])]; // getting unique list

        const initial = `
Total Resources = ${totalUniqueRoutes.length} resources.
@hostname = localhost
@port = ${config.port}
@baseurl = ${config.baseUrl || ""}

###
`;

        const routesList = totalUniqueRoutes.reduce((res, route) => {
          const url = `http://localhost:${config.port}${route}`;
          return res + url + "\n###\n";
        }, initial);

        this.writeFile(routesList, fileName, "Routes List Fetched Successfully", editor, document, textRange);
      } catch (err) {
        this.window.showErrorMessage("Failed to Fetch Routes", err);
      }
    }
  };

  startServer = (txt: string) => {
    const {
      paths: { mockPath },
      config,
      injectors,
      globals,
    } = this.getExtensionProperties();
    if (mockPath.length) {
      this.statusBarUi.Working(`${txt}ing...`);
      const mock = this.getMockFromPath(mockPath, this.environment, this.environmentList, this.fakeResponse);
      this.fakeResponse.setData(mock, config, injectors, globals);
      this.fakeResponse
        .launchServer()
        .then(() => {
          this.isServerStarted = true;
          const statusMsg = `Server is ${txt}ed at port : ${config.port}`;
          this.statusBarUi.stopServer(1000, config.port, statusMsg);
        })
        .catch((err) => {
          this.statusBarUi.startServer(0);
          this.window.showErrorMessage(`Server Failed to ${txt}`, err);
        });
    } else {
      this.window.showErrorMessage("Please Provide a mock path in settings");
    }
  };

  stopServer = () => {
    const { config } = this.getExtensionProperties();
    if (this.isServerStarted) {
      this.statusBarUi.Working("Stopping...");
      this.fakeResponse
        .stopServer()
        .then(() => {
          this.isServerStarted = false;
          this.statusBarUi.startServer(1000, "Server is Stopped");
        })
        .catch((err) => {
          this.statusBarUi.stopServer(0, config.port);
          this.window.showInformationMessage("Failed to Stop", err);
        });
    } else {
      this.window.showErrorMessage("No Server to Stop");
    }
  };

  restartServer = () => {
    if (this.isServerStarted) {
      this.fakeResponse.stopServer().then(() => {
        this.isServerStarted = false;
        this.statusBarUi.startServer(1000);
        this.startServer("Re Start");
      });
    } else {
      this.startServer("Start");
    }
  };

  switchEnvironment = async () => {
    const {
      paths: { envPath },
    } = this.getExtensionProperties();
    const envList = this.getJsonFilesFromFolder(envPath);
    if (envList && envList.length) {
      this.environmentList = envList;
      const environmentList = [...envList.map((e) => e.fileName), "none"];

      // making the selected environment to appear in first of the list
      const selectedEnvIndex = environmentList.findIndex((e) => e === this.environment);
      environmentList.splice(selectedEnvIndex, 1);
      environmentList.unshift(this.environment);

      const env = await this.getEnvironment(environmentList);
      if (env) {
        this.environment = env;
        this.isServerStarted && this.restartServer();
      }
    }
  };
}
