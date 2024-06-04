<template>
  <div id='calendar'>
    <div class='uk-button-group calendar-head-left'> 
      <button class='uk-button uk-button-small' :class="['uk-button-' + getCalendarOption.buttonType]" @click='reloadEvent' uk-tooltip="새로고침" id='reload-btn' @mouseover="setIgnore" @mouseout="disableIgnore">새로고침</button>
      <button class='uk-button uk-button-small' :class="['uk-button-' + getCalendarOption.buttonType]" @mouseover="setIgnore" @mouseout="disableIgnore">
        <span uk-icon='calendar' uk-tooltip="Google Calendar 열기" @click="emitter.emit('loadURL', 'https://calendar.google.com/')"/>
      </button>
      <button class='uk-button uk-button-small' :class="['uk-button-' + getCalendarOption.buttonType]" uk-tooltip="설정을 엽니다." id='createOption' @click='loadSetting'  @mouseover="setIgnore" @mouseout="disableIgnore" >
        <span uk-icon='settings'/>
      </button>
      <button class='uk-button uk-button-small' :class="['uk-button-' + getCalendarOption.buttonType]" uk-tooltip="Event 추가" ref="addEventBtn" @click='showEvent'  @mouseover="setIgnore" @mouseout="disableIgnore">
        <span uk-icon='plus' />
      </button>
      <div uk-drop='mode: click' ref="eventAddDrop" id="test">
        <div class='uk-card uk-card-default uk-padding-small event-add' @mouseover="setIgnore" @mouseout="disableIgnore">
          <fieldset class='uk-fieldset'>
            달력
            <select v-model="calendarid" v-if="calendarids" class="uk-select uk-form-small">
              <template v-for="(data) in calendarids">
                <option :key="data" v-if="data.accessRole == 'owner' || data.accessRole == 'writer'" :value="data.id">
                  {{ data.summary }}
                </option>
              </template>
            </select>
            제목
            <input type='text' placeholder='제목 입력' class='uk-input' v-model='summary'>
            <p class='uk-margin-small-top'>
              설명
              <textarea class='uk-textarea uk-height-small uk-resize-vertical uk-height-max-medium' v-model='description'/>
              <a class="uk-text-muted uk-float-right uk-text-small" @click="emitter.emit('loadURL', 'https://gist.github.com/ihoneymon/652be052a0727ad59601#2-%EB%A7%88%ED%81%AC%EB%8B%A4%EC%9A%B4-%EC%82%AC%EC%9A%A9%EB%B2%95%EB%AC%B8%EB%B2%95')">Markdown 형식</a>
            </p>
            <p class='uk-margin-small-top'>
              시간 종류 <select class="uk-select uk-width-1-3 uk-form-small" v-model="timeType">
                <option>날짜</option>
                <option>날짜-시간</option>
              </select> <br>
              시작
              <DatePicker v-model='startTime' v-if="timeType == '날짜'" :format="dateFormat" :preview-fromat="dateFormat" :model-type="dateFormat" locale="ko" input-class='uk-width color-input' :is-24='false' week-start="0" auto-apply/>
              <DatePicker v-model='startTime' v-else :format="datetimeFormat" :preview-froma="datetimeFormat" :model-type="datetimeFormat" locale="ko" input-class='uk-width color-input' :is-24='false' week-start="0" auto-apply/>
              
            </p>
            <p class='uk-margin-small-top'>
              종료
              <DatePicker v-model='endTime' v-if="timeType == '날짜'" :format="dateFormat" :preview-froma="dateFormat" :model-type="dateFormat" locale="ko-KR" input-class='uk-width' :is-24='false' week-start="0" auto-apply/>
              <DatePicker v-model='endTime' v-else :format="datetimeFormat" :preview-froma="datetimeFormat" :model-type="datetimeFormat" locale="ko-KR" input-class='uk-width' :is-24='false' week-start="0" auto-apply/>
            </p>
            <p class='uk-margin-small-top'>
              <template style="display:block">
                <div v-for="(color, i) in gcolor" v-bind:key="color" :style="{background : color.background}" class="event-color" :class="{eventcolorselect: colorid == i}" @click="colorid = i">
                  <span v-if="colorid == i" ratio="1.3" uk-icon="check" class="icon-custom" />
                </div>
              </template>
            </p>
            <button v-if="!isEdit" class="uk-button uk-button-small" :class="['uk-button-' + getCalendarOption.buttonType]" :uk-tooltip="[startTime ? '이벤트를 추가합니다.' : '시작 시간을 정해 주십시오.']" @click='insertEvent' :disabled="!startTime">추가</button>
            <button v-if="isEdit" class="uk-button uk-button-small" :class="['uk-button-' + getCalendarOption.buttonType]" :uk-tooltip="[startTime ? '이벤트를 수정합니다.' : '시작 시간을 정해 주십시오.']" @click='insertEditEvent' :disabled="!startTime">수정</button>
          </fieldset>
        </div>
      </div>
      <button class="uk-button uk-button-small" :class="['uk-button-' + getCalendarOption.buttonType]" uk-tooltip="Calendar을 움직입니다." @mouseover="setIgnore" @mouseout="disableIgnore">
        <span uk-icon='move' style='-webkit-app-region: drag;' uk-tooltip="Calendar을 움직입니다."/>
      </button>
    </div>
    <div class='uk-button-group calendar-head-right' @mouseover="setIgnore" @mouseout="disableIgnore">
      <button class='uk-button uk-button-small' :class="['uk-button-' + getCalendarOption.buttonType]" @click='Fcalendar.prev();reloadEvent();'><span uk-icon='chevron-left'/></button>
      <button class='uk-button uk-button-small' :class="['uk-button-' + getCalendarOption.buttonType]" @click='Fcalendar.today();Fcalendar.render();reloadEvent();'><span uk-icon='clock'/></button>
      <button class='uk-button uk-button-small' :class="['uk-button-' + getCalendarOption.buttonType]" @click='Fcalendar.next();reloadEvent();'><span uk-icon='chevron-right'/></button>
    </div>
    <events v-show='show' :Fcalendar='Fcalendar' :event='eventValue' :show='show' ref='eventform'/>
  </div>
