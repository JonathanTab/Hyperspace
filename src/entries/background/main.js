import browser from "webextension-polyfill";

var workspaces = {}
var windows = {}

function createWorkspaceFromWindow(windowID) {
  //
}

function loadWorkspace(workspaceID) {

}

function sync() {
  //TODO this should eventually provide a way to resolve conflicts
}

function deleteWorkspace(workspaceID) {}

browser.runtime.onMessage.addListener((msg, sender, response) => {
  switch (msg.command) {
    case "get":
      response(workspaces)
      break;
    default:
      response("df")
      break;
  }
});
