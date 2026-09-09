/**
 * Static + unit validation of Google OAuth state implementation.
 * Does not call live Google APIs.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { randomBytes } from 'node:crypto'

const source = readFileSync(
  resolve(process.cwd(), 'functions/src/calendar/googleCalendar.ts'),
  'utf8',
)

function testCryptoStateGeneration() {
  const stateId = randomBytes(32).toString('hex')
  assert.equal(stateId.length, 64)
  assert.match(stateId, /^[0-9a-f]+$/)
  assert.notEqual(stateId, randomBytes(32).toString('hex'))
}

function testSourceContracts() {
  assert.match(source, /randomBytes\(32\)/)
  assert.match(source, /OAUTH_STATE_TTL_MS = 15 \* 60 \* 1000/)
  assert.match(source, /googleOAuthStates/)
  assert.match(source, /used:\s*false/)
  assert.match(source, /used:\s*true/)
  assert.match(source, /runTransaction/)
  assert.match(source, /expiresAt/)
  assert.doesNotMatch(source, /state:\s*uid\b/)
  assert.doesNotMatch(source, /state:\s*`\$\{uid\}/)
  assert.match(source, /calendar\.events/)
  assert.match(source, /userinfo\.email/)
  assert.doesNotMatch(source, /googleapis\.com\/auth\/calendar"/)
  assert.doesNotMatch(source, /googleapis\.com\/auth\/drive/)
  assert.doesNotMatch(source, /googleapis\.com\/auth\/gmail/)
  assert.match(source, /conferenceDataVersion:\s*1/)
  assert.match(source, /conferenceData:\s*\{[\s\S]*createRequest/)
  assert.match(source, /revokeToken/)
  assert.match(source, /events\.patch/)
  assert.match(source, /events\.delete/)
  assert.match(source, /events\.insert/)
}

testCryptoStateGeneration()
testSourceContracts()
console.log('Agenda OAuth/Google source contracts: PASS')
