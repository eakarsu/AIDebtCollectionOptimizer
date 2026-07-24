require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'debt_collection_optimizer',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function seed() {
  const client = await pool.connect();
  try {
    // Drop and recreate all tables
    await client.query(`
      DROP TABLE IF EXISTS recovery_predictions CASCADE;
      DROP TABLE IF EXISTS regulatory_alerts CASCADE;
      DROP TABLE IF EXISTS contact_schedules CASCADE;
      DROP TABLE IF EXISTS settlements CASCADE;
      DROP TABLE IF EXISTS portfolios CASCADE;
      DROP TABLE IF EXISTS collection_agents CASCADE;
      DROP TABLE IF EXISTS payments CASCADE;
      DROP TABLE IF EXISTS disputes CASCADE;
      DROP TABLE IF EXISTS analytics CASCADE;
      DROP TABLE IF EXISTS risk_assessments CASCADE;
      DROP TABLE IF EXISTS compliance_checks CASCADE;
      DROP TABLE IF EXISTS communications CASCADE;
      DROP TABLE IF EXISTS payment_plans CASCADE;
      DROP TABLE IF EXISTS campaigns CASCADE;
      DROP TABLE IF EXISTS debtors CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `);

    // Users table
    await client.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'admin',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Debtors table
    await client.query(`
      CREATE TABLE debtors (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        address TEXT,
        total_debt DECIMAL(12,2),
        status VARCHAR(50) DEFAULT 'active',
        account_number VARCHAR(50),
        last_contact TIMESTAMP,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Campaigns table
    await client.query(`
      CREATE TABLE campaigns (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(100),
        status VARCHAR(50) DEFAULT 'draft',
        target_audience VARCHAR(255),
        start_date DATE,
        end_date DATE,
        budget DECIMAL(10,2),
        response_rate DECIMAL(5,2),
        recovery_rate DECIMAL(5,2),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Payment Plans table
    await client.query(`
      CREATE TABLE payment_plans (
        id SERIAL PRIMARY KEY,
        debtor_name VARCHAR(255) NOT NULL,
        original_amount DECIMAL(12,2),
        plan_amount DECIMAL(12,2),
        monthly_payment DECIMAL(10,2),
        duration_months INTEGER,
        interest_rate DECIMAL(5,2),
        status VARCHAR(50) DEFAULT 'proposed',
        start_date DATE,
        next_payment_date DATE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Communications table
    await client.query(`
      CREATE TABLE communications (
        id SERIAL PRIMARY KEY,
        template_name VARCHAR(255) NOT NULL,
        type VARCHAR(100),
        subject VARCHAR(255),
        body TEXT,
        tone VARCHAR(100),
        compliance_status VARCHAR(50),
        effectiveness_score DECIMAL(5,2),
        use_count INTEGER DEFAULT 0,
        category VARCHAR(100),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Compliance Checks table
    await client.query(`
      CREATE TABLE compliance_checks (
        id SERIAL PRIMARY KEY,
        check_name VARCHAR(255) NOT NULL,
        regulation VARCHAR(100),
        status VARCHAR(50),
        category VARCHAR(100),
        description TEXT,
        risk_level VARCHAR(50),
        last_checked TIMESTAMP,
        next_review DATE,
        findings TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Risk Assessments table
    await client.query(`
      CREATE TABLE risk_assessments (
        id SERIAL PRIMARY KEY,
        debtor_name VARCHAR(255) NOT NULL,
        risk_score INTEGER,
        risk_level VARCHAR(50),
        factors TEXT,
        recommendation TEXT,
        collection_probability DECIMAL(5,2),
        estimated_recovery DECIMAL(12,2),
        last_assessed TIMESTAMP,
        account_age_days INTEGER,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Analytics table
    await client.query(`
      CREATE TABLE analytics (
        id SERIAL PRIMARY KEY,
        metric_name VARCHAR(255) NOT NULL,
        category VARCHAR(100),
        value DECIMAL(15,2),
        previous_value DECIMAL(15,2),
        change_percent DECIMAL(8,2),
        period VARCHAR(50),
        period_start DATE,
        period_end DATE,
        trend VARCHAR(50),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Disputes table
    await client.query(`
      CREATE TABLE disputes (
        id SERIAL PRIMARY KEY,
        debtor_name VARCHAR(255) NOT NULL,
        dispute_type VARCHAR(100),
        status VARCHAR(50),
        amount_disputed DECIMAL(12,2),
        description TEXT,
        resolution TEXT,
        filed_date DATE,
        resolved_date DATE,
        priority VARCHAR(50),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Payments table
    await client.query(`
      CREATE TABLE payments (
        id SERIAL PRIMARY KEY,
        debtor_name VARCHAR(255) NOT NULL,
        amount DECIMAL(12,2),
        payment_method VARCHAR(100),
        status VARCHAR(50),
        reference_number VARCHAR(100),
        payment_date DATE,
        due_date DATE,
        account_number VARCHAR(50),
        plan_id INTEGER,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Collection Agents table
    await client.query(`
      CREATE TABLE collection_agents (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        team VARCHAR(100),
        status VARCHAR(50) DEFAULT 'active',
        accounts_assigned INTEGER DEFAULT 0,
        total_recovered DECIMAL(12,2) DEFAULT 0,
        success_rate DECIMAL(5,2) DEFAULT 0,
        performance_score DECIMAL(5,2) DEFAULT 0,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Portfolios table
    await client.query(`
      CREATE TABLE portfolios (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        total_accounts INTEGER,
        total_value DECIMAL(15,2),
        recovered_value DECIMAL(15,2),
        recovery_rate DECIMAL(5,2),
        average_age_days INTEGER,
        status VARCHAR(50),
        acquisition_date DATE,
        source VARCHAR(255),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Settlements table
    await client.query(`
      CREATE TABLE settlements (
        id SERIAL PRIMARY KEY,
        debtor_name VARCHAR(255) NOT NULL,
        original_amount DECIMAL(12,2),
        settlement_amount DECIMAL(12,2),
        discount_percent DECIMAL(5,2),
        status VARCHAR(50),
        offered_date DATE,
        expiry_date DATE,
        accepted_date DATE,
        payment_terms VARCHAR(255),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Contact Schedules table
    await client.query(`
      CREATE TABLE contact_schedules (
        id SERIAL PRIMARY KEY,
        debtor_name VARCHAR(255) NOT NULL,
        contact_type VARCHAR(100),
        scheduled_date DATE,
        scheduled_time TIME,
        status VARCHAR(50),
        priority VARCHAR(50),
        agent_name VARCHAR(255),
        channel VARCHAR(100),
        attempt_number INTEGER DEFAULT 1,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Regulatory Alerts table
    await client.query(`
      CREATE TABLE regulatory_alerts (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        regulation VARCHAR(100),
        type VARCHAR(100),
        severity VARCHAR(50),
        description TEXT,
        effective_date DATE,
        impact_area VARCHAR(255),
        action_required TEXT,
        status VARCHAR(50),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Recovery Predictions table
    await client.query(`
      CREATE TABLE recovery_predictions (
        id SERIAL PRIMARY KEY,
        debtor_name VARCHAR(255) NOT NULL,
        debt_amount DECIMAL(12,2),
        predicted_recovery DECIMAL(12,2),
        confidence_score DECIMAL(5,2),
        prediction_model VARCHAR(100),
        factors TEXT,
        time_horizon_days INTEGER,
        recommended_strategy TEXT,
        predicted_date DATE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    console.log('All tables created successfully.');

    // Seed Users
    const demoEmail = process.env.DEMO_EMAIL || '';
    const demoPassword = process.env.DEMO_PASSWORD || '';
    if (!demoEmail.includes('@')) throw new Error('DEMO_EMAIL must be a valid email address');
    if (demoPassword.length < 12) throw new Error('DEMO_PASSWORD must be at least 12 characters');
    const hash = await bcrypt.hash(demoPassword, 10);
    await client.query(`INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, $4)`,
      [demoEmail, hash, 'Admin User', 'admin']);
    console.log('User seeded.');

    // Seed Debtors (15 items)
    const debtors = [
      ['John Smith', 'john.smith@email.com', '(555) 123-4567', '123 Oak St, Springfield, IL 62701', 8500.00, 'active', 'ACC-001', '2024-01-15'],
      ['Maria Garcia', 'maria.garcia@email.com', '(555) 234-5678', '456 Elm Ave, Chicago, IL 60601', 12300.50, 'active', 'ACC-002', '2024-01-20'],
      ['Robert Johnson', 'robert.j@email.com', '(555) 345-6789', '789 Pine Rd, Denver, CO 80201', 5200.00, 'in_negotiation', 'ACC-003', '2024-02-01'],
      ['Sarah Williams', 'sarah.w@email.com', '(555) 456-7890', '321 Maple Dr, Austin, TX 73301', 15750.25, 'active', 'ACC-004', '2024-01-10'],
      ['Michael Brown', 'michael.b@email.com', '(555) 567-8901', '654 Cedar Ln, Seattle, WA 98101', 3200.00, 'payment_plan', 'ACC-005', '2024-02-15'],
      ['Jennifer Davis', 'jennifer.d@email.com', '(555) 678-9012', '987 Birch St, Portland, OR 97201', 22100.00, 'active', 'ACC-006', '2024-01-25'],
      ['David Wilson', 'david.w@email.com', '(555) 789-0123', '147 Walnut Ave, Miami, FL 33101', 9800.75, 'disputed', 'ACC-007', '2024-02-10'],
      ['Lisa Anderson', 'lisa.a@email.com', '(555) 890-1234', '258 Spruce Rd, Boston, MA 02101', 6700.00, 'active', 'ACC-008', '2024-01-30'],
      ['James Taylor', 'james.t@email.com', '(555) 901-2345', '369 Ash Dr, Phoenix, AZ 85001', 18500.00, 'delinquent', 'ACC-009', '2024-02-05'],
      ['Patricia Martinez', 'patricia.m@email.com', '(555) 012-3456', '741 Poplar Ln, San Diego, CA 92101', 4100.50, 'payment_plan', 'ACC-010', '2024-02-20'],
      ['Christopher Lee', 'chris.l@email.com', '(555) 123-7890', '852 Willow St, Nashville, TN 37201', 11200.00, 'active', 'ACC-011', '2024-01-18'],
      ['Amanda Clark', 'amanda.c@email.com', '(555) 234-8901', '963 Oak Ct, Charlotte, NC 28201', 7800.25, 'in_negotiation', 'ACC-012', '2024-02-12'],
      ['Daniel Rodriguez', 'daniel.r@email.com', '(555) 345-9012', '174 Pine Pl, Las Vegas, NV 89101', 25600.00, 'active', 'ACC-013', '2024-01-22'],
      ['Elizabeth Thomas', 'elizabeth.t@email.com', '(555) 456-0123', '285 Elm Way, Atlanta, GA 30301', 3900.00, 'settled', 'ACC-014', '2024-02-08'],
      ['Matthew Jackson', 'matthew.j@email.com', '(555) 567-1234', '396 Maple Ct, Minneapolis, MN 55401', 14200.75, 'active', 'ACC-015', '2024-01-28'],
      ['Ashley White', 'ashley.w@email.com', '(555) 678-2345', '507 Cedar Pl, Detroit, MI 48201', 8900.00, 'delinquent', 'ACC-016', '2024-02-18']
    ];

    for (const d of debtors) {
      await client.query(
        `INSERT INTO debtors (name, email, phone, address, total_debt, status, account_number, last_contact) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        d
      );
    }
    console.log('Debtors seeded: ' + debtors.length);

    // Seed Campaigns (15 items)
    const campaigns = [
      ['Q1 Email Blast', 'email', 'active', '30-60 days past due', '2024-01-01', '2024-03-31', 5000.00, 34.50, 22.30],
      ['SMS Payment Reminder', 'sms', 'active', 'All active accounts', '2024-01-15', '2024-06-30', 2000.00, 45.20, 18.70],
      ['Phone Outreach Wave 1', 'phone', 'completed', '60-90 days past due', '2024-01-01', '2024-01-31', 8000.00, 28.00, 35.50],
      ['Direct Mail Campaign', 'mail', 'active', '90+ days past due', '2024-02-01', '2024-04-30', 12000.00, 15.30, 42.10],
      ['Early Intervention Email', 'email', 'draft', '1-30 days past due', '2024-03-01', '2024-05-31', 3000.00, 0, 0],
      ['Settlement Offer Blast', 'email', 'active', 'Accounts over $10K', '2024-01-20', '2024-03-20', 4500.00, 22.80, 55.20],
      ['Holiday Payment Drive', 'multi-channel', 'completed', 'All accounts', '2023-12-01', '2023-12-31', 15000.00, 38.90, 28.40],
      ['High-Value Phone Campaign', 'phone', 'active', 'Accounts over $20K', '2024-02-01', '2024-04-30', 10000.00, 42.10, 48.30],
      ['Automated SMS Series', 'sms', 'active', '30-90 days past due', '2024-01-10', '2024-12-31', 1500.00, 52.30, 15.80],
      ['Legal Notice Preview', 'mail', 'paused', '120+ days past due', '2024-02-15', '2024-05-15', 6000.00, 18.40, 62.70],
      ['Empathetic Outreach', 'email', 'active', 'Hardship cases', '2024-02-01', '2024-07-31', 3500.00, 40.60, 20.50],
      ['Payment Plan Promo', 'multi-channel', 'active', 'Active negotiations', '2024-01-15', '2024-06-15', 7000.00, 35.70, 32.80],
      ['Re-engagement Campaign', 'email', 'draft', 'No contact 60+ days', '2024-03-15', '2024-06-15', 4000.00, 0, 0],
      ['Weekend SMS Reminders', 'sms', 'active', 'Payment plan accounts', '2024-01-01', '2024-12-31', 800.00, 48.90, 25.30],
      ['Compliance Check Outreach', 'email', 'active', 'Disputed accounts', '2024-02-10', '2024-04-10', 2500.00, 30.20, 12.40]
    ];

    for (const c of campaigns) {
      await client.query(
        `INSERT INTO campaigns (name, type, status, target_audience, start_date, end_date, budget, response_rate, recovery_rate) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        c
      );
    }
    console.log('Campaigns seeded: ' + campaigns.length);

    // Seed Payment Plans (15 items)
    const paymentPlans = [
      ['John Smith', 8500.00, 8500.00, 425.00, 20, 0, 'active', '2024-01-20', '2024-03-20'],
      ['Maria Garcia', 12300.50, 10000.00, 500.00, 20, 0, 'active', '2024-02-01', '2024-04-01'],
      ['Michael Brown', 3200.00, 3200.00, 266.67, 12, 0, 'active', '2024-02-20', '2024-04-20'],
      ['Patricia Martinez', 4100.50, 4100.50, 341.71, 12, 0, 'active', '2024-03-01', '2024-05-01'],
      ['Sarah Williams', 15750.25, 14000.00, 583.33, 24, 2.5, 'proposed', '2024-03-01', '2024-04-01'],
      ['Robert Johnson', 5200.00, 4500.00, 375.00, 12, 0, 'negotiating', '2024-03-15', '2024-04-15'],
      ['Lisa Anderson', 6700.00, 6700.00, 558.33, 12, 0, 'proposed', '2024-03-01', '2024-04-01'],
      ['Christopher Lee', 11200.00, 9500.00, 527.78, 18, 1.5, 'active', '2024-01-25', '2024-03-25'],
      ['Amanda Clark', 7800.25, 7000.00, 388.89, 18, 0, 'negotiating', '2024-03-01', '2024-04-01'],
      ['Matthew Jackson', 14200.75, 12000.00, 500.00, 24, 2.0, 'proposed', '2024-03-15', '2024-04-15'],
      ['Ashley White', 8900.00, 8900.00, 742.50, 12, 0, 'defaulted', '2023-10-01', '2024-01-01'],
      ['Daniel Rodriguez', 25600.00, 20000.00, 833.33, 24, 3.0, 'proposed', '2024-04-01', '2024-05-01'],
      ['Jennifer Davis', 22100.00, 18000.00, 750.00, 24, 2.5, 'active', '2024-02-10', '2024-04-10'],
      ['James Taylor', 18500.00, 15000.00, 625.00, 24, 2.0, 'proposed', '2024-03-01', '2024-04-01'],
      ['David Wilson', 9800.75, 8500.00, 472.22, 18, 1.0, 'on_hold', '2024-02-15', '2024-04-15']
    ];

    for (const p of paymentPlans) {
      await client.query(
        `INSERT INTO payment_plans (debtor_name, original_amount, plan_amount, monthly_payment, duration_months, interest_rate, status, start_date, next_payment_date) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        p
      );
    }
    console.log('Payment Plans seeded: ' + paymentPlans.length);

    // Seed Communications (15 items)
    const communications = [
      ['Initial Contact - Friendly', 'email', 'Account Balance Reminder', 'Dear {name}, we are reaching out regarding your account balance of {amount}. We would like to discuss convenient payment options available to you.', 'friendly', 'approved', 85.50, 234, 'initial_contact'],
      ['Payment Due Reminder', 'sms', 'Payment Reminder', 'Hi {name}, this is a friendly reminder that your payment of {amount} is due on {date}. Reply HELP for options.', 'neutral', 'approved', 72.30, 567, 'reminder'],
      ['Hardship Acknowledgment', 'email', 'We Understand Your Situation', 'Dear {name}, we understand you may be experiencing financial difficulties. We want to work with you to find a manageable solution.', 'empathetic', 'approved', 91.20, 189, 'hardship'],
      ['Settlement Offer', 'email', 'Special Settlement Opportunity', 'Dear {name}, we are pleased to offer you a reduced settlement of {settlement_amount} on your balance of {amount}.', 'professional', 'approved', 78.40, 312, 'settlement'],
      ['Payment Confirmation', 'email', 'Payment Received - Thank You', 'Dear {name}, we have received your payment of {amount}. Thank you for your continued commitment to resolving your account.', 'grateful', 'approved', 95.00, 445, 'confirmation'],
      ['Payment Plan Proposal', 'email', 'Flexible Payment Plan Available', 'Dear {name}, based on your account review, we have prepared a customized payment plan. Monthly payments of {monthly} over {months} months.', 'helpful', 'approved', 82.70, 278, 'payment_plan'],
      ['Phone Script - Initial', 'phone', 'Initial Call Script', 'Hello, may I speak with {name}? This is {agent} calling from Collections. I am calling regarding your account. This is an attempt to collect a debt.', 'professional', 'approved', 68.90, 890, 'phone_script'],
      ['Final Notice', 'mail', 'Important Account Notice', 'Dear {name}, this is a final notice regarding your outstanding balance. Please contact us within 15 days to discuss your options.', 'firm', 'approved', 65.30, 156, 'final_notice'],
      ['Dispute Acknowledgment', 'email', 'Dispute Received', 'Dear {name}, we acknowledge receipt of your dispute. We will investigate and respond within 30 days as required.', 'professional', 'approved', 88.10, 98, 'dispute'],
      ['Payment Plan Completion', 'email', 'Congratulations - Account Resolved', 'Dear {name}, congratulations! You have successfully completed your payment plan. Your account balance is now $0.', 'celebratory', 'approved', 97.50, 67, 'completion'],
      ['Seasonal Goodwill', 'email', 'Holiday Payment Options', 'Dear {name}, during this holiday season, we are offering special payment arrangements. Contact us to learn about reduced settlement options.', 'warm', 'pending', 74.20, 45, 'seasonal'],
      ['Voicemail Script', 'phone', 'Voicemail Message', 'Hello, this message is for {name}. Please call us at {phone} regarding an important business matter. Reference number {ref}.', 'neutral', 'approved', 42.50, 1023, 'voicemail'],
      ['Legal Warning', 'mail', 'Legal Action Notification', 'Dear {name}, failure to respond to our previous communications may result in further action. Please contact us immediately.', 'firm', 'under_review', 58.90, 34, 'legal'],
      ['Payment Arrangement Follow-up', 'email', 'Payment Plan Check-in', 'Dear {name}, we are checking in on your payment arrangement. Your next payment of {amount} is due on {date}. How can we help?', 'supportive', 'approved', 80.60, 345, 'follow_up'],
      ['Welcome to Payment Plan', 'email', 'Payment Plan Confirmation', 'Dear {name}, welcome to your new payment plan! Here are the details: {plan_details}. We are here to support you through this process.', 'encouraging', 'approved', 90.30, 210, 'onboarding']
    ];

    for (const c of communications) {
      await client.query(
        `INSERT INTO communications (template_name, type, subject, body, tone, compliance_status, effectiveness_score, use_count, category) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        c
      );
    }
    console.log('Communications seeded: ' + communications.length);

    // Seed Compliance Checks (15 items)
    const complianceChecks = [
      ['FDCPA Communication Hours', 'FDCPA', 'pass', 'Communication', 'Verify all calls made between 8am-9pm local time', 'low', '2024-02-15', '2024-05-15'],
      ['Mini-Miranda Disclosure', 'FDCPA', 'pass', 'Disclosure', 'All communications include required debt collector disclosure', 'low', '2024-02-15', '2024-05-15'],
      ['Debt Validation Notice', 'FDCPA', 'pass', 'Disclosure', '30-day validation notice sent within 5 days of initial contact', 'medium', '2024-02-10', '2024-05-10'],
      ['TCPA Consent Verification', 'TCPA', 'warning', 'Communication', 'Verify express consent for automated calls and texts', 'high', '2024-02-20', '2024-03-20'],
      ['State License Compliance', 'State Law', 'pass', 'Licensing', 'All agents licensed in states where collections occur', 'medium', '2024-01-30', '2024-07-30'],
      ['Cease and Desist Tracking', 'FDCPA', 'pass', 'Communication', 'System properly flags and stops contact for C&D requests', 'high', '2024-02-18', '2024-04-18'],
      ['Credit Reporting Accuracy', 'FCRA', 'warning', 'Reporting', 'Ensure all credit bureau reports are accurate and timely', 'high', '2024-02-12', '2024-03-12'],
      ['Third-Party Disclosure', 'FDCPA', 'pass', 'Privacy', 'No debt information disclosed to unauthorized third parties', 'high', '2024-02-15', '2024-05-15'],
      ['Recording Consent', 'State Law', 'pass', 'Communication', 'Two-party consent obtained in all applicable states', 'medium', '2024-02-08', '2024-05-08'],
      ['Payment Processing PCI', 'PCI-DSS', 'pass', 'Security', 'Payment processing meets PCI-DSS compliance standards', 'high', '2024-01-25', '2024-04-25'],
      ['Dispute Response Timeliness', 'FDCPA', 'fail', 'Disputes', '3 disputes exceeded 30-day response requirement', 'high', '2024-02-20', '2024-03-06'],
      ['Military Status Check', 'SCRA', 'pass', 'Special Populations', 'Active military status verified before legal action', 'high', '2024-02-15', '2024-05-15'],
      ['Deceased Debtor Protocol', 'FDCPA', 'pass', 'Special Populations', 'Proper procedures followed for deceased debtor accounts', 'medium', '2024-02-10', '2024-05-10'],
      ['Email CAN-SPAM Compliance', 'CAN-SPAM', 'pass', 'Communication', 'All emails include unsubscribe option and physical address', 'low', '2024-02-18', '2024-05-18'],
      ['Data Retention Policy', 'State Law', 'warning', 'Data Management', 'Review data retention periods against state requirements', 'medium', '2024-02-05', '2024-03-05'],
      ['Interest and Fee Disclosure', 'FDCPA', 'pass', 'Disclosure', 'All interest and fee charges properly disclosed', 'medium', '2024-02-15', '2024-05-15']
    ];

    for (const c of complianceChecks) {
      await client.query(
        `INSERT INTO compliance_checks (check_name, regulation, status, category, description, risk_level, last_checked, next_review) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        c
      );
    }
    console.log('Compliance Checks seeded: ' + complianceChecks.length);

    // Seed Risk Assessments (15 items)
    const riskAssessments = [
      ['John Smith', 62, 'medium', 'Stable employment, 3 missed payments', 'Structured payment plan recommended', 68.50, 5822.50, '2024-02-15', 90],
      ['Maria Garcia', 78, 'high', 'Recent job loss, high debt ratio', 'Hardship program with reduced payments', 42.30, 5203.23, '2024-02-18', 75],
      ['Robert Johnson', 45, 'medium', 'Good history, temporary setback', 'Short-term forbearance then full payments', 75.00, 3900.00, '2024-02-20', 60],
      ['Sarah Williams', 85, 'high', 'Multiple delinquencies, no contact', 'Escalated outreach needed', 35.20, 5544.09, '2024-02-10', 120],
      ['Michael Brown', 30, 'low', 'Active payment plan, consistent', 'Continue current plan', 90.00, 2880.00, '2024-02-22', 45],
      ['Jennifer Davis', 88, 'critical', 'Large balance, dispute filed', 'Legal review recommended', 28.50, 6298.50, '2024-02-12', 105],
      ['David Wilson', 72, 'high', 'Disputed amount, partial payments', 'Dispute resolution then settlement', 55.00, 5390.41, '2024-02-15', 80],
      ['Lisa Anderson', 48, 'medium', 'Responsive but struggling', 'Modified payment plan', 70.00, 4690.00, '2024-02-18', 55],
      ['James Taylor', 82, 'high', 'No response to communications', 'Channel escalation required', 38.00, 7030.00, '2024-02-08', 110],
      ['Patricia Martinez', 25, 'low', 'Active plan, ahead of schedule', 'Maintain current approach', 92.50, 3792.96, '2024-02-20', 35],
      ['Christopher Lee', 55, 'medium', 'Intermittent payments', 'Re-engagement campaign', 62.00, 6944.00, '2024-02-14', 70],
      ['Amanda Clark', 58, 'medium', 'Negotiating settlement', 'Settlement offer at 65%', 65.00, 5070.16, '2024-02-16', 65],
      ['Daniel Rodriguez', 90, 'critical', 'Large balance, no engagement', 'Pre-legal review', 22.00, 5632.00, '2024-02-10', 130],
      ['Elizabeth Thomas', 15, 'low', 'Settled account', 'Account resolved', 98.00, 3822.00, '2024-02-22', 85],
      ['Matthew Jackson', 68, 'high', 'Multiple promises broken', 'Increased monitoring', 48.00, 6816.36, '2024-02-12', 95],
      ['Ashley White', 75, 'high', 'Delinquent, partial contact', 'Firmtone communication shift', 40.00, 3560.00, '2024-02-19', 100]
    ];

    for (const r of riskAssessments) {
      await client.query(
        `INSERT INTO risk_assessments (debtor_name, risk_score, risk_level, factors, recommendation, collection_probability, estimated_recovery, last_assessed, account_age_days) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        r
      );
    }
    console.log('Risk Assessments seeded: ' + riskAssessments.length);

    // Seed Analytics (15 items)
    const analytics = [
      ['Total Recovery Amount', 'recovery', 1250000.00, 1180000.00, 5.93, 'monthly', '2024-02-01', '2024-02-29', 'up'],
      ['Average Collection Rate', 'efficiency', 34.50, 31.20, 10.58, 'monthly', '2024-02-01', '2024-02-29', 'up'],
      ['Total Active Accounts', 'accounts', 1245, 1320, -5.68, 'monthly', '2024-02-01', '2024-02-29', 'down'],
      ['Average Days to Payment', 'efficiency', 42, 48, -12.50, 'monthly', '2024-02-01', '2024-02-29', 'down'],
      ['Settlement Acceptance Rate', 'settlements', 62.30, 58.50, 6.50, 'monthly', '2024-02-01', '2024-02-29', 'up'],
      ['Dispute Rate', 'compliance', 8.20, 9.50, -13.68, 'monthly', '2024-02-01', '2024-02-29', 'down'],
      ['Agent Productivity Score', 'performance', 78.50, 75.20, 4.39, 'monthly', '2024-02-01', '2024-02-29', 'up'],
      ['Email Response Rate', 'communication', 34.80, 32.10, 8.41, 'monthly', '2024-02-01', '2024-02-29', 'up'],
      ['Phone Connection Rate', 'communication', 28.50, 30.20, -5.63, 'monthly', '2024-02-01', '2024-02-29', 'down'],
      ['Compliance Score', 'compliance', 94.20, 92.80, 1.51, 'monthly', '2024-02-01', '2024-02-29', 'up'],
      ['Cost Per Dollar Recovered', 'efficiency', 0.12, 0.14, -14.29, 'monthly', '2024-02-01', '2024-02-29', 'down'],
      ['New Accounts Received', 'accounts', 180, 165, 9.09, 'monthly', '2024-02-01', '2024-02-29', 'up'],
      ['Payment Plan Completion Rate', 'recovery', 72.40, 68.90, 5.08, 'monthly', '2024-02-01', '2024-02-29', 'up'],
      ['Average Settlement Discount', 'settlements', 32.50, 35.20, -7.67, 'monthly', '2024-02-01', '2024-02-29', 'down'],
      ['Customer Satisfaction Score', 'quality', 4.20, 3.90, 7.69, 'monthly', '2024-02-01', '2024-02-29', 'up'],
      ['Portfolio Recovery Rate', 'recovery', 45.30, 42.10, 7.60, 'monthly', '2024-02-01', '2024-02-29', 'up']
    ];

    for (const a of analytics) {
      await client.query(
        `INSERT INTO analytics (metric_name, category, value, previous_value, change_percent, period, period_start, period_end, trend) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        a
      );
    }
    console.log('Analytics seeded: ' + analytics.length);

    // Seed Disputes (15 items)
    const disputes = [
      ['David Wilson', 'Amount Contested', 'open', 2500.00, 'Debtor claims charges were incorrect', null, '2024-02-10', null, 'high'],
      ['Jennifer Davis', 'Not My Debt', 'investigating', 22100.00, 'Debtor claims identity theft', null, '2024-02-05', null, 'critical'],
      ['Sarah Williams', 'Already Paid', 'open', 5000.00, 'Debtor claims partial payment not credited', null, '2024-02-15', null, 'high'],
      ['James Taylor', 'Statute of Limitations', 'under_review', 18500.00, 'Debtor claims debt is time-barred', null, '2024-02-08', null, 'medium'],
      ['John Smith', 'Fee Dispute', 'resolved', 850.00, 'Late fees challenged', 'Fees reduced by 50%', '2024-01-20', '2024-02-10', 'low'],
      ['Maria Garcia', 'Amount Contested', 'open', 3200.00, 'Interest calculation disputed', null, '2024-02-18', null, 'medium'],
      ['Robert Johnson', 'Bankruptcy Filing', 'investigating', 5200.00, 'Debtor claims active bankruptcy case', null, '2024-02-12', null, 'critical'],
      ['Christopher Lee', 'Payment Not Applied', 'open', 1500.00, 'Two payments not reflected in balance', null, '2024-02-20', null, 'high'],
      ['Amanda Clark', 'Wrong Amount', 'resolved', 1200.00, 'Billing error confirmed', 'Balance adjusted by $1,200', '2024-01-15', '2024-02-05', 'medium'],
      ['Daniel Rodriguez', 'Not My Debt', 'investigating', 25600.00, 'Claims never opened this account', null, '2024-02-14', null, 'critical'],
      ['Ashley White', 'Harassment Complaint', 'under_review', 0, 'Claims excessive contact attempts', null, '2024-02-19', null, 'critical'],
      ['Matthew Jackson', 'Fee Dispute', 'open', 2100.00, 'Collection fees seem excessive', null, '2024-02-16', null, 'medium'],
      ['Lisa Anderson', 'Already Paid', 'resolved', 2000.00, 'Found missing payment record', 'Balance updated', '2024-01-25', '2024-02-08', 'low'],
      ['Patricia Martinez', 'Amount Contested', 'open', 500.00, 'Minor discrepancy in balance', null, '2024-02-22', null, 'low'],
      ['Elizabeth Thomas', 'Settled Account', 'resolved', 3900.00, 'Claims account was previously settled', 'Verified and closed', '2024-01-10', '2024-01-30', 'medium']
    ];

    for (const d of disputes) {
      await client.query(
        `INSERT INTO disputes (debtor_name, dispute_type, status, amount_disputed, description, resolution, filed_date, resolved_date, priority) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        d
      );
    }
    console.log('Disputes seeded: ' + disputes.length);

    // Seed Payments (15 items)
    const payments = [
      ['John Smith', 425.00, 'ACH', 'completed', 'PAY-001', '2024-02-20', '2024-02-20', 'ACC-001', 1],
      ['Michael Brown', 266.67, 'credit_card', 'completed', 'PAY-002', '2024-02-15', '2024-02-20', 'ACC-005', 3],
      ['Patricia Martinez', 341.71, 'ACH', 'completed', 'PAY-003', '2024-03-01', '2024-03-01', 'ACC-010', 4],
      ['Christopher Lee', 527.78, 'check', 'completed', 'PAY-004', '2024-02-25', '2024-02-25', 'ACC-011', 8],
      ['Jennifer Davis', 750.00, 'ACH', 'completed', 'PAY-005', '2024-03-10', '2024-03-10', 'ACC-006', 13],
      ['John Smith', 425.00, 'ACH', 'pending', 'PAY-006', null, '2024-03-20', 'ACC-001', 1],
      ['Maria Garcia', 500.00, 'credit_card', 'completed', 'PAY-007', '2024-03-01', '2024-03-01', 'ACC-002', 2],
      ['Michael Brown', 266.67, 'credit_card', 'completed', 'PAY-008', '2024-03-15', '2024-03-20', 'ACC-005', 3],
      ['Elizabeth Thomas', 3900.00, 'wire', 'completed', 'PAY-009', '2024-02-08', '2024-02-08', 'ACC-014', null],
      ['Robert Johnson', 1000.00, 'ACH', 'completed', 'PAY-010', '2024-02-28', '2024-02-28', 'ACC-003', null],
      ['Lisa Anderson', 200.00, 'credit_card', 'failed', 'PAY-011', null, '2024-03-01', 'ACC-008', null],
      ['Patricia Martinez', 341.71, 'ACH', 'pending', 'PAY-012', null, '2024-04-01', 'ACC-010', 4],
      ['Amanda Clark', 500.00, 'check', 'completed', 'PAY-013', '2024-02-20', '2024-02-20', 'ACC-012', null],
      ['Christopher Lee', 527.78, 'ACH', 'pending', 'PAY-014', null, '2024-03-25', 'ACC-011', 8],
      ['Sarah Williams', 1000.00, 'wire', 'completed', 'PAY-015', '2024-02-15', '2024-02-15', 'ACC-004', null],
      ['Matthew Jackson', 500.00, 'credit_card', 'declined', 'PAY-016', null, '2024-03-15', 'ACC-015', null]
    ];

    for (const p of payments) {
      await client.query(
        `INSERT INTO payments (debtor_name, amount, payment_method, status, reference_number, payment_date, due_date, account_number, plan_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        p
      );
    }
    console.log('Payments seeded: ' + payments.length);

    // Seed Collection Agents (15 items)
    const agents = [
      ['Sarah Mitchell', 'sarah.m@company.com', '(555) 100-0001', 'Team Alpha', 'active', 45, 285000.00, 72.50, 88.20],
      ['Marcus Thompson', 'marcus.t@company.com', '(555) 100-0002', 'Team Alpha', 'active', 52, 342000.00, 78.30, 92.10],
      ['Rachel Kim', 'rachel.k@company.com', '(555) 100-0003', 'Team Beta', 'active', 38, 198000.00, 65.40, 79.50],
      ['James O\'Brien', 'james.o@company.com', '(555) 100-0004', 'Team Beta', 'active', 41, 267000.00, 70.20, 85.30],
      ['Angela Torres', 'angela.t@company.com', '(555) 100-0005', 'Team Alpha', 'active', 55, 410000.00, 82.10, 95.40],
      ['David Chen', 'david.c@company.com', '(555) 100-0006', 'Team Gamma', 'active', 33, 156000.00, 58.70, 72.80],
      ['Natalie Brooks', 'natalie.b@company.com', '(555) 100-0007', 'Team Gamma', 'active', 47, 305000.00, 74.80, 89.60],
      ['Carlos Mendez', 'carlos.m@company.com', '(555) 100-0008', 'Team Alpha', 'on_leave', 0, 225000.00, 68.90, 82.40],
      ['Emily Watson', 'emily.w@company.com', '(555) 100-0009', 'Team Beta', 'active', 50, 378000.00, 80.50, 93.20],
      ['Kevin Patel', 'kevin.p@company.com', '(555) 100-0010', 'Team Gamma', 'active', 36, 175000.00, 61.30, 76.50],
      ['Laura Singh', 'laura.s@company.com', '(555) 100-0011', 'Team Beta', 'active', 43, 290000.00, 73.60, 87.90],
      ['Thomas Wright', 'thomas.w@company.com', '(555) 100-0012', 'Team Alpha', 'training', 10, 45000.00, 45.20, 62.30],
      ['Diana Foster', 'diana.f@company.com', '(555) 100-0013', 'Team Gamma', 'active', 39, 210000.00, 66.80, 81.70],
      ['Brian Murphy', 'brian.m@company.com', '(555) 100-0014', 'Team Beta', 'active', 48, 358000.00, 76.90, 90.80],
      ['Jessica Rivera', 'jessica.r@company.com', '(555) 100-0015', 'Team Alpha', 'active', 44, 298000.00, 71.40, 86.50]
    ];

    for (const a of agents) {
      await client.query(
        `INSERT INTO collection_agents (name, email, phone, team, status, accounts_assigned, total_recovered, success_rate, performance_score) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        a
      );
    }
    console.log('Collection Agents seeded: ' + agents.length);

    // Seed Portfolios (15 items)
    const portfolios = [
      ['Medical Debt Portfolio A', 850, 4250000.00, 1912500.00, 45.00, 120, 'active', '2023-06-15', 'City General Hospital'],
      ['Credit Card Portfolio B', 1200, 8400000.00, 3360000.00, 40.00, 180, 'active', '2023-03-20', 'National Bank Corp'],
      ['Student Loan Portfolio C', 650, 9750000.00, 2437500.00, 25.00, 365, 'active', '2022-12-01', 'Federal Education Dept'],
      ['Auto Loan Portfolio D', 420, 3150000.00, 1575000.00, 50.00, 90, 'active', '2023-09-10', 'Auto Finance LLC'],
      ['Utility Debt Portfolio E', 2100, 2100000.00, 1260000.00, 60.00, 60, 'active', '2023-11-01', 'Metro Utilities'],
      ['Telecom Portfolio F', 1800, 3600000.00, 1440000.00, 40.00, 150, 'active', '2023-07-15', 'TeleCom Inc'],
      ['Retail Credit Portfolio G', 550, 2750000.00, 1100000.00, 40.00, 210, 'winding_down', '2022-09-01', 'Retail Giants Corp'],
      ['Personal Loan Portfolio H', 380, 5700000.00, 1710000.00, 30.00, 270, 'active', '2023-01-15', 'Quick Loans Inc'],
      ['Insurance Premium Portfolio I', 920, 1840000.00, 1288000.00, 70.00, 45, 'active', '2023-10-01', 'SecureLife Insurance'],
      ['Commercial Debt Portfolio J', 150, 12000000.00, 3600000.00, 30.00, 300, 'active', '2022-06-01', 'Business Credit Corp'],
      ['Medical Debt Portfolio K', 1100, 5500000.00, 2200000.00, 40.00, 135, 'active', '2023-04-15', 'Regional Health System'],
      ['Government Debt Portfolio L', 300, 4500000.00, 2250000.00, 50.00, 240, 'active', '2022-11-01', 'State Revenue Dept'],
      ['Credit Card Portfolio M', 780, 6240000.00, 1872000.00, 30.00, 200, 'new', '2024-01-15', 'Premier Bank'],
      ['Mortgage Deficiency Portfolio N', 95, 7125000.00, 1425000.00, 20.00, 400, 'active', '2022-03-01', 'Home Lending Corp'],
      ['Healthcare Portfolio O', 680, 3400000.00, 1700000.00, 50.00, 100, 'active', '2023-08-01', 'Multi-Specialty Clinic']
    ];

    for (const p of portfolios) {
      await client.query(
        `INSERT INTO portfolios (name, total_accounts, total_value, recovered_value, recovery_rate, average_age_days, status, acquisition_date, source) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        p
      );
    }
    console.log('Portfolios seeded: ' + portfolios.length);

    // Seed Settlements (15 items)
    const settlements = [
      ['John Smith', 8500.00, 5525.00, 35.00, 'offered', '2024-02-15', '2024-03-15', null, '3 monthly payments'],
      ['Maria Garcia', 12300.50, 8610.35, 30.00, 'offered', '2024-02-18', '2024-03-18', null, 'Lump sum within 30 days'],
      ['Sarah Williams', 15750.25, 9450.15, 40.00, 'negotiating', '2024-02-10', '2024-03-25', null, '6 monthly payments'],
      ['Jennifer Davis', 22100.00, 13260.00, 40.00, 'offered', '2024-02-12', '2024-03-12', null, '4 monthly payments'],
      ['David Wilson', 9800.75, 6860.53, 30.00, 'on_hold', '2024-02-15', '2024-04-15', null, 'Pending dispute resolution'],
      ['James Taylor', 18500.00, 11100.00, 40.00, 'offered', '2024-02-08', '2024-03-08', null, '6 monthly payments'],
      ['Christopher Lee', 11200.00, 7840.00, 30.00, 'accepted', '2024-01-25', '2024-02-25', '2024-02-10', '4 monthly payments'],
      ['Amanda Clark', 7800.25, 5460.18, 30.00, 'negotiating', '2024-02-16', '2024-03-16', null, '3 monthly payments'],
      ['Daniel Rodriguez', 25600.00, 15360.00, 40.00, 'offered', '2024-02-14', '2024-03-14', null, 'Lump sum or 6 payments'],
      ['Matthew Jackson', 14200.75, 9230.49, 35.00, 'offered', '2024-02-12', '2024-03-12', null, '5 monthly payments'],
      ['Ashley White', 8900.00, 5340.00, 40.00, 'expired', '2024-01-10', '2024-02-10', null, 'Lump sum within 30 days'],
      ['Elizabeth Thomas', 3900.00, 2730.00, 30.00, 'completed', '2024-01-05', '2024-02-05', '2024-01-20', 'Lump sum payment'],
      ['Robert Johnson', 5200.00, 3640.00, 30.00, 'negotiating', '2024-02-20', '2024-03-20', null, '3 monthly payments'],
      ['Lisa Anderson', 6700.00, 4690.00, 30.00, 'offered', '2024-02-22', '2024-03-22', null, '4 monthly payments'],
      ['Patricia Martinez', 4100.50, 3075.38, 25.00, 'accepted', '2024-02-01', '2024-03-01', '2024-02-15', '2 monthly payments']
    ];

    for (const s of settlements) {
      await client.query(
        `INSERT INTO settlements (debtor_name, original_amount, settlement_amount, discount_percent, status, offered_date, expiry_date, accepted_date, payment_terms) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        s
      );
    }
    console.log('Settlements seeded: ' + settlements.length);

    // Seed Contact Schedules (15 items)
    const schedules = [
      ['John Smith', 'Follow-up', '2024-03-05', '10:00', 'scheduled', 'medium', 'Sarah Mitchell', 'phone', 3],
      ['Maria Garcia', 'Payment Reminder', '2024-03-04', '14:00', 'scheduled', 'high', 'Marcus Thompson', 'email', 1],
      ['Robert Johnson', 'Negotiation', '2024-03-06', '11:00', 'scheduled', 'high', 'Rachel Kim', 'phone', 2],
      ['Sarah Williams', 'Initial Contact', '2024-03-05', '09:30', 'completed', 'critical', 'Angela Torres', 'phone', 4],
      ['Michael Brown', 'Plan Check-in', '2024-03-07', '15:00', 'scheduled', 'low', 'James O\'Brien', 'email', 1],
      ['Jennifer Davis', 'Dispute Follow-up', '2024-03-04', '10:30', 'overdue', 'critical', 'Emily Watson', 'phone', 5],
      ['David Wilson', 'Dispute Resolution', '2024-03-08', '13:00', 'scheduled', 'high', 'Natalie Brooks', 'phone', 1],
      ['Lisa Anderson', 'Payment Reminder', '2024-03-05', '16:00', 'scheduled', 'medium', 'David Chen', 'sms', 2],
      ['James Taylor', 'Escalation Call', '2024-03-04', '11:30', 'scheduled', 'critical', 'Laura Singh', 'phone', 6],
      ['Patricia Martinez', 'Plan Review', '2024-03-10', '14:30', 'scheduled', 'low', 'Kevin Patel', 'email', 1],
      ['Christopher Lee', 'Payment Confirmation', '2024-03-06', '09:00', 'completed', 'medium', 'Diana Foster', 'email', 1],
      ['Amanda Clark', 'Settlement Discussion', '2024-03-07', '10:00', 'scheduled', 'high', 'Brian Murphy', 'phone', 3],
      ['Daniel Rodriguez', 'Initial Outreach', '2024-03-05', '12:00', 'scheduled', 'critical', 'Jessica Rivera', 'phone', 1],
      ['Matthew Jackson', 'Follow-up Call', '2024-03-08', '15:30', 'scheduled', 'high', 'Sarah Mitchell', 'phone', 4],
      ['Ashley White', 'Re-engagement', '2024-03-06', '14:00', 'scheduled', 'high', 'Marcus Thompson', 'email', 2],
      ['Elizabeth Thomas', 'Account Closure', '2024-03-09', '10:00', 'scheduled', 'low', 'Rachel Kim', 'email', 1]
    ];

    for (const s of schedules) {
      await client.query(
        `INSERT INTO contact_schedules (debtor_name, contact_type, scheduled_date, scheduled_time, status, priority, agent_name, channel, attempt_number) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        s
      );
    }
    console.log('Contact Schedules seeded: ' + schedules.length);

    // Seed Regulatory Alerts (15 items)
    const regulatoryAlerts = [
      ['CFPB New Debt Collection Rule', 'CFPB Reg F', 'new_rule', 'high', 'New rules on electronic communications and social media contact', '2024-04-01', 'Communication Practices', 'Update all communication templates and procedures', 'action_required'],
      ['State Interest Rate Cap - CA', 'California AB-539', 'amendment', 'medium', 'California caps interest on consumer debt under $10K at 36% APR', '2024-01-01', 'Interest Calculations', 'Audit all California accounts for compliance', 'completed'],
      ['TCPA Update - Autodialers', 'TCPA', 'court_ruling', 'high', 'Supreme Court narrowed definition of autodialer', '2024-03-15', 'Phone Communications', 'Review autodialer usage and consent records', 'in_progress'],
      ['FTC Junk Fee Rule', 'FTC Act', 'new_rule', 'medium', 'Prohibition on hidden junk fees in debt collection', '2024-06-01', 'Fee Structures', 'Review all fee disclosures and structures', 'action_required'],
      ['NY Debt Collection Reform', 'NY Consumer Protection', 'state_law', 'high', 'New York strengthened consumer protections in debt collection', '2024-02-15', 'State Compliance', 'Update NY-specific procedures', 'in_progress'],
      ['FCRA Dispute Handling Update', 'FCRA', 'guidance', 'medium', 'Updated guidance on dispute investigation requirements', '2024-03-01', 'Dispute Resolution', 'Train staff on new dispute procedures', 'action_required'],
      ['Military Lending Act Update', 'MLA/SCRA', 'amendment', 'high', 'Expanded protections for service members', '2024-04-15', 'Special Populations', 'Update military status verification process', 'action_required'],
      ['State Licensing Renewal - TX', 'Texas Finance Code', 'renewal', 'low', 'Annual debt collection license renewal due', '2024-06-30', 'Licensing', 'Submit renewal application', 'pending'],
      ['Data Privacy - CCPA Update', 'CCPA/CPRA', 'amendment', 'high', 'Enhanced data privacy requirements for California consumers', '2024-01-01', 'Data Management', 'Update privacy policies and data handling', 'completed'],
      ['Bankruptcy Notification Rule', 'Bankruptcy Code', 'guidance', 'medium', 'Clarification on automatic stay notification requirements', '2024-02-28', 'Legal Compliance', 'Review bankruptcy monitoring procedures', 'in_progress'],
      ['Electronic Consent Standards', 'ESIGN Act', 'guidance', 'low', 'Updated standards for electronic consent in debt collection', '2024-05-01', 'Digital Operations', 'Audit electronic consent workflows', 'action_required'],
      ['State SOL Changes - FL', 'Florida Statute', 'state_law', 'medium', 'Florida reduced statute of limitations on certain debts', '2024-07-01', 'Account Management', 'Flag affected Florida accounts', 'action_required'],
      ['FCC Robocall Enforcement', 'TCPA/FCC', 'enforcement', 'high', 'Increased FCC enforcement on robocall violations', '2024-01-15', 'Phone Communications', 'Audit all automated calling systems', 'completed'],
      ['Credit Reporting Accuracy Rule', 'FCRA', 'new_rule', 'medium', 'Stricter accuracy requirements for credit reporting', '2024-04-01', 'Credit Reporting', 'Review all credit reporting processes', 'action_required'],
      ['Medical Debt Reporting Changes', 'FCRA/CFPB', 'new_rule', 'high', 'New restrictions on medical debt credit reporting', '2024-03-30', 'Medical Debt', 'Update medical debt reporting procedures', 'in_progress']
    ];

    for (const r of regulatoryAlerts) {
      await client.query(
        `INSERT INTO regulatory_alerts (title, regulation, type, severity, description, effective_date, impact_area, action_required, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        r
      );
    }
    console.log('Regulatory Alerts seeded: ' + regulatoryAlerts.length);

    // Seed Recovery Predictions (15 items)
    const predictions = [
      ['John Smith', 8500.00, 5950.00, 78.50, 'gradient_boost', 'Employment stable, payment history improving', 90, 'Continue structured payments', '2024-05-15'],
      ['Maria Garcia', 12300.50, 4920.20, 45.00, 'neural_network', 'Recent job loss, high DTI ratio', 180, 'Hardship program with settlement option', '2024-08-15'],
      ['Robert Johnson', 5200.00, 3900.00, 82.30, 'random_forest', 'Good prior history, temporary setback', 60, 'Short-term forbearance', '2024-04-20'],
      ['Sarah Williams', 15750.25, 4725.08, 35.50, 'gradient_boost', 'Multiple delinquencies, limited contact', 120, 'Escalated multi-channel outreach', '2024-06-10'],
      ['Michael Brown', 3200.00, 3040.00, 95.00, 'logistic_regression', 'Active plan, consistent payments', 45, 'Maintain current plan', '2024-04-05'],
      ['Jennifer Davis', 22100.00, 6630.00, 28.00, 'neural_network', 'Dispute pending, large balance', 180, 'Resolve dispute first, then settlement', '2024-08-12'],
      ['David Wilson', 9800.75, 5880.45, 55.00, 'random_forest', 'Disputed amount, showing engagement', 120, 'Negotiate post-dispute settlement', '2024-06-15'],
      ['Lisa Anderson', 6700.00, 4690.00, 72.00, 'gradient_boost', 'Responsive, financial recovery underway', 90, 'Modified payment plan', '2024-05-18'],
      ['James Taylor', 18500.00, 5550.00, 38.00, 'neural_network', 'Non-responsive, aging account', 150, 'Legal review if no contact in 30 days', '2024-07-08'],
      ['Patricia Martinez', 4100.50, 3895.48, 92.00, 'logistic_regression', 'Ahead of payment schedule', 30, 'Continue monitoring', '2024-03-30'],
      ['Christopher Lee', 11200.00, 7280.00, 62.00, 'gradient_boost', 'Intermittent payments, engaged', 120, 'Incentivize consistent payments', '2024-06-22'],
      ['Amanda Clark', 7800.25, 5070.16, 65.00, 'random_forest', 'Settlement negotiation in progress', 90, 'Close settlement at 65% discount', '2024-05-16'],
      ['Daniel Rodriguez', 25600.00, 5120.00, 22.00, 'neural_network', 'Large balance, no engagement', 180, 'Pre-legal assessment', '2024-08-14'],
      ['Matthew Jackson', 14200.75, 5680.30, 48.00, 'gradient_boost', 'Broken promises, declining engagement', 120, 'Firm approach with clear deadlines', '2024-06-12'],
      ['Ashley White', 8900.00, 3560.00, 40.00, 'random_forest', 'Delinquent, sporadic contact', 150, 'Final settlement offer at 40%', '2024-07-19'],
      ['Elizabeth Thomas', 3900.00, 3900.00, 99.00, 'logistic_regression', 'Settlement completed', 0, 'Account resolved', '2024-02-08']
    ];

    for (const p of predictions) {
      await client.query(
        `INSERT INTO recovery_predictions (debtor_name, debt_amount, predicted_recovery, confidence_score, prediction_model, factors, time_horizon_days, recommended_strategy, predicted_date) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        p
      );
    }
    console.log('Recovery Predictions seeded: ' + predictions.length);

    console.log('\n✅ All seed data inserted successfully!');
  } catch (err) {
    console.error('Seed error:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
