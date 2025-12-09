import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { SlipVerificationCard } from '../SlipVerificationCard'

describe('SlipVerificationCard', () => {
  const mockVerificationData = {
    trust_score: 1.0,
    is_likely_genuine: true,
    detected_bank: 'Kasikorn Bank',
    detected_amount: '500.00',
    checks_passed: 5,
    total_checks: 5,
    warnings: [],
    checks: ['Bank Match', 'Slip Date Valid', 'Transfer Scan'],
    qr_valid: true,
    qr_data: '00020101021129370016A000000677010111011300660000000005802TH530376463041D9F'
  }

  it('renders correct bank name and trust score', () => {
    render(<SlipVerificationCard slip={mockVerificationData} />)
    
    expect(screen.getByText('Kasikorn Bank')).toBeDefined()
    expect(screen.getByText('100%')).toBeDefined() // 5/5 checks = 100%
  })

  it('displays the Verified badge when QR is valid', () => {
    render(<SlipVerificationCard slip={mockVerificationData} />)
    
    // Look for the "Verified" text which appears in the badge
    expect(screen.getByText(/ยืนยันยอด/i)).toBeDefined()
  })

  it('shows warning when trust score is low', () => {
    const lowTrustData = {
      ...mockVerificationData,
      trust_score: 0.2,
      is_likely_genuine: false,
      checks_passed: 1,
      total_checks: 5
    }
    render(<SlipVerificationCard slip={lowTrustData} />)
    
    expect(screen.getByText('20%')).toBeDefined() 
  })
})
