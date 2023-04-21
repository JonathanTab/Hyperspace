import Browser from "webextension-polyfill";

var workspaces = []
var windows = []

async function createWorkspaceFromWindow(windowID, sendResponse) {
  let tabsResponse = await Browser.tabs.query({
    windowId: windowID
  })
  let newWorkspace = {
    id: Date.now(),
    name: "",
    tabs: []
  }

  tabsResponse.forEach(tab => {
    let newTab = {
      favIconUrl: tab.favIconUrl,
      index: tab.index,
      pinned: tab.pinned,
      title: tab.title,
      url: tab.url
    }
    newWorkspace.tabs.push(newTab);
  });
  workspaces.push(newWorkspace);
  sendResponse(newWorkspace.id)
}

async function loadWorkspace(workspaceID) {

}

async function sync() {
  //TODO this should eventually provide a way to resolve conflicts
}

async function deleteWorkspace(workspaceID) {}

Browser.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  switch (msg.mode) {
    case "get":
      sendResponse(workspaces)
      break;
    case "create":
      createWorkspaceFromWindow(msg.windowID, sendResponse);
      break;
    default:
      sendResponse("df")
      break;
  }
  return true;
});
