<template>
  <div class="uk-text-center">
    <div v-if="!isAuthed">
      <p class="uk-text-lead">
        동기화하려면 Google 계정 로그인이 필요합니다.
      </p>
      <button class="uk-button-primary uk-button-small" @click="auth">로그인</button>
    </div>
    <div v-else-if="!calendarList.length">
      목록 불러오는 중 <div uk-spinner />
    </div>
    <div class="uk-width-large uk-align-center" v-else>
      <p class="uk-text-lead">
        사용할 달력을 선택하세요.
        <button
          class="uk-position-medium uk-position-top-right uk-button-primary uk-button-small"
          uk-slideshow-item="2"
          @click="save"
          >다음</button
        >
      </p>
      <ul class="uk-list uk-list-divider uk-width-1-1 uk-text-left itemlist">
        <li v-for="key in calendarList" :key="key">
          <input
            type="checkbox"
            class="uk-checkbox"
            v-model="key.checked"
            :disabled="key.isprimary"
          />
          <span class="uk-margin-small-left" :uk-tooltip="[key.isprimary ? '기본 달력입니다' : null]">{{
            key.summary
          }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
import api from "../Calendar/GoogleApi/api.js"
export default {
  name: "start-auth",
  data() {
    return {
      isAuthed: false,
      calendarList: []
    };
  },
   methods: {
    auth() {
      api.authorize(key => {
        this.isAuthed = true
        this.$http.defaults.headers.common["Authorization"] = "Bearer " + key
        api.setAxios(this.$http)
        api.calendarList(res => {
          // console.log(res)
          this.calendarList = res.data.items.map(function(item) {
            var o = Object.assign({}, item)
            o.checked = true
            if (item.primary) o.isprimary = true
            return o
          });
        });
      });
    },
    save() {
      const fs = window.require('fs')
      fs.writeFile(
        this.appdata + "/calendar.json",
        JSON.stringify(this.calendarList),
        function(err) {
          if (err) console.error(err);
          // console.log('calendar save success')
        }
      );
    }
   }
}
</script>

<style lang="scss">
.itemlist {
  //height: 300px;
  overflow: scroll;
}
</style>
