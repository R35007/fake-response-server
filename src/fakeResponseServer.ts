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
    this.output.appendLine("\nFake Response Server Initiated");
    StatusbarUi.init();
  }

  generateMockFromHAR = async () => {
    this.output.appendLine(`\n[${new Date().toLocaleTimeString()}] [Running] Mock Generation initiated`);
    const writable = await this.getWritable([".json"], generateMockID);
    if (writable) {
      this.output.appendLine(`[${new Date().toLocaleTimeString()}] Mock Generation running...`);
      const { editorText, fileName, editor, document, textRange } = writable;
      try {
        const harObject = JSON.parse(editorText) as HAR;
        const mock = this.fakeResponse.transformHar(harObject, Settings.callback);
        this.writeFile(JSON.stringify(mock, null, "\t"), fileName, "Mock generated Successfully", editor, document, textRange);
        this.output.appendLine(`[${new Date().toLocaleTimeString()}] [Done] Mock generated Successfully`);
      } catch (err) {
        this.output.appendLine(`[${new Date().toLocaleTimeString()}] [Done] Failed to generate mock`);
        this.output.appendLine(err);
        Prompt.showPopupMessage(`Failed to generate mock. \n${err.message}`, "error");
      }
    }
  };

  filterBySchema = async () => {
    this.output.appendLine(`\n[${new Date().toLocaleTimeString()}] [Running] Filter JSON initiated`);
    const writeable = await this.getWritable([".json"], filterBySchemaID);
    if (writeable) {
      this.output.appendLine(`[${new Date().toLocaleTimeString()}] Filter JSON running...`);
      const { editorText, fileName, editor, document, textRange } = writeable;
      try {
        const filteredObject = this.fakeResponse.filterBySchema(JSON.parse(editorText), Settings.filterSchema);
        this.writeFile(JSON.stringify(filteredObject, null, "\t"), fileName, "Filtered Successfully", editor, document, textRange);
        this.output.appendLine(`[${new Date().toLocaleTimeString()}] [Done] Filtered Successfully`);
      } catch (err) {
        this.output.appendLine(`[${new Date().toLocaleTimeString()}] [Done] Failed to Filter`);
        this.output.appendLine(err);
        Prompt.showPopupMessage(`Failed to Filter. \n${err.message}`, "error");
      }
    }
  };

  getRoutesList = async () => {
    this.output.appendLine(`\n[${new Date().toLocaleTimeString()}] [Running] Get Routes List initiated`);
    const writable = await this.getWritable([".http"], getRoutesListID);
    if (writable) {
      this.output.appendLine(`[${new Date().toLocaleTimeString()}] Get Routes List running...`);
      const { fileName, editor, document, textRange } = writable;
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
        this.output.appendLine(`[${new Date().toLocaleTimeString()}] [Done] Routes List Fetched Successfully`);
      } catch (err) {
        this.output.appendLine(`[${new Date().toLocaleTimeString()}] [Done] Failed to Fetch Routes`);
        this.output.appendLine(err);
        Prompt.showPopupMessage(`Failed to Fetch Routes. \n${err.message}`, "error");
      }
    }
  };

  startServer = async (txt: string) => {
    this.output.appendLine(`\n[${new Date().toLocaleTimeString()}] [Running] Server ${txt} initiated`);
    try {
      if (Settings.mockPath.length) {
        this.output.appendLine(`[${new Date().toLocaleTimeString()}] Server ${txt}ing...`);
        StatusbarUi.working(`${txt}ing...`);
        const mock = this.getMockFromPath(Settings.mockPath);

        this.fakeResponse.setData(mock, Settings.config, Settings.injectors, Settings.globals);
        await this.fakeResponse.launchServer();

        this.isServerStarted = true;
        const statusMsg = `Server is ${txt}ed at port : ${Settings.port}`;
        StatusbarUi.stopServer(150, Settings.port, () => Prompt.showPopupMessage(statusMsg, "info"));
        this.output.appendLine(`[${new Date().toLocaleTimeString()}] [Done] Server is ${txt}ed at port : ${Settings.port}`);
      } else {
        this.isServerStarted = false;
        const statusMsg = `'fake-response-server.settings.paths.mockPath' - Please provide a valid path here`;
        this.output.appendLine(`[${new Date().toLocaleTimeString()}] ${statusMsg}`);
        Prompt.showPopupMessage(statusMsg, "error");
        StatusbarUi.startServer(0, () => Prompt.showPopupMessage(statusMsg, "error"));
      }
    } catch (err) {
      this.isServerStarted = false;
      this.output.appendLine(`[${new Date().toLocaleTimeString()}] [Done] Server Failed to ${txt}`);
      this.output.appendLine(err);
      const statusMsg = `Server Failed to ${txt}. \n ${err.message}`;
      StatusbarUi.startServer(0, () => Prompt.showPopupMessage(statusMsg, "error"));
    }
  };

  stopServer = async () => {
    this.output.appendLine(`\n[${new Date().toLocaleTimeString()}] [Running] Server Stop initiated`);
    try {
      this.output.appendLine(`[${new Date().toLocaleTimeString()}] Server Stopping`);
      if (this.isServerStarted) {
        StatusbarUi.working("Stopping...");

        await this.fakeResponse.stopServer();
        this.isServerStarted = false;
        StatusbarUi.startServer(150, () => Prompt.showPopupMessage("Server is Stopped", "info"));
        this.output.appendLine(`[${new Date().toLocaleTimeString()}] [Done] Server is Stopped`);
      } else {
        this.isServerStarted = true;
        this.output.appendLine(`[${new Date().toLocaleTimeString()}] [Done] No Server to Stop`);
        Prompt.showPopupMessage("No Server to Stop", "error");
        StatusbarUi.stopServer(0, Settings.port, () => Prompt.showPopupMessage("No Server to Stop", "error"));
      }
    } catch (err) {
      this.isServerStarted = true;
      this.output.appendLine(`[${new Date().toLocaleTimeString()}] [Done] Server Failed to Stop`);
      this.output.appendLine(err);
      const statsMsg = `Server Failed to Stop. \n${err.message}`;
      StatusbarUi.stopServer(0, Settings.port, () => Prompt.showPopupMessage(statsMsg, "error"));
    }
  };

  restartServer = async () => {
    if (this.isServerStarted) {
      try {
        this.output.appendLine(`\n[${new Date().toLocaleTimeString()}] [Running] Server Stop initiated`);
        await this.fakeResponse.stopServer();
        this.output.appendLine(`[${new Date().toLocaleTimeString()}] [Done] Server Stopped`);
        this.isServerStarted = false;
        StatusbarUi.startServer(150);
        this.startServer("Re Start");
      } catch (err) {
        this.output.appendLine(`[${new Date().toLocaleTimeString()}] [Done] Server Failed to Stop`);
        this.isServerStarted = true;
        StatusbarUi.stopServer(0, Settings.port);
        this.output.appendLine(err);
      }
    } else {
      this.isServerStarted = false;
      this.startServer("Start");
    }
  };

  switchEnvironment = async () => {
    this.output.appendLine(`\n[${new Date().toLocaleTimeString()}] [Running] Switch Environment initiated`);
    try {
      this.output.appendLine(`[${new Date().toLocaleTimeString()}] Switching Environment...`);
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
            this.output.appendLine(`[${new Date().toLocaleTimeString()}] [Done] Environment Switched to ${this.environment}`);
            this.restartServer();
          }
        } else {
          this.output.appendLine(`[${new Date().toLocaleTimeString()}] [Done] No Environment Found`);
          Prompt.showPopupMessage("No Environment Found", "error");
        }
      } else {
        this.output.appendLine(`[${new Date().toLocaleTimeString()}] 'fake-response-server.settings.paths.envPath' - Please provide a valid path here`);
        Prompt.showPopupMessage(`'fake-response-server.settings.paths.envPath' - Please provide a valid path here`, "error");
      }
    } catch (err) {
      this.output.appendLine(`[${new Date().toLocaleTimeString()}] [Done] Something went wrong`);
      this.output.appendLine(err);
      Prompt.showPopupMessage(`Something went wrong`, "error");
    }
  };

  sortJson = async () => {
    this.output.appendLine(`\n[${new Date().toLocaleTimeString()}] [Running] Sort JSON initiated`);
    const editorProps = this.getEditorProps();
    if (editorProps) {
      this.output.appendLine(`[${new Date().toLocaleTimeString()}] Sorting JSON...`);
      const { editor, document, selection, selectedText } = editorProps;
      try {
        const data = JSON.parse(selectedText);
        let sortedJson: any[] | object;
        if (data && Array.isArray(data) && data.length) {
          sortedJson = await this.getSortedArray(data);
        } else if (data && typeof data === "object" && !Array.isArray(data) && Object.keys(data).length) {
          sortedJson = await this.getSortedObject(data);
        }
        editor.edit((editBuilder) => {
          editBuilder.replace(selection, JSON.stringify(sortedJson, null, "\t"));
          this.output.appendLine(`[${new Date().toLocaleTimeString()}] [Done] Sorted Successfully`);
          Prompt.showPopupMessage("Sorted Successfully", "info");
        });
      } catch (err) {
        this.output.appendLine(`[${new Date().toLocaleTimeString()}] [Done] Sorting Failed`);
        this.output.appendLine(err);
        Prompt.showPopupMessage("Sorting Failed", "error");
      }
    }
  };
}
