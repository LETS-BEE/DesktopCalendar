<template>
  <div class="uk-text-center">
    <div class="uk-width-3-5 uk-display-inline-block">
      <img src="icon.png" alt="Desktop Calendar" id="main-icon" />
      <p class="uk-text-large uk-text-bold break-keep">
        Desktop Calendar를 설치해 주셔서 감사합니다!
      </p>
      <p class="uk-text-muted break-keep">
        Desktop Calendar은 Google Calendar 와 동기화 되어 여러 컴퓨터,
        핸드폰과도 동기화되는 달력입니다.
      </p>
      <button
        class="uk-button uk-margin-top uk-button-secondary uk-button-small"
        uk-slideshow-item="1"
        >
        시작하기
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'set-start'
};
</script>

<style>
#main-icon {
  width: 70px;
}
.break-keep {
  word-break: keep-all;
}
</style>
