import {
  data
} from "autoprefixer";
import Browser from "webextension-polyfill";

var settings = {
  syncURL: "https://instrumenta.cf/sync.php",
  appID: "hyperspace",
}
var apiKey = "";

var workspaces = "not ready"
var windows = "not ready";
var baseTimestamp = ""
var saving = false
console.log("service worker spawned");


function saveState() {
  Browser.storage.session.set({ windows: windows, workspaces: workspaces, baseTimestamp: baseTimestamp });
}
async function resumeLocalStateOrInit() {
  return new Promise((resolve, reject) => {
    if (windows == "not ready") {
      console.log('resuming Worker');
      Browser.storage.sync.get('apiKey').then((result) => {
        apiKey = result.apiKey
        Browser.storage.session.get(['windows', 'workspaces', 'baseTimestamp']).then((result) => {
          if (typeof result.windows == 'undefined') {

            windows = {};
          } else {
            windows = result.windows;
          }
          if (typeof result.workspaces == 'undefined') {
            console.log("workspaces init");

            workspaces = [];
          } else {
            console.log("workspaces loaded from session");

            workspaces = result.workspaces;
            baseTimestamp = result.baseTimestamp;
          }
          //if anything got initializ
          // ed
          saveState();
          resolve();
        });
      });
    } else {
      resolve();
    }
  });
}

async function createWorkspaceFromWindow(windowID, sendResponse) {
  let windowResponse = await Browser.windows.get(windowID);
  let newWorkspace = {
    id: Date.now(),
    name: "Rename me",
    incognito: windowResponse.incognito,
    tabs: await createTabsArray(windowID)
  }


  workspaces.push(newWorkspace);
  windows[windowID] = newWorkspace.id
  saveState();
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
    if (typeof getKeyByValue(windows, workspaceId) !== 'undefined') {
      Browser.windows.update(parseInt(getKeyByValue(windows, workspaceId)), { focused: true })
    } else {
      let tabs = []
      workspaces[workspaceIndex].tabs.forEach(async e => {
        tabs.push(e.url);
      });
      let window = await Browser.windows.create({
        url: tabs,
        incognito: workspaces[workspaceIndex].incognito
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

      windows[window.id] = workspaceId;
      saveState();
      pushWindows();
    }
  } else {
    sendError("Cant find that workspace");
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
  var URL = settings.syncURL + "?apikey=" + apiKey + "&appID=" + settings.appID
  //TODO this should eventually provide a way to resolve conflicts
  //Should we read or write?


  if (localChanges == true) {
    saveState();
    let response = await fetch(URL + "&mode=stamp")
    if (!response.ok) {
      Browser.runtime.sendMessage({
        mode: "state",
        msg: "Failed checking server. Bad Key?"
      });
    }
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
          msg: "Failed writing to server. Bad Key?"
        });
      }
      baseTimestamp = response.headers.get('timestamp')
      saveState();
      saving = false;
    } else {
      //remote timestamp bigger
      sendError("Failed save. Remote store is newer: " + remoteTimestamp + " v " + baseTimestamp);
    }
  } else

  //No local changes- Get only
  {
    if (saving == false) {
      let response = await fetch(URL + "&mode=get")
      if (!response.ok) {
        Browser.runtime.sendMessage({
          mode: "state",
          msg: "Failed reading server. Bad Key?"
        });
      } else {
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
      saveState();
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
function pushWindows() {
  Browser.runtime.sendMessage({
    mode: "updateWindows",
    data: windows
  }).catch((e) => { });
}

function sendError(msg) {
  Browser.runtime.sendMessage({
    mode: "state",
    msg: msg
  });
}
function getKeyByValue(object, value) {
  return Object.keys(object).find(key => object[key] === value);
}

async function deleteWorkspace(workspaceID, sendResponse) {
  let workspaceIndex = workspaces.findIndex((e) => {
    return e.id == workspaceID;
  })
  if (workspaceIndex > -1) { // only splice array when item is found
    workspaces.splice(workspaceIndex, 1); // 2nd parameter means remove one item only
  }

  let windowKey = getKeyByValue(windows, workspaceID);
  if (typeof windowKey !== 'undefined') {
    delete (windows[windowKey])
    saveState();
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
  if (index > -1) {
    workspaces[index].name = newName
  }

  syncChanges();
  sendResponse();
}
async function changeWorkspaceIncognito(workspaceID, incognitoValue, sendResponse) {
  let index = workspaces.findIndex((e) => {
    return e.id == workspaceID;
  })
  if (index > -1) {
    workspaces[index].incognito = incognitoValue
  }

  syncChanges();
  sendResponse();
}

async function windowRegen(windowId) {
  await resumeLocalStateOrInit();
  if (windows[windowId] !== 'undefined') {
    console.log(windows[windowId]);

    let index = workspaces.findIndex((e) => {
      return e.id == windows[windowId];
    })
    console.log(index);
    if (index > -1) {
      workspaces[index].tabs = await createTabsArray(windowId);
      console.log("created array");
      syncChanges();
    }
  }
}


////////////////////////////////
//Listeners
////////////////////////////////

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
Browser.windows.onRemoved.addListener(async (windowID) => {
  await resumeLocalStateOrInit();
  delete (windows[windowID]);
  saveState();
  pushWindows();
});

Browser.runtime.onMessage.addListener(async (msg, sender, sendResponse) => {
  await resumeLocalStateOrInit();
  switch (msg.mode) {
    case "getWorkspaces":
      sendResponse();
      sync()
      pushWorkspaces()
      sync();
      break;
    case "getWindows":
      sendResponse();
      pushWindows()
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
    case "changeIncognito":
      changeWorkspaceIncognito(msg.workspaceID, msg.incognitoValue, sendResponse)
      break;
    case "setApiKey":
      // Store the API key in chrome.storage.sync
      Browser.storage.sync.set({ apiKey: msg.apiKey });
      apiKey = msg.apiKey
      Browser.storage.session.remove("workspaces").then((result) => {
        workspaces = "not ready"
        windows = "not ready";
        baseTimestamp = ""
        sendError('API key set')
        resumeLocalStateOrInit();
        pushWorkspaces();
        sync();
      });


      break;
    case "getApiKey":
      Browser.runtime.sendMessage({
        mode: "apiKey",
        apiKey: apiKey
      });
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

resumeLocalStateOrInit()
