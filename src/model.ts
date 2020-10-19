import { Valid_Config, Injectors } from "fake-response/dist/model";

export type ExtensionProperties = {
  saveAsNewFile: boolean;
  filterSchema: object;
  generateMock: {
    resourceTypeFilters: string[];
  };
  config: Valid_Config;
  mockPath: string;
  injectors: Injectors[];
  globals: object;
};
