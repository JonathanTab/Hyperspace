<template>
  <main>
    <header>
      <button :style="{ visibility: currentWorkspaceId ? 'hidden' : 'visible' }" @click="trackThisWindow">
        Add this
        window
      </button><span> {{ state }}</span>
      <div id="errored" hidden style="margin: 0 2em; font-size: large;">
        <span :hidden="errored" style="color: #0FB;">✔</span>
        <span :hidden="!errored" style="color: #F00;">❌</span>
      </div>
      <configIcon style="height: 1rem;" />
    </header>
    <div id="workspaces">
      <Workspace
        v-for="workspace in workspaces" :key="workspace.id" :data="workspace" :initial-editing="true" :open="typeof getKeyByValue(windows, workspace.id) !== 'undefined' ? true : false"
        :class="workspace.id == currentWorkspaceId ? 'current' : 'other'"
        :expanded="workspace.id == focusedWorkspaceId ? true : false" @focus-change="focusedWorkspaceId = $event"
      />
    </div>
  </main>
</template>

<script setup>
import { ref, reactive } from "vue";
import Browser from "webextension-polyfill";
import Workspace from "~/components/Workspace.vue";
import configIcon from '~/assets/config.svg'

var workspaces = ref([]);
var windows = ref([]);
var currentWorkspaceId = ref(false);
var window = "";
var focusedWorkspaceId = ref(false);
var errored = false;
var state = ref("")


Browser.runtime.sendMessage({
    mode: "getWorkspaces"
});
Browser.runtime.sendMessage({
  mode: "getWindows"
});

async function updateList(data) {
  workspaces.value = data;
}
async function updateWindows(data) {
  window = await Browser.windows.getCurrent();
  windows.value = data;
  currentWorkspaceId.value = windows.value[window.id];
}

async function trackThisWindow() {
  const response = await Browser.runtime.sendMessage({ mode: "create", windowID: window.id });
}
function getKeyByValue(object, value) {
  return Object.keys(object).find(key => object[key] === value);
}

Browser.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  switch (msg.mode) {
    case "updateList":
      updateList(msg.data);
      Browser.runtime.sendMessage({
        mode: "getWindows"
      });
      break;
    case "updateWindows":
      updateWindows(msg.data)
      break;
    case "state":
      state.value = msg.msg;
  }
});

</script>

<style>
header {
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

#workspaces {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;
  align-content: stretch;
  align-items: top
}
</style>
