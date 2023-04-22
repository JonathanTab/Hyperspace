<template>
  <div class="workspace" :id="data.id"><span :hidden="expanded">{{ data.name }}</span>
    <template v-if="expanded">
      <header>
        {{ data.name }}
        <configIcon />
      </header>

    </template>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import configIcon from '~/assets/config.svg'

defineProps(['id', 'data'])

var expanded = ref(false)

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

.workspace .header {
  display: flex;
  align-items: center;
  border-bottom: 1px solid #f0f0f0
}

.workspace .header h3 {
  margin-right: auto;
  display: inline-flex;
  align-items: center;
  cursor: pointer
}

.workspace .header .icon:hover,
.workspace .header h3:hover {
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
