# Fake Response Server[](#fake-response-server)

This extension helps to generate mock from HAR file and generate a local mock server.
This also helps to filter any JSON file using the filter schema.

## Table of contents

- [Commands](#commands)
  - [Generate Mock](#generate-mock)
  - [Start Server](#start-server)
  - [Get Generated Routes List](#get-generated-routes-list)
  - [Restart Server](#restart-server)
  - [Stop Server](#stop-server)
  - [Filter By Schema](#filter-by-schema)
- [Settings](#settings)
  - [fakeResponse.saveAsNewFile](#fakeresponse.saveasnewfile)
  - [fakeResponse.filterSchema](#fakeresponse.filterschema)
  - [fakeResponse.mockPath](#fakeresponse.mockpath)
  - [fakeResponse.injectorsPath](#fakeresponse.injectorspath)
  - [fakeResponse.globals](#fakeresponse.globals)
  - [fakeResponse.config.port](#fakeresponse.config.port)
  - [fakeResponse.config.baseUrl](#fakeresponse.config.baseurl)
  - [fakeResponse.config.env](#fakeresponse.config.env)
  - [fakeResponse.config.groupings](#fakeresponse.config.groupings)
  - [fakeResponse.config.proxy](#fakeresponse.config.proxy)
  - [fakeResponse.config.excludeRoutes.patternMatch](#fakeresponse.config.excluderoutes.patternmatch)
  - [fakeResponse.config.excludeRoutes.exactMatch](#fakeresponse.config.excluderoutes.exactmatch)
  - [fakeResponse.config.delay.time](#fakeresponse.config.delay.time)
  - [fakeResponse.config.delay.excludeRoutes.patternMatch](#fakeresponse.config.delay.excluderoutes.patternmatch)
  - [fakeResponse.config.delay.excludeRoutes.exactMatch](#fakeresponse.config.delay.excluderoutes.exactmatch)
- [Reference](#reference)

## Commands

### `Generate Mock`

This command helps to generate a mock data from HAR file.

![Generate Mock](https://github.com/R35007/fake-response-server/blob/master/images/generate_mock_preview.gif?raw=true)

### `Start Server`

This command generates a local mock server from the given `fakeResponse.mockPath` in the vs code settings.

![Start Server](https://github.com/R35007/fake-response-server/blob/master/images/start_mock_server_preview.gif?raw=true)

### `Get Generated Routes List`

This command gets tje generated routes list after starting the server.

![Get Generated Routes List](https://github.com/R35007/fake-response-server/blob/master/images/get_generated_routes_list_preview.gif?raw=true)

### `Restart Server`

Using this command Restart the server if any changes done to the mock or settings.

![Get Generated Routes List](https://github.com/R35007/fake-response-server/blob/master/images/restart_server_preview.gif?raw=true)

### `Stop Server`

Using this command stop any running server.

### `Filter By Schema`

This command helps to filter any JSON file by using the schema provided from the vs code settings `fakeResponse.filterSchema`

![Filter JSON](https://github.com/R35007/fake-response-server/blob/master/images/filter_preview.gif?raw=true)

## Settings

### `fakeResponse.saveAsNewFile`

If true the commands like `'Generate Mock'`, `'Filter By Schema'`, `'Get Generated Routes List'` will be generate in a new file.

### `fakeResponse.filterSchema`

set the object property to be `true` that you want to show. The others would get filtered away

### `fakeResponse.mockPath`

set the mock path here. any JSON inside the folder or file will be generate as a local mock server by the `Start Server` command

### `fakeResponse.injectorsPath`

Provide the .js file path that default exports the injectors module.

- For Example: create a injector.js

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

### `fakeResponse.globals`

This object helps to set initial value before generating a mock server.

### `fakeResponse.config.port`

Provide your port to generate a local mock server. default `3000`

### `fakeResponse.config.rootPath`

Provide the rootPath. The mock path will be relative to this path

### `fakeResponse.config.baseUrl`

set the base url for every generated routes

### `fakeResponse.config.env`

Provide Mock Environment

### `fakeResponse.config.groupings`

Provide URL mapping for Grouping Routes

### `fakeResponse.config.proxy`

Set your proxy here

### `fakeResponse.config.excludeRoutes.patternMatch`

Provide list of routes to exclude form generate local server that matches this pattern

### `fakeResponse.config.excludeRoutes.exactMatch`

Provide list of routes to exclude form generate local server that matches this route

### `fakeResponse.config.delay.time`

Provide a common delay in milliseconds

### `fakeResponse.config.delay.excludeRoutes.patternMatch`

Provide list of routes to exclude for delay that matches this pattern

### `fakeResponse.config.delay.excludeRoutes.exactMatch`

Provide list of routes to exclude for delay that matches this route

## Reference

For any other further doubts regarding the settings please visit [https://r35007.github.io/Fake-Response/](https://r35007.github.io/Fake-Response/)
