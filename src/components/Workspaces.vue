<template>
  <button class="bg-black-100">Track this window</button>
</template>

<script setup>
import { ref } from "vue";

const count = ref(0);

const increment = async () => (count.value = await chrome.runtime.sendMessage({greeting: "ello"}));
</script>

<style>
</style>
