<template>
  <main>
    <header><button :hidden="tracked" @click="trackThisWindow">Add this window</button></header>
    <Workspaces></Workspaces>
  </main>
</template>

<script setup>
import { ref } from "vue";
import Browser from "webextension-polyfill";
import Workspaces from "~/components/Workspaces.vue";


var tracked = ref(false)

async function trackThisWindow() {
  let window = await Browser.windows.getCurrent()
  const response = await Browser.runtime.sendMessage({ mode: "create", windowID: window.id });
  alert(response);
}

</script>

<style></style>
