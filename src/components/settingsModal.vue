<template>
  <configIcon @click="toggleModal" style="height: 1rem;" />
  <div v-if="showModal" class="modal">
    <div class="modal-content">
      <h3>Set API Key</h3>
      <button class="close-button" @click="closeModal">X</button>
      <input v-model="apiKey" placeholder="Enter your API key" />
      <button @click="submitApiKey">Submit</button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from "vue";
import Browser from "webextension-polyfill";

import configIcon from '~/assets/config.svg'
const showModal = ref(false);
const apiKey = ref("");

Browser.runtime.sendMessage({
  mode: "getApiKey"
});

function openModal() {
  showModal.value = true;
}
function closeModal() {
  showModal.value = false;
}
function toggleModal() {
  showModal.value = !showModal.value;
}

async function submitApiKey() {
  if (apiKey.value.trim()) {
    // Send the API key to the service worker
    await Browser.runtime.sendMessage({ mode: "setApiKey", apiKey: apiKey.value });
    showModal.value = false; // Close the modal after submission
  } else {
    alert("API key cannot be empty!");
  }
}

Browser.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  switch (msg.mode) {
    case "apiKey":
      apiKey.value = msg.apiKey
      if (apiKey.value == undefined) {
        openModal();
      }
      break;
  }
});


// Expose the openModal function so it can be called from the parent
defineExpose({ openModal });

</script>

<style scoped>
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-content {
  background: white;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
}

.close-button {
  position: relative;
  top: -20vh;
  right: -48%;
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
}

input {
  margin-bottom: 10px;
  padding: 5px;
  width: 100%;
}

button {
  padding: 5px 10px;
  cursor: pointer;
}
</style>
