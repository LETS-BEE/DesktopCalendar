import { net, shell } from 'electron'
import { OAuth2Client, type Credentials } from 'google-auth-library'
import { randomBytes, timingSafeEqual } from 'node:crypto'
import http from 'node:http'
import credentials from '../../private/credentials.json'
import {
  readTokenFile,
  removeTokenFile,
  writeTokenFile,
} from '../../persistence/app-data'

interface GoogleOAuthCredentials {
  client_id: string
  client_secret: string
}

const googleCredentials = (
  'installed' in credentials ? credentials.installed : credentials
) as GoogleOAuthCredentials

const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
]
const OAUTH_CALLBACK_PATH = '/oauth2/callback'
const OAUTH_TIMEOUT_MS = 2 * 60 * 1000
const AUTH_OPEN_RETRY_MS = 3_000
const LOOPBACK_HOST = '127.0.0.1'

const client = new OAuth2Client(
  googleCredentials.client_id,
  googleCredentials.client_secret,
)
let interactiveAuthorization: Promise<Credentials> | null = null

function wait(delayMs: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, delayMs)
  })
}

async function openAuthorizationUrlWithRetry(
  authUrl: string,
  isCancelled: () => boolean,
) {
  while (!isCancelled()) {
    if (net.isOnline()) {
      try {
        await shell.openExternal(authUrl)
        return true
      } catch (error) {
        console.error('Unable to open Google authorization URL', error)
      }
    }

    await wait(AUTH_OPEN_RETRY_MS)
  }

  return false
}

function isMatchingState(actual: string | null, expected: string) {
  if (!actual) {
    return false
  }

  const actualBuffer = new TextEncoder().encode(actual)
  const expectedBuffer = new TextEncoder().encode(expected)
  return actualBuffer.length === expectedBuffer.length
    && timingSafeEqual(actualBuffer, expectedBuffer)
}

function writeBrowserResponse(
  response: http.ServerResponse,
  statusCode: number,
  title: string,
  message: string,
) {
  response.writeHead(statusCode, {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-store',
  })
  response.end(`<!doctype html>
<html lang="ko">
  <head><meta charset="utf-8"><title>${title}</title></head>
  <body><h1>${title}</h1><p>${message}</p></body>
</html>`)
}

async function loadSavedCredentials() {
  const token = JSON.parse(await readTokenFile()) as Credentials
  client.setCredentials(token)
  return token
}

async function persistClientCredentials(previousRefreshToken?: string | null) {
  const credentialsToSave: Credentials = {
    ...client.credentials,
    refresh_token: client.credentials.refresh_token ?? previousRefreshToken,
  }
  client.setCredentials(credentialsToSave)
  await writeTokenFile(JSON.stringify(credentialsToSave))
}

export async function getValidAccessToken() {
  if (!client.credentials.access_token && !client.credentials.refresh_token) {
    await loadSavedCredentials()
  }

  const previousAccessToken = client.credentials.access_token
  const previousRefreshToken = client.credentials.refresh_token
  const tokenResponse = await client.getAccessToken()
  if (!tokenResponse.token) {
    throw new Error('Google access token is unavailable')
  }

  if (
    previousAccessToken !== tokenResponse.token
    || previousRefreshToken !== client.credentials.refresh_token
  ) {
    await persistClientCredentials(previousRefreshToken)
  }

  return tokenResponse.token
}

export async function hasValidAuthorization() {
  try {
    await loadSavedCredentials()
    await getValidAccessToken()
    return true
  } catch (error) {
    console.error('Google authorization is unavailable', error)
    return false
  }
}

