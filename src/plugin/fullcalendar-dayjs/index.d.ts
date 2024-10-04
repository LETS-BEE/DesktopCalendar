import { CalendarApi, Duration, PluginDef } from '@fullcalendar/core';
import dayjs from 'dayjs';
import dayjsDuration from 'dayjs/plugin/duration'


declare function toMoment(date: Date, calendar: CalendarApi): dayjs.Dayjs;
declare function toMomentDuration(fcDuration: Duration): dayjsDuration;

declare const _default: PluginDef;

export { _default as default, toMoment, toMomentDuration };