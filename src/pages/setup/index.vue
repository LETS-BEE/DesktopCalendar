<script setup lang="ts">
import headers from './components/Header.vue'
import start from './components/start.vue'
import googleAuth from './components/googleAuth.vue'
import setDesign from './components/setDesign.vue'
import setType from './components/setType.vue'
import setOption from './components/setOption.vue'
import end from './components/end.vue'
</script>

<template>
    <div>
        <headers />
        <div uk-slideshow="draggable: false">
            <ul class="uk-slideshow-items uk-margin-large-top">
                <li>
                <start />
                </li>
                <li>
                <googleAuth />
                </li>
                <li>
                <setDesign />
                </li>
                <li>
                <setType />
                </li>
                <li>
                <setOption />
                </li>
                <li>
                <end />
                </li>
            </ul>
        </div>
    </div>
</template>