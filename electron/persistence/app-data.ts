import { app } from 'electron'
import Store from 'electron-store'
import fs from 'node:fs'
import path from 'node:path'
import type { Rectangle } from 'electron'
import type { CalendarList } from '../../shared/ipc'

const store = new Store()

function userDataFile(name: 'calendar.json' | 'token.json') {
  return path.join(app.getPath('userData'), name)
}

async function removeFileIfPresent(filePath: string) {
  try {
    await fs.promises.unlink(filePath)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error
    }
  }
}

export function getCalendarFilePath() {
  return userDataFile('calendar.json')
}

export function getTokenFilePath() {
  return userDataFile('token.json')
}

export async function calendarFileExists() {
  try {
    await fs.promises.access(getCalendarFilePath(), fs.constants.F_OK)
    return true
  } catch {
    return false
  }
}

export async function readCalendarList(): Promise<CalendarList | null> {
  try {
    const contents = await fs.promises.readFile(getCalendarFilePath(), 'utf8')
    if (!contents.trim()) {
      return []
    }

    const parsed: unknown = JSON.parse(contents)
    // Older releases could persist a JSON string containing the actual array.
    const normalized: unknown = typeof parsed === 'string' ? JSON.parse(parsed) : parsed
    return Array.isArray(normalized) ? normalized as CalendarList : null
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      console.error('Unable to read the saved calendar list', error)
    }
    return null
  }
}

export async function writeCalendarList(calendarList: CalendarList) {
  await fs.promises.mkdir(app.getPath('userData'), { recursive: true })
  await fs.promises.writeFile(
    getCalendarFilePath(),
    JSON.stringify(calendarList),
    'utf8',
  )
}

export async function readTokenFile() {
  return fs.promises.readFile(getTokenFilePath(), 'utf8')
}

export async function writeTokenFile(contents: string) {
  await fs.promises.mkdir(app.getPath('userData'), { recursive: true })
  await fs.promises.writeFile(getTokenFilePath(), contents, 'utf8')
}

export function removeTokenFile() {
  return removeFileIfPresent(getTokenFilePath())
}

export function removeCalendarFile() {
  return removeFileIfPresent(getCalendarFilePath())
}

export function getSavedBounds() {
  return store.get('bounds') as Rectangle | undefined
}

export function saveBounds(bounds: Rectangle) {
  store.set('bounds', bounds)
}

export function getMemo() {
  return store.get('memo', '') as string
}

export function saveMemo(memo: string) {
  store.set('memo', memo)
}

export function clearSettings() {
  store.clear()
}
