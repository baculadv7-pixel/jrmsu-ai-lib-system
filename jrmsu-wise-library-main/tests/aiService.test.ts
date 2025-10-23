import { describe, it, expect } from 'vitest'
import { aiService } from '../src/services/aiService'

describe('AI Service - analyzeEmotion', () => {
  it('detects joy with high confidence for positive text', async () => {
    const res = await aiService.analyzeEmotion('I am so happy and excited! This is fantastic!!')
    expect(['joy','gratitude','surprise']).toContain(res.emotion)
    expect(res.tone).toBe('positive')
    expect(res.confidence).toBeGreaterThan(0.5)
  })

  it('detects anger or sadness for negative expressions', async () => {
    const res = await aiService.analyzeEmotion('I am angry and frustrated about this problem')
    expect(['anger','sadness','fear']).toContain(res.emotion)
    expect(res.tone).toBe('negative')
  })
})

describe('AI Service - detectAdminCommand', () => {
  it('detects backup command requiring 2FA', () => {
    const cmd = aiService.detectAdminCommand('Please backup the database including AI data', 'admin')
    expect(cmd.type).toBe('backup')
    expect(cmd.requires2FA).toBe(true)
    expect(cmd.requiresConfirmation).toBe(true)
  })

  it('detects monthly report without 2FA', () => {
    const cmd = aiService.detectAdminCommand('Generate monthly report as PDF', 'admin')
    expect(cmd.type).toBe('report')
    expect(cmd.requires2FA).toBe(false)
  })

  it('returns none for non-admin users', () => {
    const cmd = aiService.detectAdminCommand('backup database', 'student' as any)
    expect(cmd.type).toBe('none')
  })
})
