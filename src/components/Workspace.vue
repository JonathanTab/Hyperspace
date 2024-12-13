
<template>
  <div :id="data.id" class="workspace" :class="{ focused: expanded, open: open, incognito: data.incognito }"
    @dblclick.left="load" @contextmenu.prevent="$emit('focusChange', data.id)">
    <span class="incognitoDecorated" :hidden="expanded">{{ data.name }}</span>



    <template v-if="expanded">
      <header>
        <template v-if="!editing">
          <h3>{{ data.name }}</h3>
          <configIcon class="icon control" @click="editing = true" />
        </template>

        <template v-else>
          <form @submit.prevent="changeName">
            <input v-model="data.name" type="text" name="name" autocomplete="off" focus @dblclick.stop>
            <div class="actions">
              <button type="submit">
                Save
              </button><button type="button" @click="deleteThis()">
                Remove
              </button>
              <input type="checkbox" id="incognito" @change="changeIncognito()" v-model="data.incognito" />
              <label for="incognito">Incognito</label>
            </div>
          </form>
        </template>
      </header>
      <ul class="tabs">
        <li v-for="tab in data.tabs" :style="{ backgroundImage: 'url(' + tab.favIconUrl + ')' }">
          {{ tab.title }}
        </li>
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
const props = defineProps({ id: {}, data: {}, expanded: {}, initialEditing: { default: false }, open: { default: false } })

var editing = ref(false);
if (props.initialEditing == true) {
  editing.value = true;
}


async function load() {
  const response = await Browser.runtime.sendMessage({ mode: "load", workspaceID: props.data.id });
}
async function deleteThis() {
  const response = await Browser.runtime.sendMessage({ mode: "delete", workspaceID: props.data.id });
}
async function changeName() {
  const response = await Browser.runtime.sendMessage({ mode: "changeName", workspaceID: props.data.id, newName: props.data.name });
}
async function changeIncognito() {
  console.log(props.data.incognito);

  const response = await Browser.runtime.sendMessage({ mode: "changeIncognito", workspaceID: props.data.id, incognitoValue: props.data.incognito });
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


.workspace.current {
  border: 2px dashed darkgreen;
}

.workspace.incognito .incognitoDecorated {
  text-decoration: underline 3px rgba(79, 140, 233, 0.933);
}

.workspace.open {
  background-color: rgb(205, 248, 228);
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
