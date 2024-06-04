<template>
  <div style="padding-right: 25%;">
    <h1
      class="uk-text-center uk-margin-small-top"
      :style="{
        'font-size': timeStyle.size,
        'font-weight': timeStyle.weight,
        color: timeStyle.color
      }"
      style="user-select:none"
    >
      {{ datenow }}
    </h1>
  </div>
</template>

<script>
import moment from 'moment'

export default {
  name: "main-timer",
  data() {
    return {
      datenow: "wait.."
    };
  },
  methods: {
    time() {
      // 현재 시간 반환
      this.datenow = moment()
        .locale(window.defaultLocale)
        .format(this.timeMoment)
    }
  },
  mounted() {
    // 마운트 됐을 때
    this.time();
    setTimeout(() => {
      this.interval = setInterval(this.time, 1000);
    }, 1000 - new Date().getMilliseconds()); // Millisecond 맞춤
  },
  beforeUnmout() {
    clearInterval(this.interval);
  },
  computed: {
    timeMoment() {
      return this.$store.getters.getOptions("timeMoment");
    },
    timeStyle() {
      return this.$store.getters.getOptions("timerStyle");
    }
  }
};
</script>

<style lang="scss"></style>
