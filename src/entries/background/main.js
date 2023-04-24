import {
  data
} from "autoprefixer";
import Browser from "webextension-polyfill";

var settings = {
  syncURL: "https://instrumenta.cf/sync.php",
  appID: "hyperspace",
  password: "d2ert"
}

//TODO need to deal with removing windows when closed or workspace deleted
var workspaces = []
var windows = []
var baseTimestamp = ""
var saving = false

async function createWorkspaceFromWindow(windowID, sendResponse) {
  let newWorkspace = {
    id: Date.now(),
    name: "Rename me",
    tabs: await createTabsArray(windowID)
  }


  workspaces.push(newWorkspace);
  windows.push({
    windowId: windowID,
    workspaceId: newWorkspace.id
  })
  //For snappy ui
  pushWorkspaces();
  syncChanges();
  sendResponse(newWorkspace.id)
}

async function createTabsArray(windowID) {
  let tabsArray = [];
  let tabsResponse = await Browser.tabs.query({
    windowId: windowID
  })
  tabsResponse.forEach(tab => {
    tabsArray.push({
      favIconUrl: tab.favIconUrl,
      index: tab.index,
      pinned: tab.pinned,
      title: tab.title,
      url: tab.url
    });
  });
  return tabsArray;
}

async function loadWorkspace(workspaceId, sendResponse) {
  sendResponse();
  let workspaceIndex = workspaces.findIndex((e) => {
    return e.id == workspaceId;
  })
  if (workspaceIndex > -1) {
    let tabs = []
    workspaces[workspaceIndex].tabs.forEach(async e => {
      tabs.push(e.url);
    });
    let window = await Browser.windows.create({
      url: tabs
    })

    let tabsResponse = await Browser.tabs.query({
      windowId: window.id
    })
    let i = 0
    tabsResponse.forEach(tab => {
      if (i !== 0) {
        setTimeout(() => {
          Browser.tabs.discard(tab.id)
        }, 500)
      }
      i = i++;
    });

    windows.push({
      windowId: window.id,
      workspaceId: workspaceId
    });
  } else {
    err("Cant find that workspace");
  }
}
const debounce = (callback, wait) => {
  let timeoutId = null;
  return (...args) => {
    self.clearTimeout(timeoutId);
    timeoutId = self.setTimeout(() => {
      callback.apply(null, args);
    }, wait);
  };
}

function syncChanges() { saving = true; syncChangesPT2(); }
const syncChangesPT2 = debounce(() => {
  sync(true);
}, 750);

async function sync(localChanges = false) {
  var URL = settings.syncURL + "?p=" + settings.password + "&appID=" + settings.appID
  //TODO this should eventually provide a way to resolve conflicts
  //Should we read or write?


  if (localChanges == true) {
    let response = await fetch(URL + "&mode=stamp")
    let remoteTimestamp = await response.text();
    if (!isNaN(parseInt(remoteTimestamp)) && !isNaN(parseInt(baseTimestamp)) && (parseInt(baseTimestamp) == parseInt(remoteTimestamp))) {
      //our base is up to date
      let response = await fetch(URL + '&mode=write', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(workspaces)
      });
      if (!response.ok) {
        Browser.runtime.sendMessage({
          mode: "state",
          msg: "Failed writing to remote store"
        });
      }
      baseTimestamp = response.headers.get('timestamp')
      saving = false;
    } else {
      //remote timestamp bigger
      err("Failed save. Remote store is newer: " + remoteTimestamp + " v " + baseTimestamp);
    }
  } else

  //No local changes- Get only
  {
    if (saving == false) {
      let response = await fetch(URL + "&mode=get")
      if (!response.ok) {
        Browser.runtime.sendMessage({
          mode: "state",
          msg: "Failed reading remote store"
        });
      }
      let text = await response.text()
      if (text.length > 2) {
        workspaces = JSON.parse(text)
      } else {
        Browser.runtime.sendMessage({
          mode: "state",
          msg: "Blank remote store. Initialized"
        });
      }
      baseTimestamp = response.headers.get('timestamp')
    }
  }
  pushWorkspaces();
}

function pushWorkspaces() {
  Browser.runtime.sendMessage({
    mode: "updateList",
    data: workspaces
  }).catch((e) => { });
}

function err(msg) {
  Browser.runtime.sendMessage({
    mode: "state",
    msg: msg
  });
}

async function deleteWorkspace(workspaceID, sendResponse) {
  let index = workspaces.findIndex((e) => {
    return e.id == workspaceID;
  })
  if (index > -1) { // only splice array when item is found
    workspaces.splice(index, 1); // 2nd parameter means remove one item only
  }

  index = windows.findIndex((e) => {
    return e.workspaceId == workspaceID;
  })
  if (index > -1) { // only splice array when item is found
    windows.splice(index, 1); // 2nd parameter means remove one item only
  }
  //For snappy ui
  pushWorkspaces();
  syncChanges();
  sendResponse();
}
async function changeWorkspaceName(workspaceID, newName, sendResponse) {
  let index = workspaces.findIndex((e) => {
    return e.id == workspaceID;
  })
  if (index > -1) { // only splice array when item is found
    workspaces[index].name = newName
  }

  syncChanges();
  sendResponse();
}

Browser.tabs.onUpdated.addListener((tabID, changeInfo, tab) => {
  if (changeInfo.status == "complete" || typeof changeInfo.favIconUrl !== "undefined") {
    windowRegen(tab.windowId);
  }
})
Browser.tabs.onRemoved.addListener((tabId, removeInfo) => {
  if (removeInfo.isWindowClosing !== true) {
    windowRegen(removeInfo.windowId)
  }
})
Browser.tabs.onDetached.addListener((tabId, detachInfo) => {
  windowRegen(detachInfo.oldWindowId)
})
Browser.tabs.onAttached.addListener((tabId, attachInfo) => {
  windowRegen(attachInfo.newWindowId)
})
async function windowRegen(windowId) {

  let windowIndex = windows.findIndex((e) => {
    return e.windowId == windowId;
  })
  if (windowIndex > -1) {
    let workspaceIndex = workspaces.findIndex((e) => {
      return e.id == windows[windowIndex].workspaceId;
    })
    if (workspaceIndex > -1) {
      workspaces[workspaceIndex].tabs = await createTabsArray(windowId);
    }
  }
  syncChanges();
}

Browser.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  switch (msg.mode) {
    case "get":
      sendResponse();
      pushWorkspaces()
      sync();
      break;
    case "identifyWindow":
      if (windows.some((e) => e.windowId == msg.windowID)) {
        sendResponse(windows.find((e) => e.windowId == msg.windowID).workspaceId)
      } else {
        sendResponse(false);
      }
      break;
    case "create":
      createWorkspaceFromWindow(msg.windowID, sendResponse);
      break;
    case "delete":
      deleteWorkspace(msg.workspaceID, sendResponse);
      break;
    case "changeName":
      changeWorkspaceName(msg.workspaceID, msg.newName, sendResponse)
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

sync();