</template>

<script>
import 'fullcalendar'
import 'fullcalendar/dist/locale-all'
import * as remote from '@electron/remote'
import moment from 'moment'
import events from './GoogleApi/event'
import Showdown from 'showdown'

const converter = new Showdown.Converter({ 
  // backslashEscapesHTMLTags: true,
  emoji: true,
  // metadata: true,
  requireSpaceBeforeHeadingText: true,
  // simpleLineBreaks: true,
  // simplifiedAutoLink: true,
  splitAdjacentBlockquotes: true,
  strikethrough: true,
  ellipsis: true,
  literalMidWordUnderscores: true,
})
const $ = window.$

window.moment = moment

const dpFormat = 'yyyy-MM-dd'
const dptFormat = 'yyyy-MM-dd hh:mm aa'
const mFormat = 'yyyy-MM-DD'
const mtFormat = 'yyyy-MM-DD hh:mm A'

export default {
  name: 'main-calendar',
  data () {
    return {
      Fcalendar: null,
      show: false,
      isEdit: false,
      eventValue: {},
      editEventValue: {},
      notifys: [],
      showAdd: false,
      summary: '',
      description: '',
      calendarid: '',
      startTime: new Date(),
      endTime: '',
      colorid: 1,
      timeType: '날짜',
      gcolor: [
        {
          'background': '#a4bdfc',
          'foreground': '#1d1d1d'
        },
        {
          'background': '#7ae7bf',
          'foreground': '#1d1d1d'
        },
        {
          'background': '#dbadff',
          'foreground': '#1d1d1d'
        },
        {
          'background': '#ff887c',
          'foreground': '#1d1d1d'
        },
        {
          'background': '#fbd75b',
          'foreground': '#1d1d1d'
        },
        {
          'background': '#ffb878',
          'foreground': '#1d1d1d'
        },
        {
          'background': '#46d6db',
          'foreground': '#1d1d1d'
        },
        {
          'background': '#e1e1e1',
          'foreground': '#1d1d1d'
        },
        {
          'background': '#5484ed',
          'foreground': '#1d1d1d'
        },
        {
          'background': '#51b749',
          'foreground': '#1d1d1d'
        },
        {
          'background': '#dc2127',
          'foreground': '#1d1d1d'
        }
      ],
      calendarids: null
    }
  },
  methods: {
    reloadEvent () {
      $('#reload-btn').prop('disabled', true)
      this.emitter.once('reloadEnd', () => {
        $('#reload-btn').prop('disabled', false)
      })
      this.emitter.emit('forceReload')
    },
    loadSetting () {
      $('#createOption').prop('disabled', true)
      const mainPath = process.env.NODE_ENV === 'development'
        ? `http://localhost:8080/#/setting`
        : `file://${__dirname}/index.html#setting`
      
      
      let settingWindow = new remote.BrowserWindow({
        parent: remote.getCurrentWindow(),
        frame: true,
        focusable: true,
        title: 'Desktop Calendar 설정',
        skipTaskbar: false,
        webPreferences: { 
          plugins: true,
          nodeIntegration: true,
          contextIsolation: false,
          enableRemoteModule: true,
          webSecurity: false 
        }
      })

      settingWindow.setSkipTaskbar(false)
      settingWindow.setMenu(null)
      if (this.DevMode()) {
        settingWindow.webContents.openDevTools({
          mode: 'undocked'
        })
      }
      settingWindow.loadURL(mainPath)
      settingWindow.webContents.once('did-finish-load', () => {
        settingWindow.webContents.send('init-options', (this.$store.getters.getAll))
        settingWindow.setIgnoreMouseEvents(false)
        settingWindow.focus()
      })
      settingWindow.on('close', () => {
        $('#createOption').prop('disabled', false)
        settingWindow = null
      })
    },
    insertEvent () {
      this.$refs.eventAddDrop.__uikit__.drop.hide()
      this.isEdit = false

      let resultHtml = converter.makeHtml(this.description)

      if (this.endTime === '') {
        this.endTime = this.startTime
      }

       this.endTime = moment(this.endTime).add(1, "d")
      
      if (this.timeType === '날짜') {
        this.endTime = this.endTime.format(mFormat)
      } else {
        this.endTime = this.endTime.format()
        this.startTime = moment(this.startTime).format()
      }

      this.$refs.eventform.insertEvent(this.calendarid, this.timeType === '날짜', this.startTime, this.endTime, this.summary, resultHtml, this.colorid + 1, (e) => {
        if (e) console.log(e)
      })
      this.initialEventAdd()
    },
    ignoreMouse () {
      window.disableMouse()
    },
    convertRGBA (rgba) {
      return `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${rgba.a})`
    },
    addEventDate (e) {
      this.$refs.eventAddDrop.__uikit__.drop.show()
      this.startTime = e
    },
    addPlusBtn () {
      const plusbtn = document.createElement('a')
      plusbtn.setAttribute('uk-icon', 'plus-circle')
      plusbtn.onmouseover = this.setIgnore
      plusbtn.onmouseout = this.disableIgnore
      plusbtn.style.marginLeft = '2px'

      $('.fc-day').hover((e) => {
        if (e.type === 'mouseleave') {
          e.currentTarget.removeChild(plusbtn)
        } else if (e.type === 'mouseenter') {
          plusbtn.onclick = () => this.addEventDate(e.currentTarget.getAttribute('data-date'))
          e.currentTarget.appendChild(plusbtn)
        }
      })
    },
    calendarList () {
      const fs = window.require('fs')
      fs.readFile(this.appdata + '/calendar.json', (err, res) => {
        if (err) return console.error(err)
        res = JSON.parse(res)
        this.calendarids = res
        res.forEach((value) => {
          if (value.primary) this.calendarid = value.id
        })
      })
    },
    showEvent() {
      if (this.showAdd) {
        this.isEdit = false
        this.initialEventAdd()
      }
      this.showAdd = !this.showAdd
    },
    editEvent(ev) {
      
      this.isEdit = true
      this.$refs.eventAddDrop.__uikit__.drop.show()
      this.summary = ev.title
      
      if (ev.description != null) {
        this.description = converter.makeMarkdown(ev.description).replace("\\~", "~")
      } else {
        this.description = ""
      }

      if (this.timeType === '날짜') {
        this.startTime = ev.start.format(mFormat)
        this.endTime = ev.end.clone().add(-1, "d").format(mFormat)
      } else {
        this.startTime = ev.start.locale("en").format(mtFormat)
        this.endTime = ev.end.clone().add(-1, "d").locale("en").format(mtFormat)
      }

      this.editEventValue = ev
    },
    insertEditEvent() {
      this.$refs.eventAddDrop.__uikit__.drop.hide()
      this.isEdit = false

      let resultHtml = converter.makeHtml(this.description)
      
      if (this.endTime === '') {
        this.endTime = this.startTime
      }

      this.endTime = moment(this.endTime).add(1, "d")
      
      if (this.timeType === '날짜') {
        this.endTime = this.endTime.format(mFormat)
      } else {
        this.endTime = this.endTime.format()
        this.startTime = moment(this.startTime).format()
      }

      
      this.$refs.eventform.insertEvent(this.calendarid, this.timeType === '날짜', this.startTime, this.endTime, this.summary, resultHtml, this.colorid + 1, (e) => {
        if (e) console.log(e)
      })
      this.$refs.eventform.deleteEditEvent(this.editEventValue)
      this.initialEventAdd()
    },
    initialEventAdd() {
      this.startTime = this.endTime = this.summary = this.description = ''
      this.startType = this.endType = '날짜'
      this.colorid = 1
      this.editEventValue = {}
    }
  },
  mounted () {
    $('#calendar').fullCalendar({
      defaultView: this.$store.getters.getOptions('calendarType'),
      header: {
        left: '',
        center: 'title',
        right: ''
      },
      themeSystem: 'bootstrap4',
      locale: 'ko',
      height: window.outerHeight * this.getCalendarHeight,
      eventLimit: false,
      views: {
        week: {
          type: 'basic',
          duration: { weeks: 3 }
        }
      },
      viewRender: () => {
        this.addPlusBtn()
      },
      eventMouseover: (event, jsevent) => {
        if (this.$refs.eventform.isDelete) {
          return 0
        }
        event.titleHeight = jsevent.currentTarget.getBoundingClientRect().height
        event.top = jsevent.currentTarget.getBoundingClientRect().top + event.titleHeight
        event.left = jsevent.currentTarget.getBoundingClientRect().left
        event.right = jsevent.currentTarget.getBoundingClientRect().right
        event.calendarRight = $('#calendar').offset().left + $('#calendar').width()
        this.eventValue = event
        this.show = true
      },
      eventMouseout: () => {
        this.show = false
      },
      timeFormat: 'AH:mm',
      dayPopoverFormat: 'MM월 DD일 dddd',
      eventLimitText: '더보기'
    })
    
    window.Fcalendar = this.Fcalendar = $('#calendar').fullCalendar('getCalendar')
    window.onresize = () => {
      $('#calendar').fullCalendar('option', 'height', window.outerHeight * 0.7)
    }
    $('#gcal-event').on('mouseover', () => {
      this.show = true
    })
    $('#gcal-event').on('mouseleave', () => {
      this.show = false
    })
    $(document).on('click', '.gcal-body a', (e) => {
      e.preventDefault()
      this.emitter.emit('loadURL', e.currentTarget.href)
      return false
    })
    $('#calendar, .fc-center>h2').css('color', this.convertRGBA(this.getCalendarOption.color.rgba || this.getCalendarOption.color))
    $('#calendar ').css('background-color', this.convertRGBA(this.getCalendarOption.background.rgba || this.getCalendarOption.background))

    this.calendarList()
  },
  computed: {
    getCalendarOption () {
      return this.$store.getters.getOptions('calendar')
    },
    getCalendarType () {
      return this.$store.getters.getOptions('calendarType')
    },
    getCalendarHeight () {
      return this.$store.getters.getOptions('calendarHeight')
    },
    dateFormat() {
      return dpFormat
    },
    datetimeFormat() {
      return dptFormat
    }
  },
  components: {
    events
  },
  watch: {
    'startTime': function (newval) {
      //console.log(newval, moment(newval).isBefore(moment(this.endTime)), this.endTime)
      if (this.endTime == '') {
        this.endTime = newval
      } else {
        if (!moment(newval).isBefore(this.endTime)) {
          this.endTime = newval
        }
      }
    },
    'endTime': function (newval) {
      //console.log('end', newval, moment(newval).isAfter(moment(this.startTime)))
      if (!moment(newval).isAfter(moment(this.startTime))) {
        this.startTime = newval
      }
    },
    'timeType' : function (newval) {
      if (newval === '날짜') {
        this.startTime = moment(this.startTime).format(mFormat)
      } else {
        this.startTime = moment(this.startTime).format(mtFormat)
      }
    },
    getCalendarOption (newval) {
      $('#calendar, .fc-center>h2').css('color', this.convertRGBA(newval.color.rgba || newval.color))
      $('#calendar').css('background-color', this.convertRGBA(newval.background.rgba || newval.background))
    },
    getCalendarType (newval) {
      $('#calendar').fullCalendar('changeView', newval)
      this.emitter.emit('forceReload')
    },
    getCalendarHeight (newval) {
      $('#calendar').fullCalendar('option', 'height', window.outerHeight * newval)
    }
  }
}
</script>

