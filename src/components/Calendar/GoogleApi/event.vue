<template>
  <div
    class="uk-card uk-card-default uk-padding-small"
    id="gcal-event"
    style="min-width: 300px"
    @mouseover="setIgnore"
    @mouseout="disableIgnore"
  >
    <slot name="header" style="padding: 0">
      <span
        id="open-google-calendar"
        uk-icon="google"
        class="uk-icon-link uk-position-top-right uk-padding-small uk-border-circle google-button"
        uk-tooltip="Google Calendar에서 엽니다."
        v-on:click="openGCal()"
      />
      <div
        class="uk-card-title uk-margin-small-top gcal-title uk-margin-remove-bottom"
        >{{ event.title }}</div>
      <p class="uk-text-meta uk-margin-remove-top">
        {{
          event.organizer
            ? event.organizer.displayName || event.organizer.email
            : ""
        }}
      </p>
      <p
        class="uk-text-meta uk-margin-remove timeShow"
        uk-tooltip="클릭으로 보기 변경"
        @click="timeShow = true"
        v-if="!timeShow"
      >
        <span v-if="timePast" uk-icon="history"></span>
        <span v-else uk-icon="future"></span>
        <time class="uk-margin-small-left">{{ getFromNow() }}</time>
      </p>
      <div
        uk-tooltip="클릭으로 보기 변경"
        v-if="timeShow"
        @click="timeShow = false"
      >
        <p class="uk-text-meta uk-margin-remove timeShow">
          <time>{{
            event.start ? event.start.format("YYYY-MM-DD A h:mm:ss") : ""
          }}</time>
        </p>
        <p class="uk-text-meta uk-margin-remove timeShow">
          <time
            >~
            {{
              event.end ? event.end.format("YYYY-MM-DD A h:mm:ss") : ""
            }}</time
          >
        </p>
      </div>
      <hr/>
      <div
        v-if="!isDelete" 
        uk-icon="trash"
        uk-tooltip="이벤트 삭제"
        class="uk-icon-link uk-float-right"
        @click="deleteEvent"/>

      <div v-else uk-spinner='ratio: 0.7' class="uk-float-right"></div>
      <div
        v-if="deleteError" 
        class="uk-alert-danger uk-padding-small"
        uk-alert
      >
        <p>삭제에 실패하였습니다.</p>
      </div>
      <div
        v-if="!isEdit" 
        uk-icon="file-edit"
        uk-tooltip="이벤트 수정"
        class="uk-icon-link uk-float-right"
        @click="editEvent"/>

      <div v-else uk-spinner='ratio: 0.7' class="uk-float-right"/>
    </slot>
    <p class="gcal-body markdown-body" v-html="getDescription" v-linkify />
  </div>
</template>

<script>
import fs from 'fs'
import { shell } from 'electron'
import * as auth from "./api.js"

const api = auth.default
let accessCount = 0

