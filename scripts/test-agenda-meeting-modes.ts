/**
 * Unit tests for Agenda meeting modes / manual links / legacy compatibility.
 * Uses only modules without path aliases so tsx can run them.
 */
import assert from 'node:assert/strict'
import {
  getMeetingJoinInfo,
  isValidHttpsMeetingUrl,
  resolveMeetingModeFields,
  toLegacyMeetingProvider,
} from '../src/features/agenda/utils/meetingModeUtils.ts'
import type { Meeting } from '../src/features/agenda/types/meeting.types.ts'

function testHttpsUrlValidation() {
  assert.equal(isValidHttpsMeetingUrl('https://meet.google.com/aaa-bbbb-ccc'), true)
  assert.equal(isValidHttpsMeetingUrl('https://zoom.us/j/123'), true)
  assert.equal(isValidHttpsMeetingUrl('https://teams.microsoft.com/l/meetup-join/abc'), true)
  assert.equal(isValidHttpsMeetingUrl('http://insecure.example'), false)
  assert.equal(isValidHttpsMeetingUrl('not-a-url'), false)
}

function testLegacyGoogleMeetFallback() {
  const resolved = resolveMeetingModeFields({
    googleMeetUrl: 'https://meet.google.com/legacy',
    meetingProvider: 'google_meet',
  })
  assert.equal(resolved.meetingMode, 'video')
  assert.equal(resolved.videoProvider, 'google_meet')
  assert.equal(resolved.meetingUrl, 'https://meet.google.com/legacy')
  assert.equal(resolved.meetingProvider, 'google_meet')
}

function testLegacyOtherFallback() {
  const resolved = resolveMeetingModeFields({
    meetingProvider: 'none',
  })
  assert.equal(resolved.meetingMode, 'other')
  assert.equal(resolved.videoProvider, 'none')
  assert.equal(resolved.meetingUrl, null)
}

function testExplicitManualMode() {
  const resolved = resolveMeetingModeFields({
    meetingMode: 'video',
    videoProvider: 'manual',
    meetingUrl: 'https://zoom.us/j/999',
  })
  assert.equal(resolved.meetingMode, 'video')
  assert.equal(resolved.videoProvider, 'manual')
  assert.equal(resolved.meetingUrl, 'https://zoom.us/j/999')
  assert.equal(toLegacyMeetingProvider('manual'), 'none')
}

function testInPersonMode() {
  const resolved = resolveMeetingModeFields({
    meetingMode: 'in_person',
    videoProvider: 'none',
    location: 'Café Central',
  })
  assert.equal(resolved.meetingMode, 'in_person')
  assert.equal(resolved.videoProvider, 'none')
  assert.equal(resolved.location, 'Café Central')
  assert.equal(resolved.meetingUrl, null)
}

function testJoinInfoParticipantCanOpenManual() {
  const meeting = {
    id: 'm1',
    meetingMode: 'video',
    videoProvider: 'manual',
    meetingUrl: 'https://zoom.us/j/1',
    googleMeetUrl: null,
    status: 'scheduled',
  } as Meeting
  const join = getMeetingJoinInfo(meeting)
  assert.ok(join)
  assert.equal(join.url, 'https://zoom.us/j/1')
  assert.equal(join.cta, 'Entrar a la reunión')
  assert.equal(join.label, 'Videollamada')
}

function testJoinInfoGoogleMeet() {
  const meeting = {
    id: 'm2',
    meetingMode: 'video',
    videoProvider: 'google_meet',
    meetingUrl: 'https://meet.google.com/xxx-yyyy-zzz',
    googleMeetUrl: 'https://meet.google.com/xxx-yyyy-zzz',
    status: 'scheduled',
  } as Meeting
  const join = getMeetingJoinInfo(meeting)
  assert.ok(join)
  assert.equal(join.cta, 'Entrar a Meet')
  assert.equal(join.label, 'Google Meet')
}

function testNoJoinForInPerson() {
  const meeting = {
    id: 'm3',
    meetingMode: 'in_person',
    videoProvider: 'none',
    meetingUrl: null,
    googleMeetUrl: null,
    status: 'scheduled',
  } as Meeting
  assert.equal(getMeetingJoinInfo(meeting), null)
}

testHttpsUrlValidation()
testLegacyGoogleMeetFallback()
testLegacyOtherFallback()
testExplicitManualMode()
testInPersonMode()
testJoinInfoParticipantCanOpenManual()
testJoinInfoGoogleMeet()
testNoJoinForInPerson()

console.log('Agenda meeting-mode tests: PASS')
