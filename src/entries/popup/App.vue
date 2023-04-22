<template>
  <main>
    <header><button :hidden="tracked" @click="trackThisWindow">Add this window</button><span>Syncing</span></header>
    <div id="workspaces">
      <Workspace v-for="workspace in workspaces" :id="workspace.id"></Workspace>
    </div>

  </main>
</template>

<script setup>
import { ref } from "vue";
import Browser from "webextension-polyfill";
import Workspace from "~/components/Workspace.vue";

var workspaces = ref([]);
var tracked = ref(false)


updateList();
updateTracked();


async function updateTracked() {
  let window = await Browser.windows.getCurrent();
  let res = await Browser.runtime.sendMessage({
    mode: "identifyWindow", windowID: window.id
  });
  if (res == false) {
    tracked.value = false
  } else {
    tracked.value = true
  }
}
async function updateList() {
  workspaces.value = await Browser.runtime.sendMessage({ mode: "get" });
}

async function trackThisWindow() {
  tracked = true;
  let window = await Browser.windows.getCurrent();
  const response = await Browser.runtime.sendMessage({ mode: "create", windowID: window.id });

}


Browser.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  switch (msg.mode) {
    case "updateList":
      updateList()
      break;
  }
});

</script>

<style></style>
