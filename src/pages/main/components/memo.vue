<template>
    <div class="memo-container uk-container uk-flex-column uk-flex-1 uk-padding-remove" ref="styleElement">
        <div class="uk-padding-remove">
            <h2 class="uk-padding-small uk-margin-remove" style="text-align: center;" ref="memoTitle">메모장</h2>
            <hr class="uk-divider-icon uk-margin-remove" />
        </div>
        <div class="uk-padding-remove uk-flex-stretch uk-inline" @dblclick="enableEditor" @mouseover="useEnableMouse" @mouseout="useDisableMouse" style="height: 90%; width: 100%;" >
            <div class="uk-margin-small-left uk-margin-small-right" ref="viewer"/>
            <div v-show="showEditor" class="uk-position-fix uk-position-top" style="height: 90%;">
                <div ref="editor" />
                <button class="uk-align-right uk-button uk-button-secondary uk-button-small uk-padding-small-top"  @click='endEdit'>확인</button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref, inject, watch } from 'vue'
// @ts-ignore
import { Editor } from '@toast-ui/editor'
// @ts-ignore
// import Viewer from '@toast-ui/editor/viewer'
import '@toast-ui/editor/dist/toastui-editor.css'
import '@toast-ui/editor/dist/toastui-editor-viewer.css'
import { useNoteMemoStore, useEnableMouse, useDisableMouse, DesktopCalStore, convertColor } from '../../../composables/util'

// const store = new Store();

const editor = ref()
const viewer = ref()

let editorValid = ref<Editor>()
let viewerValid = ref()

var showEditor = ref(false)

const store = inject("DeskCalStore") as DesktopCalStore
const styleElement = ref<HTMLElement>()
const memoTitle = ref<HTMLElement>()

onMounted(async () => {
    var memoValue = await useNoteMemoStore()
    
    editorValid = new Editor({
        el: editor.value,
        height: '100%',
        //'wysiwyg', 'markdown' 택 1
        initialEditType: 'wysiwyg',
        initialValue: memoValue,
        toolbarItems: [
            ['bold', 'italic', 'strike'],
            ['ul', 'ol', 'task'],
            ['table', 'image', 'link']
        ],
        useCommandShortcut: true,
        hideModeSwitch: true,
        autofocus: true,
        usageStatistics: false,
    })

    viewerValid.value = Editor.factory({
        el: viewer.value,
        initialValue: memoValue,
        viewer: true
    })

    
    if (memoTitle.value) {
        memoTitle.value.style.color = store.options.timerStyle.color
    }
    if (styleElement.value) {
        styleElement.value.style.backgroundColor = convertColor("hex", store.options.calendar.background) as string
        styleElement.value.style.borderColor = convertColor("hex", store.options.calendar.color) as string
    }
})

const enableEditor = () => {
    if (!showEditor.value) {
        showEditor.value = true
        // @ts-ignore
        editorValid.focus()
    }
}

const endEdit = () => {
    if (showEditor.value) {
        showEditor.value = false
        // @ts-ignore
        useNoteMemoStore(editorValid.getHTML())
        // @ts-ignore
        viewerValid.value.setMarkdown(editorValid.getHTML())
    }
}

watch(store.$state, (newValue) => {
    if (memoTitle.value) {
        memoTitle.value.style.color = newValue.options.timerStyle.color
    }
    if (styleElement.value) {
        styleElement.value.style.backgroundColor = convertColor("hex", newValue.options.calendar.background) as string
        styleElement.value.style.borderColor = convertColor("hex", newValue.options.calendar.color) as string
    }

})

</script>

<style>
.memo-container {
    color: rgb(0,0,0);
    height: 100%;
    box-sizing: border-box;
    border:1px solid #e5e5e5;
    background-color: rgba(255, 255, 255, 0.3);
}

.toastui-editor-popup-add-image {
    left: 0px !important
}

.toastui-editor-contents ul > li::before {
    background-color: black;
}

.toastui-editor-contents ol > li::before {
    color: black
}

</style>