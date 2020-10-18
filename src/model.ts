import { Config, Injectors } from "fake-response/dist/model";

export type ExtensionProperties = {
  saveAsNewFile: boolean;
  filterSchema: object;
  config: Config;
  mockPath: string;
  injectors: Injectors[];
  globals: object;
};
