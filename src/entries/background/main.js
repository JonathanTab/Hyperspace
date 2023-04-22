import Browser from "webextension-polyfill";

var settings = {
  syncURL: "https://instrumenta.cf/sync.php",
  appID: "hyperspace",
  password: "d2ert"
}

var workspaces = []
var windows = []

async function createWorkspaceFromWindow(windowID, sendResponse) {
  let tabsResponse = await Browser.tabs.query({
    windowId: windowID
  })
  let newWorkspace = {
    id: Date.now(),
    name: "Rename me",
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
  windows.push({
    windowID: windowID,
    workspaceID: newWorkspace.id
  })
  triggerUpdateList();
  sendResponse(newWorkspace.id)
}

async function loadWorkspace(workspaceID) {

}

async function sync() {
  //TODO this should eventually provide a way to resolve conflicts
  (async () => {
    const rawResponse = await fetch('https://httpbin.org/post', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        a: 1,
        b: 'Textual content'
      })
    });
    const content = await rawResponse.json();

    console.log(content);
  })();
}

async function deleteWorkspace(workspaceID) {}

async function triggerUpdateList() {
  Browser.runtime.sendMessage({
    mode: "updateList"
  });
}

Browser.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  switch (msg.mode) {
    case "get":
      sendResponse(workspaces)
      break;
    case "identifyWindow":
      if (windows.some((e) => e.windowID == msg.windowID)) {
        sendResponse(windows.find((e) => e.windowID == msg.windowID).workspaceID)
      } else {
        sendResponse(false);
      }
      break;
    case "create":
      createWorkspaceFromWindow(msg.windowID, sendResponse);
      break;
    case "load":
      loadWorkspace(msg.workspaceID, sendResponse);
      break;
    default:
      sendResponse("df")
      break;
  }
  return true;
});
