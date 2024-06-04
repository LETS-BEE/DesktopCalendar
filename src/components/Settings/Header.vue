<template>
  <div class="uk-card uk-card-default" uk-sticky>
    <div class="uk-card uk-card-small uk-card-default uk-padding-small setting-header" type="default" uk-grid>
      <img src="icon.png" alt="Desktop Calendar" id="main-icon" />
      <span class="uk-h3 uk-card-body"
        >Desktop Calendar 설정
        <span class="uk-h4">{{ currentVersion }}</span>
      </span>
    </div>
  </div>
</template>

<script>
export default {
  name: "setting-header",
  data() {
    return {
      currentVersion: this.appVersion
    };
  }
};
</script>

<style lang="scss">
#main-icon {
  width: 100px;
}
.setting-header {
  box-shadow: none !important;
}
</style>
