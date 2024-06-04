<template>
  <div class="uk-margin-large-top uk-text-center">
    <p class="uk-text-lead">프로그램 세부 설정</p>
    <p>
      시작시 프로그램 자동 실행
      <input
        type="checkbox"
        class="uk-checkbox"
        v-model="autoStart"
        @change="changeMode"
      />
    </p>
    <p>
      달력 갱신 시간
      <select class="uk-select uk-width-1-6" @change="setTime">
        <option value="60">1분</option>
        <option value="300">5분</option>
        <option value="600" selected="selected">10분</option>
        <option value="1800">30분</option>
        <option value="3600">1시간</option>
        <option value="10800">3시간</option>
      </select>
    </p>
    <button
      class="uk-button uk-button-primary uk-button-small uk-position-medium uk-position-top-right"
      uk-slideshow-item="5"
      >다음</button
    >
  </div>
</template>

<script>
import * as remote from '@electron/remote'

const app = remote.app

export default {
  data() {
    return {
      autoStart: false
    };
  },
  name: "start-option",
  methods: {
    changeMode(e) {
      if (e.target.checked) {
        app.setLoginItemSettings({
          openAtLogin: true,
          name: "Desktop Calendar"
        })
      } else {
        app.setLoginItemSettings({
          openAtLogin: false,
          name: "Desktop Calendar"
        })
      }
    },
    setTime(e) {
      this.$store.commit("setOptions", {
        key: "refreshTime",
        value: e.target.value
      })
    }
  },
  mounted() {
    var temp = app.getLoginItemSettings().openAtLogin
    if (process.platform == 'win32')
      temp = app.getLoginItemSettings().executableWillLaunchAtLogin
    this.autoStart = temp
  }
};
</script>

<style></style>
