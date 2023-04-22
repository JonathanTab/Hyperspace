<template>
  <main>
    <header><button :hidden="currentWorkspaceId" @click="trackThisWindow">Add this window</button><span>Syncing</span>
      <configIcon style="height: 1rem;" />
    </header>
    <div id="workspaces">
      <Workspace v-for="workspace in workspaces" :key="workspace.id" :data="workspace"
        :class="workspace.id == currentWorkspaceId ? 'current' : 'other'">
      </Workspace>
    </div>

  </main>
</template>

<script setup>
import { ref, reactive } from "vue";
import Browser from "webextension-polyfill";
import Workspace from "~/components/Workspace.vue";
import configIcon from '~/assets/config.svg'

var workspaces = ref([]);
var currentWorkspaceId = ref(false);
var window = "";


updateCurrentWorkspaceId();
updateList();

async function updateCurrentWorkspaceId() {
  window = await Browser.windows.getCurrent();
  let res = await Browser.runtime.sendMessage({
    mode: "identifyWindow", windowID: window.id
  });
  if (res == false) {
    currentWorkspaceId.value = false
  } else {
    currentWorkspaceId.value = res
  }
}
async function updateList() {
  workspaces.value = await Browser.runtime.sendMessage({ mode: "get" });
}

async function trackThisWindow() {
  const response = await Browser.runtime.sendMessage({ mode: "create", windowID: window.id });
  updateCurrentWorkspaceId()
  updateList()

}


Browser.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  switch (msg.mode) {
    case "updateList":
      updateList()
      break;
  }
});

</script>

<style>
header {
  display: flex;
  align-items: center
}

#workspaces {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;
  align-content: stretch;
  align-items: top
}
</style>
