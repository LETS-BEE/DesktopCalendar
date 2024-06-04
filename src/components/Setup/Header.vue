<template>
  <div uk-sticky>
    <div class="uk-card uk-card-small uk-card-default uk-padding-small start-header" uk-grid>
      <img src="icon.png" alt="Desktop Calendar" id="top-icon"/>
      <div class="uk-card-body">
        <h3 class="uk-card-title">Desktop Calendar</h3>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "start-header"
};
</script>

<style lang="scss">
#top-icon {
  width: 100px;
}
.start-header {
  //box-shadow: none !important;
}
</style>