<style lang='scss'>
@import url('lib/fullcalendar.css');
// Use Github Markdown Style Sheet
@import url('lib/github-markdown.css');
// @import url('lib/calendarTheme.scss');

$side-margin: 25%;
#calendar{
  position: relative;
  padding: 0 $side-margin 0 0;
  background-clip: content-box;
  // height: 65%;
}

.fc button {
  height: none;
}

.fc-today{
    background: rgba(215, 240, 247, 0.6);
}

.calendar-head-left {
  position: absolute !important;
  top: 0%;
}

.calendar-head-right {
  @extend .calendar-head-left;
  right: $side-margin;
}

.event-color {
  width:40px;
  height:40px;
  border-radius: 30px;
  margin: 3px 5.5px;
  text-align: center;
  display:inline-block !important;
}

.event-color:hover {
  box-shadow: 0 0 3px 1px #a8a8a8;
}

.colorhighlighted {
  border: 1px black solid;
}

.icon-custom {
  transform: translate(-12px, 7px);
  position:absolute;
  color:black;
}
.fc-more-popover {
  background:white;
}
/*Allow pointer-events through*/
.fc-slats, /*horizontals*/
.fc-content-skeleton, /*day numbers*/
.fc-bgevent-skeleton /*events container*/{
    pointer-events:none
}
/*Turn pointer events back on*/
.fc-bgevent,
.fc-event-container{
    pointer-events:auto; /*events*/
}
.fc-center, .fc-day-header > span, .fc-day-number, #reload-btn{
  user-select: none;
}
.fc-scroller {
   overflow-y: visible !important;
}
</style>
