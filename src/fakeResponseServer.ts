import { HAR } from "fake-response/dist/model";
import { filterBySchemaID, generateMockID, getRoutesListID } from "./enum";
import { Prompt } from "./prompt";
import { Settings } from "./Settings";
import { StatusbarUi } from "./StatusBarUI";
import { Utils } from "./utils";

export class FakeResponseServer extends Utils {
  private isServerStarted = false;

  constructor() {
    super();
    StatusbarUi.Init();
  }

  generateMockFromHAR = async () => {
    const writables = await this.getWritables([".json"], generateMockID);
    if (writables) {
      const { editorText, fileName, editor, document, textRange } = writables;
      try {
        const harObject = JSON.parse(editorText) as HAR;
        const mock = this.fakeResponse.transformHar(harObject, Settings.resourceTypeFilters, Settings.callback);
        this.writeFile(JSON.stringify(mock, null, "\t"), fileName, "Mock generated Successfully", editor, document, textRange);
      } catch (err) {
        Prompt.showPopupMessage(`Failed to generate mock. \n${err.message}`, "error");
      }
    }
  };

  filterBySchema = async () => {
    const writables = await this.getWritables([".json"], filterBySchemaID);
    if (writables) {
      const { editorText, fileName, editor, document, textRange } = writables;
      try {
        const filteredObject = this.fakeResponse.filterBySchema(JSON.parse(editorText), Settings.filterSchema);
        this.writeFile(JSON.stringify(filteredObject, null, "\t"), fileName, "Filtered Successfully", editor, document, textRange);
      } catch (err) {
        Prompt.showPopupMessage(`Failed to Filter. \n${err.message}`, "error");
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
        Prompt.showPopupMessage(`Failed to Fetch Routes. \n${err.message}`, "error");
      }
    }
  };

  startServer = async (txt: string) => {
    try {
      if (Settings.mockPath.length) {
        StatusbarUi.Working(`${txt}ing...`);
        const mock = this.getMockFromPath(Settings.mockPath);
        this.fakeResponse.setData(mock, Settings.config, Settings.injectors, Settings.globals);

        await this.fakeResponse.launchServer();

        this.isServerStarted = true;
        const statusMsg = `Server is ${txt}ed at port : ${Settings.port}`;
        StatusbarUi.stopServer(1000, Settings.port, () => Prompt.showPopupMessage(statusMsg, "info"));
      }
    } catch (err) {
      const statusMsg = `Server Failed to ${txt}. \n ${err.message}`;
      StatusbarUi.startServer(0, () => Prompt.showPopupMessage(statusMsg, "error"));
    }
  };

  stopServer = async () => {
    try {
      if (this.isServerStarted) {
        StatusbarUi.Working("Stopping...");

        await this.fakeResponse.stopServer();

        this.isServerStarted = false;
        StatusbarUi.startServer(1000, () => Prompt.showPopupMessage("Server is Stopped", "info"));
      } else {
        Prompt.showPopupMessage("No Server to Stop.", "error");
      }
    } catch (err) {
      const statsMsg = `Failed to Stop. \n${err.message}`;
      StatusbarUi.stopServer(0, Settings.port, () => Prompt.showPopupMessage(statsMsg, "error"));
    }
  };

  restartServer = async () => {
    if (this.isServerStarted) {
      await this.fakeResponse.stopServer();
      this.isServerStarted = false;
      StatusbarUi.startServer(1000);
      this.startServer("Re Start");
    } else {
      this.startServer("Start");
    }
  };

  switchEnvironment = async () => {
    if (Settings.envPath.length) {
      const envList = this.getEnvironmentList();
      if (envList && envList.length) {
        const environmentList = [...new Set(["none", ...envList.map((e) => e.fileName)])];

        // making the selected environment to appear in first of the list
        const selectedEnvIndex = environmentList.findIndex((e) => e === Settings.environment.toLowerCase());
        if (selectedEnvIndex >= 0) {
          environmentList.splice(selectedEnvIndex, 1);
          environmentList.unshift(Settings.environment.toLowerCase());
        } else {
          Settings.environment = "none";
        }

        const env = await Prompt.getEnvironment(environmentList);
        if (env) {
          this.environment = env.toLowerCase();
          this.isServerStarted && this.restartServer();
        }
      } else {
        Prompt.showPopupMessage("No Environment Found", "error");
      }
    }
  };
}