export default {
  name: "calendar-event",
  data() {
    return {
      gcolor: null,
      timeShow: false,
      timePast: false,
      isDelete: false,
      isEdit: false,
      deleteError: false,
      editError: false,
      isUpdate: false,
      refreshInterval: null,
    };
  },
  methods: {
    addEvent(events, color) {
      var data = events.map(e => {
        return {
          e,
          id: e.id,
          title: e.summary,
          start: e.start.dateTime || e.start.date,
          end: e.end.dateTime || e.end.date,
          color: e.colorId
            ? this.gcolor.event[e.colorId].background
            : color.background,
          organizer: e.organizer,
          description: e.description || null,
          created: e.created
        }
      })
      this.Fcalendar.renderEvents(data)
    },
    openGCal() {
      this.openExternal(this.event.e.htmlLink)
    },
    openExternal(link) {
      shell.openExternal(link)
      return false
    },
    init() {
      var colors = {}
      api.setAxios(this.$http)
      api.authorize(key => {
        this.$http.defaults.headers.common["Authorization"] = "Bearer " + key
        api.colors(color => {
          this.gcolor = color.data
          fs.readFile(this.appdata + "/calendar.json", (err, res) => {
            if (err)
              return console.error(err)

            const calendars = JSON.parse(res)
            
            this.Fcalendar.removeEvents()

            accessCount += 1
            var checkedCalendar = 0
            var calNum = 0

            for (const cal of calendars) {
              if (!cal.checked) {
                continue
              }
              
              checkedCalendar += 1
              colors[cal.id] = this.gcolor.calendar[cal.colorId]

              api.events(
                cal.id,
                this.Fcalendar.view.start,
                this.Fcalendar.view.end,
                events => {
                  calNum += 1
                  var lastPass = false
                  
                  if (checkedCalendar == calNum ) {
                    if (accessCount >= 2)
                      lastPass = true
                    accessCount -= 1
                  }

                  if (accessCount >= 2 || lastPass)  return
                  if (checkedCalendar == calNum ) this.emitter.emit("reloadEnd")

                  if (events.data.items.length == 0) return
                  this.addEvent(events.data.items, colors[cal.id])
                }
              )
            }
          })
        })
      });
    },
    getFromNow() {
      const start = this.event.start;
      const end = this.event.end;
      const now = new Date();
      now.setHours(now.getHours() + 9);
      if (!start) return "";
      if (start.diff(now) > 0 || !end) {
        this.timePast = false;
        return start.locale("ko").fromNow() + "에 시작";
      } else if (end.diff(now) > 0) {
        this.timePast = false;
        return end.locale("ko").fromNow() + "에 종료";
      } else {
        this.timePast = true;
        return end.locale("ko").fromNow() + "에 종료됨";
      }
    },
    deleteEvent() {
      this.isDelete = true;
      api.deleteEvent(this.event.organizer.email, this.event.id, req => {
        this.isDelete = false;
        if (req && req.status === 204) {
          this.$parent.show = false;
          this.Fcalendar.removeEvents(this.event.id);
        } else {
          this.deleteError = true;
          setTimeout(() => {
            this.deleteError = false;
          }, 2000);
        }
      });
    },
    deleteEditEvent(ev) {
      this.isDelete = true;
      api.deleteEvent(ev.organizer.email, ev.id, req => {
        this.isDelete = false;
        if (req && req.status === 204) {
          this.$parent.show = false;
          this.Fcalendar.removeEvents(ev.id);
        } else {
          this.deleteError = true;
          setTimeout(() => {
            this.deleteError = false;
          }, 2000);
        }
      });
    }
    ,
    editEvent() {
      this.$parent.editEvent(this.event)
    },
    insertEvent(calendarid, timeType, start, end, title, content, colorid, cb) {
      api.insertEvent(
        calendarid,
        timeType,
        start,
        end,
        title,
        content,
        colorid,
        (req, err) => {
          if (req) {
            this.addEvent([req], { background: "#FFFFFF" });
          }
          if (err) {
            cb(err);
          }
        }
      );
    }
  },
  mounted() {
    this.init();
    this.emitter.on("loadURL", url => {
      this.openExternal(url);
    });
    // setInterval for ms...
    this.refreshInterval = setInterval(this.init, parseInt(this.getRefresh) * 1000);
    this.emitter.on("forceReload", () => {
      this.init();
    });
    const $ = window.$
    $("#gcal-event").resize(this.boundsRect)
  }, 
  computed: {
    getDescription() {
      return (
        this.event.description &&
        this.event.description.replace("&lt;", "<").replace("&gt;", ">")
      );
    },
    getRefresh() {
      return this.$store.getters.getOptions("refreshTime");
    }
  },
  watch: {
    getRefresh(oldValue, newValue) {
      if (oldValue !== newValue) {
        clearInterval(this.refreshInterval);
        // setInterval for ms...
        this.refreshInterval = setInterval(this.init, parseInt(newValue) * 1000);
        // console.log('refresh Interval')
      }
    },
  },
  updated: function() {
    this.$nextTick(() => {
      const $ = window.$
      var top = this.event.top
      var left = this.event.left

      if ($('#gcal-event').outerHeight() !== undefined)
      { 
        $('#gcal-event').css('border-top-color', this.event.color)
        $('#gcal-event').css('border-bottom-color', 'white')
        
        if ($('#gcal-event').outerHeight() + top > window.outerHeight * 0.9) {
          top = this.event.top - this.event.titleHeight - $('#gcal-event').outerHeight()
          $('#gcal-event').css('border-top-color', 'white')
          $('#gcal-event').css('border-bottom-color', this.event.color)
        }
      }

      if ($('#gcal-event').outerWidth() !== undefined)
      { 
        if ($('#gcal-event').outerWidth() + this.event.left > this.event.calendarRight) {
          left = this.event.right - $('#gcal-event').outerWidth()
        }
      }

      $('#gcal-event').css('top', top)
      $('#gcal-event').css('left', left)
    })
  },
  props: ["Fcalendar", "event"]
};
</script>

<style lang="scss">
#gcal-event {
  position: fixed;
  display: inline-block;
  min-width: 230px;
  max-width: 400px;
  top: 50px;
  z-index: 10;
  border-top: 6px solid white;
  border-bottom: 6px solid white;
}
.google-button:hover {
  background: lightgray;
}
.google-button {
  border-radius: 30px;
}
.gcal-body {
  word-wrap: break-word;
}
.gcal-title {
  max-width: 90%;
}
</style>