async function runInteractiveAuthorization() {
  const state = randomBytes(32).toString('hex')

  return new Promise<Credentials>((resolve, reject) => {
    let settled = false

    const finish = (
      server: http.Server,
      error?: Error,
      token?: Credentials,
    ) => {
      if (settled) {
        return
      }
      settled = true
      clearTimeout(timeout)
      server.close()
      if (error) {
        reject(error)
      } else if (token) {
        resolve(token)
      } else {
        reject(new Error('OAuth flow ended without credentials'))
      }
    }

    const server = http.createServer(async (request, response) => {
      try {
        const requestUrl = new URL(
          request.url ?? '/',
          `http://${LOOPBACK_HOST}`,
        )
        if (requestUrl.pathname !== OAUTH_CALLBACK_PATH) {
          writeBrowserResponse(response, 404, 'Not found', '잘못된 인증 요청입니다.')
          return
        }

        const oauthError = requestUrl.searchParams.get('error')
        if (oauthError) {
          writeBrowserResponse(
            response,
            400,
            '로그인 취소',
            'Google 로그인이 취소되었거나 실패했습니다. 이 창을 닫아 주세요.',
          )
          finish(server, new Error(`Google OAuth failed: ${oauthError}`))
          return
        }

        if (!isMatchingState(requestUrl.searchParams.get('state'), state)) {
          writeBrowserResponse(
            response,
            400,
            '로그인 실패',
            '인증 요청을 확인할 수 없습니다. 앱에서 다시 시도해 주세요.',
          )
          finish(server, new Error('Google OAuth state mismatch'))
          return
        }

        const code = requestUrl.searchParams.get('code')
        if (!code) {
          writeBrowserResponse(
            response,
            400,
            '로그인 실패',
            '인증 코드가 전달되지 않았습니다. 앱에서 다시 시도해 주세요.',
          )
          finish(server, new Error('Google OAuth code is missing'))
          return
        }

        const address = server.address()
        if (!address || typeof address === 'string') {
          throw new Error('OAuth callback server address is unavailable')
        }
        const redirectUri = `http://${LOOPBACK_HOST}:${address.port}${OAUTH_CALLBACK_PATH}`
        const flowClient = new OAuth2Client(
          googleCredentials.client_id,
          googleCredentials.client_secret,
          redirectUri,
        )
        const tokenResponse = await flowClient.getToken({
          code,
          redirect_uri: redirectUri,
        })
        client.setCredentials(tokenResponse.tokens)
        await persistClientCredentials()

        writeBrowserResponse(
          response,
          200,
          '로그인 완료',
          '인증이 완료되었습니다. 이 창을 닫고 앱으로 돌아가세요.',
        )
        finish(server, undefined, client.credentials)
      } catch (error) {
        console.error('Google OAuth callback failed', error)
        if (!response.headersSent) {
          writeBrowserResponse(
            response,
            500,
            '로그인 실패',
            '인증 처리 중 오류가 발생했습니다. 앱에서 다시 시도해 주세요.',
          )
        }
        finish(
          server,
          error instanceof Error ? error : new Error(String(error)),
        )
      }
    })

    server.on('error', (error) => finish(server, error))
    server.listen(0, LOOPBACK_HOST, async () => {
      try {
        const address = server.address()
        if (!address || typeof address === 'string') {
          throw new Error('OAuth callback server address is unavailable')
        }

        const redirectUri = `http://${LOOPBACK_HOST}:${address.port}${OAUTH_CALLBACK_PATH}`
        const flowClient = new OAuth2Client(
          googleCredentials.client_id,
          googleCredentials.client_secret,
          redirectUri,
        )
        const authUrl = flowClient.generateAuthUrl({
          access_type: 'offline',
          prompt: 'consent',
          scope: SCOPES,
          state,
        })
        const parsedAuthUrl = new URL(authUrl)
        if (
          parsedAuthUrl.protocol !== 'https:'
          || parsedAuthUrl.hostname !== 'accounts.google.com'
        ) {
          throw new Error('Unexpected Google authorization URL')
        }
        await openAuthorizationUrlWithRetry(
          parsedAuthUrl.toString(),
          () => settled,
        )
      } catch (error) {
        finish(
          server,
          error instanceof Error ? error : new Error(String(error)),
        )
      }
    })

    const timeout = setTimeout(
      () => finish(server, new Error('Google OAuth timed out')),
      OAUTH_TIMEOUT_MS,
    )
  })
}

export function authorizeInteractively() {
  if (!interactiveAuthorization) {
    interactiveAuthorization = runInteractiveAuthorization()
      .finally(() => {
        interactiveAuthorization = null
      })
  }
  return interactiveAuthorization
}

export async function ensureAuthorization(interactive: boolean) {
  if (await hasValidAuthorization()) {
    return true
  }
  if (!interactive) {
    return false
  }

  await authorizeInteractively()
  return true
}

export async function clearAuthorization() {
  client.setCredentials({})
  await removeTokenFile()
}
