## v0.0.11

  - added `_dealy` prop to data.
  For Example :
  ```json
  {
    "/route":{
      "_delay" : 3000,
      "result" : []
    }
  }
  ```

  This about route give a response by the given delay
## v0.0.10

  - removed 
    - `fake-response-server.settings.resourceTypeFilters`
    - `fake-response-server.settings.showOnStatusbar`
  - added
    - `fake-response-server.settings.statusBar.show` - show or hide statusbar
    - `fake-response-server.settings.statusBar.position` - set "Right" or  "Left" position of the statusbar
    - `fake-response-server.settings.statusBar.priority` - helps to set the placement of the statusbar. the minium priority moves the statusbar to left most
  - output is optimized to debug.
  - now .har files under the environment folder will automatically get converted to a mock json while starting the server
  - `fake-response` is upgraded to v6.3.6

## v0.0.9

  - added `Fake Response: Reload` command. helps to reload the extension without reloading the vscode.
  - added `Fake Response` output. - helps to debug the log in the output.
  - bug fix

## v0.0.8

  - added `fake-response-server.settings.reverseRouteOrder` in settings. If true routes will be generated in a reverse order.

## v0.0.7

  - code optimized to backward compatible. Now available from vs code v1.30.0

## v0.0.6

  - added sortJson command - helps to sort any json array or object.
  - switching on environment will start the server when it is not started.

## v0.0.5

- updated MIT `LICENSE`
- lint fixes

## v0.0.4

- settings are renamed from `fakeResponse.xxx` to `fake-response-server.settings.xxx`
- uses node package `fake-response@6.3.5`
- provide callback method to generate mock.
- implemented environment switch.
- proxy and groupings are added to exclude routes by default.
- provide a injectors to generate local mock server.
- open file to generate a data.
- popup message.
- show and hide statusbar.
- show and hide info message.
- added more customizations in settings.
- code optimized.
- bug fix.

## v0.0.3

- added `fakeResponse.generateMock.resourceTypeFilters` - to filter resourceType while generating mock.
- removed `Fake Response: Restart Server`. instead use the same `Fake Response: Start Server` to refresh the server

## v0.0.2

- bug fix. get updated injectors.js file on restarting server.

## v0.0.1

- Initial release
