<template>
  <div class="uk-margin-large-top uk-text-center">
    <p class="uk-text-large">
      이제 모두 끝났습니다. <br />
      <span class="uk-text-small">
        혹시 다시 설정하고 싶으면 뒤로 버튼을 클릭 해주세요.
      </span>
    </p>
    <button
      class="uk-button uk-button-danger uk-button-small uk-margin-large-top uk-margin-large-right"
      uk-slideshow-item="0"
    >뒤로</button>
    <button
      class="uk-button uk-button-primary uk-button-small uk-margin-large-top"
      @click="start"
      >시작하기</button
    >
  </div>
</template>

<script>
import { ipcMain } from '@electron/remote';

export default {
  name: "start-end",
  methods: {
    start() {
      ipcMain.emit("settingend");
    }
  }
};
</script>

<style></style>
