# Fake Response Server[](#fake-response-server)

This extension helps to generate mock from HAR file and generate a local mock server.
This also helps to filter any JSON file using the filter schema.
This extension is a wraper over for the node package `fake-response@6.2.2`.

Please visit [https://r35007.github.io/Fake-Response/](https://r35007.github.io/Fake-Response/) for further information.

## Table of contents

- [Commands](#commands)
  - [Start/Stop Server](#start/stop-server)
  - [Refresh/Restart Server](#Refresh/ReStart-server)
  - [Switch Environment](#switch-environment)
  - [Generate Mock](#generate-mock)
  - [Filter By Schema](#filter-by-schema)
  - [Get Routes List](#get-routes-list)
- [Settings](#settings)
  - [fake-response-server.settings.filterSchema](#fake-response-server.settings.filterschema)
  - [fake-response-server.settings.injectorsPath](#fake-response-server.settings.injectorspath)
  - [fake-response-server.settings.generateMockCallbackPath](#fake-response-server.settings.generatemockcallbackpath)

## Commands

### `Start/Stop Server`

This command generates a local mock server from the given `fakeResponse.mockPath` in the vs code settings.

![Start or Stop Server](https://github.com/R35007/fake-response-server/blob/master/images/start_stop.gif?raw=true)

### `Refresh/Restart Server`

This command restarts a local mock server. If any changes done to the settings or mock data please restart the server.

![Refresh or Restart Server](https://github.com/R35007/fake-response-server/blob/master/images/refresh_restart.gif?raw=true)

### `Switch Environment`

This command switches the mock data point environment files that are provided in the `fake-response-server.settings.paths.envPath` folder. You can also switch environment via `fake-response-server.settings.environment`

![Switch Environment](https://github.com/R35007/fake-response-server/blob/master/images/switch_environment.gif?raw=true)

### `Generate Mock`

This command helps to generate a mock data from HAR file. NOTE: The HAR file size must not be more than 4MB.

![Generate Mock](https://github.com/R35007/fake-response-server/blob/master/images/generate_mock.gif?raw=true)

### `Get Routes List`

This command gets the generated routes list after starting the server.
If any changes done to the mock please start again to refresh the server.
To send the request and see the response you need `Rest Client` vs code extension.

![Get Routes List](https://github.com/R35007/fake-response-server/blob/master/images/get_routes_list_preview.gif?raw=true)

### `Filter By Schema`

This command helps to filter any JSON file by using the schema provided from the vs code settings `fakeResponse.filterSchema`

![Filter JSON](https://github.com/R35007/fake-response-server/blob/master/images/filter_by_schema.gif?raw=true)

## Settings

### `fake-response-server.settings.filterSchema`

set the object property to be `true` that you want to show. The others would get filtered away.

- in `settings.json`

```json
"fake-response-server.settings.filterSchema":{
  "parent":{
    "child":{
      "foo" : true,
      "bar" : false
    }
  }
}
```

### `fake-response-server.settings.injectorsPath`

Provide the .js file path to `fake-response-server.settings.injectorsPath` in `settings.json` that default exports the injectors module.

- For Example: create a `injectors.js`

```js

module.exports = [
    {
        middleware: ({res}) => res.send("Override your response here")
        delay:3000,
        routes:{"/myRoute"}
    }
]
```

Now provide the js path in the settings.

### `fake-response-server.settings.generateMockCallbackPath`

Provide the .js file path to `fake-response-server.settings.generateMockCallbackPath` in the `settings.json` that default exports the callack method in the module.
This callback method is triggred for each entry in the HAR data. This helps to manipulate the data while generating the mock.

- For Example: create a `callback.js`

```js
module.exports = (entry, route, response) => {
  return { [route]: response }; // return {} If you want that to entry to filter it out.
};
```
