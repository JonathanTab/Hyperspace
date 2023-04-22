<template>
  <div @dblclick="load" @click="$emit('focusChange', data.id)" class="workspace" :class="{ focused: expanded }"
    :id="data.id">

    <span :hidden="expanded">{{ data.name }}</span>


    <template v-if="expanded">
      <header>

        <template v-if="!editing">
          <h3>{{ data.name }}</h3>
          <configIcon class="icon control" @click="editing = true" />
        </template>

        <template v-else>
          <form><input type="text" name="name" v-model="data.name" autocomplete="off" focus>
            <div class="actions"><button type="submit">Save</button><button type="button">Remove</button></div>
          </form>
        </template>

      </header>
      <ul class="tabs">
        <li v-for="tab in data.tabs" :style="{ backgroundImage: 'url(' + tab.favIconUrl + ')' }">{{ tab.title }}</li>
      </ul>

    </template>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import configIcon from '~/assets/config.svg'
import Browser from "webextension-polyfill";
import { emit } from 'process';

defineEmits(['focusChange']);
const props = defineProps({ id: {}, data: {}, expanded: {}, initialEditing: { default: false } })

var editing = ref(false);
if (props.initialEditing == true) {
  editing = true;
}


async function load() {
  const response = await Browser.runtime.sendMessage({ mode: "load", workspaceID: props.id });
}

</script>

<style>
.workspace {
  height: 2rem;
  padding: 0 .5rem;
  margin: 0 .25rem .25rem 0;
  display: inline-flex;
  align-items: center;
  border-radius: .15rem;
  cursor: pointer;
  outline: none;
  background: #f5f5f5
}

workspace:hover {
  background: #f0f0f0
}

.workspace.focused {
  padding: .25rem;
  display: block;
  cursor: default;
  height: auto;
  margin-right: 0
}

.workspace header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #f0f0f0
}

.workspace header h3 {
  margin-right: auto;
  display: inline-flex;
  align-items: center;
  cursor: pointer
}

.workspace header .icon:hover,
.workspace header h3:hover {
  color: #111
}

.workspace ul {
  padding: .15rem 0 0;
  list-style: none;
  margin: 0
}

.workspace ul li {
  width: 18rem;
  padding-left: 1.4rem;
  background: no-repeat 0/1.2rem auto;
  cursor: pointer
}

.workspace ul li span {
  display: block;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis
}

.workspace ul li span:first-letter {
  text-transform: uppercase
}

.workspace ul li:hover {
  color: #111
}
</style>
