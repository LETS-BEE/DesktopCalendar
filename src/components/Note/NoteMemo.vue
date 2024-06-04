<template>
    <div class="memo-container uk-container uk-flex-column uk-flex-1 uk-margin-medium-left uk-padding-remove" style="color: rgb(0,0,0); height: 100%; box-sizing: border-box; border:1px solid #e5e5e5; background-color: rgba(255, 255, 255, 0.3);">
        <div class="uk-padding-remove">
            <h2 class="uk-padding-small uk-margin-remove" style="text-align: center;">메모장</h2>
            <hr class="uk-divider-icon uk-margin-remove" />
        </div>
        <div class="uk-padding-remove uk-flex-stretch uk-inline" @dblclick="enableEditor" @mouseover="setIgnore" @mouseout="disableIgnore" style="height: 90%; width: 100%;" >
            <div class="uk-margin-small-left uk-margin-small-right" ref="viewer"/>
            <div v-show="showEditor" class="uk-position-fix uk-position-top" style="height: 90%;">
                <div ref="editor" />
                <button class="uk-align-right uk-button uk-button-secondary uk-button-small uk-padding-small-top"  @click='endEdit'>확인</button>
            </div>
        </div>
    </div>
</template>

<script setup>
import Store from 'electron-store'
import { onMounted, ref} from 'vue';
import Editor from '@toast-ui/editor';
import Viewer from '@toast-ui/editor/dist/toastui-editor-viewer';
import '@toast-ui/editor/dist/toastui-editor.css';
import '@toast-ui/editor/dist/toastui-editor-viewer.css';
/* eslint-disable */

const store = new Store();

const editor = ref()
const editorValid = ref()
const viewer = ref()
const viewerValid = ref()
var showEditor = ref(false)

onMounted(async () => {
    var memoValue = await store.get('memo')
    // console.log(store.get('memo'))
    if (memoValue === undefined) {
        memoValue = ''
    }

    editorValid.value = new Editor({
        el: editor.value,
        height: '100%',
        //'wysiwyg', 'markdown' 택 1
        initialEditType: 'wysiwyg',
        initialValue: memoValue,
        toolbarItems: [
            ['bold', 'italic', 'strike'],
            ['ul', 'ol', 'task'],
            ['table', 'image']
        ],
        useCommandShortcut: true,
        hideModeSwitch: true,
        autofocus: true,
        usageStatistics: false,
    })

    viewerValid.value = new Viewer({
        el: viewer.value,
        initialValue: memoValue,
    })
})

const enableEditor = (payload) => {
    if (!showEditor.value) {
        showEditor.value = true
        editorValid.value.focus()
    }
}

const endEdit = (payload) => {
    if (showEditor.value) {
        showEditor.value = false
        store.set('memo', editorValid.value.getHTML())
        viewerValid.value.setMarkdown(editorValid.value.getHTML())
    }
}

</script>