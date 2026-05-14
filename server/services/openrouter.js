const https = require('https');

async function callOpenRouter(prompt, systemPrompt = 'You are an AI assistant specializing in debt collection optimization. Provide professional, compliance-aware, and empathetic responses.') {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022';

  if (!apiKey || apiKey === 'your_openrouter_api_key_here') {
    return {
      success: false,
      error: 'OpenRouter API key not configured. Please set OPENROUTER_API_KEY in .env file.',
      mock: true,
      result: generateMockResponse(prompt)
    };
  }

  const data = JSON.stringify({
    model: model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ],
    temperature: 0.7,
    max_tokens: 2000
  });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'openrouter.ai',
      path: '/api/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'AI Debt Collection Optimizer'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (parsed.error) {
            resolve({ success: false, error: parsed.error.message || 'OpenRouter API error', raw: parsed });
          } else {
            const content = parsed.choices?.[0]?.message?.content || '';
            resolve({
              success: true,
              content: content,
              model: parsed.model,
              usage: parsed.usage,
              raw: parsed
            });
          }
        } catch (e) {
          resolve({ success: false, error: 'Failed to parse response', raw: body });
        }
      });
    });

    req.on('error', (e) => {
      resolve({ success: false, error: e.message });
    });

    req.write(data);
    req.end();
  });
}

function generateMockResponse(prompt) {
  const lower = prompt.toLowerCase();
  if (lower.includes('risk') || lower.includes('assess')) {
    return 'Based on the debtor profile analysis, the risk score is MEDIUM (62/100). Key factors: payment history shows 3 missed payments in the last 6 months, but the debtor has maintained employment stability. Recommended approach: structured payment plan with bi-weekly installments.';
  }
  if (lower.includes('communication') || lower.includes('message') || lower.includes('template')) {
    return 'Dear [Debtor Name],\n\nWe understand that managing financial obligations can be challenging. We are reaching out to discuss your account and explore options that work for your current situation.\n\nOur goal is to find a mutually beneficial solution. We have several flexible payment arrangements available, including reduced settlement amounts and extended payment plans.\n\nPlease contact us at your earliest convenience to discuss these options.\n\nBest regards,\nCollections Team';
  }
  if (lower.includes('compliance') || lower.includes('regulat')) {
    return 'Compliance Check Results:\n- FDCPA Compliance: PASS - All communications meet Fair Debt Collection Practices Act requirements\n- TCPA Compliance: PASS - Contact times within allowed windows (8am-9pm local time)\n- State Regulations: WARNING - Check state-specific requirements for debtor\'s jurisdiction\n- Documentation: PASS - All required disclosures included\n- Mini-Miranda: PASS - Debt validation notice properly included';
  }
  if (lower.includes('settlement') || lower.includes('offer')) {
    return 'Settlement Recommendation:\n- Original Debt: $5,000.00\n- Recommended Settlement: $3,250.00 (65% of original)\n- Confidence Level: HIGH\n- Reasoning: Debtor has shown willingness to pay but faces temporary financial hardship. A 35% discount with a 3-month payment window has an 78% acceptance probability based on similar cases.';
  }
  if (lower.includes('predict') || lower.includes('recovery')) {
    return 'Recovery Prediction Analysis:\n- 30-day recovery probability: 45%\n- 60-day recovery probability: 62%\n- 90-day recovery probability: 78%\n- Expected recovery amount: $3,800 of $5,200 total\n- Recommended strategy: Escalated outreach with settlement offer at 70% within 30 days';
  }
  if (lower.includes('payment') || lower.includes('plan')) {
    return 'Recommended Payment Plan:\n- Total Debt: $8,500.00\n- Monthly Payment: $425.00\n- Duration: 20 months\n- Interest Rate: 0% (goodwill adjustment)\n- First Payment Due: 15 days from agreement\n- This plan considers the debtor\'s reported monthly income of $3,200 and ensures payments do not exceed 15% of income.';
  }
  if (lower.includes('campaign') || lower.includes('outreach')) {
    return 'Campaign Optimization Suggestions:\n1. Prioritize email outreach for accounts 30-60 days past due (highest response rate: 34%)\n2. Schedule phone calls for Tue-Thu 10am-2pm (42% higher connection rate)\n3. Send SMS reminders 3 days before payment due dates\n4. Use empathetic tone templates (23% higher payment rate)\n5. Escalate to mail for accounts 90+ days with no digital engagement';
  }
  if (lower.includes('schedule') || lower.includes('contact') || lower.includes('timing')) {
    return 'Optimal Contact Schedule:\n- Best Days: Tuesday, Wednesday, Thursday\n- Best Times: 10:00 AM - 12:00 PM, 2:00 PM - 4:00 PM (debtor local time)\n- Avoid: Monday mornings, Friday afternoons, weekends\n- Channel Priority: 1) Email, 2) SMS, 3) Phone call\n- Frequency: Max 3 contacts per week, minimum 48 hours between attempts\n- Note: Reduce frequency after 3rd unanswered attempt, switch channels';
  }
  if (lower.includes('dispute')) {
    return 'Dispute Resolution Recommendation:\n- Dispute Type: Amount Contested\n- Validity Assessment: PARTIAL - Debtor claims are partially supported\n- Recommended Action: Review original documentation, adjust balance if fees were incorrectly applied\n- Response Timeline: Must respond within 30 days per FDCPA\n- Documentation Required: Original agreement, payment history, fee schedule';
  }
  return 'Analysis complete. Based on the current data, I recommend a balanced approach combining empathetic communication, flexible payment options, and compliance-first strategy. The AI model suggests prioritizing accounts with the highest recovery probability while maintaining ethical collection practices. Key metrics show a potential 23% improvement in recovery rates with the optimized approach.';
}

module.exports = { callOpenRouter };
