// VIRAL WAR Demo Mode Script
// Simulates full workflow without real social accounts or payment processors

// eslint-disable-line @typescript-eslint/no-require-imports
const { Pool } = require("pg");
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function demo() {
  const client = await pool.connect();
  
  try {
    await client.query("BEGIN");
    
    console.log("=" .repeat(60));
    console.log("VIRAL WAR - DEMO MODE");
    console.log("=" .repeat(60));
    console.log("\nSimulating full product loop without real social accounts");
    console.log("or payment processors.\n");
    
    // Step 1: Create Brands
    console.log("Step 1: Brands create organizations/campaigns");
    const brand1 = await client.query(`
      INSERT INTO "brand" (id, name, slug, description, website, verificationStatus)
      VALUES ('demo-brand-1', 'Nike', 'nike', 'Athletic footwear and apparel', 'https://www.nike.com', true)
      RETURNING *
    `);
    console.log(`  ✓ Brand created: ${brand1.rows[0].name}`);
    
    const brand2 = await client.query(`
      INSERT INTO "brand" (id, name, slug, description, website, verificationStatus)
      VALUES ('demo-brand-2', 'Apple', 'apple', 'Technology and consumer electronics', 'https://www.apple.com', true)
      RETURNING *
    `);
    console.log(`  ✓ Brand created: ${brand2.rows[0].name}`);
    
    // Step 2: Create Campaigns
    console.log("\nStep 2: Brands create campaigns");
    const campaign1 = await client.query(`
      INSERT INTO "campaign" ("id", "brandId", "title", "slug", "description", "product", "objective", "status", "startAt", "endAt", "budget", "prizePool", "currency", "platforms", "rules", "eligibility")
      VALUES ('demo-camp-1', 'demo-brand-1', 'Nike Air Max Challenge', 'nike-air-max',
        'Show us your best sneaker style with Nike Air Max',
        'Nike Air Max Shoes', 'Increase brand engagement', 'ACTIVE',
        NOW(), NOW() + interval '30 days', 100000, 500000, 'INR', ['instagram', 'tiktok'],
        '{"entryRequirements": ["original content", "use hashtag #nikeairmax"]}',
        '{"minFollowers": 1000}')
      RETURNING *
    `);
    console.log(`  ✓ Campaign created: ${campaign1.rows[0].title} (Prize: $${campaign1.rows[0].prizePool})`);
    
    // Step 3: Create Creators
    console.log("\nStep 3: Creators signup & profile setup");
    const creator1 = await client.query(`
      INSERT INTO "user" (id, email, password, role, status)
      VALUES ('demo-creator-1', 'creator1@demo.com', '\$2b\$12$DUMMYHASH', 'CREATOR', 'ACTIVE')
      RETURNING *
    `);
    await client.query(`
      INSERT INTO "creator_profile" (id, userId, username, displayName, categories, languages, location, followerCount, verifiedStatus, reputationScore)
      VALUES ('demo-prof-1', 'demo-creator-1', 'sneakerpro', 'Sneaker Pro', '["sneakers"]', '["en"]', "Los Angeles", 15000, true, 85)
    `);
    console.log(`  ✓ Creator signed up: ${creator1.rows[0].email} (@${creator1.rows[0].username})`);
    
    // Step 4: Creator joins campaign
    console.log("\nStep 4: Creator joins campaign");
    await client.query(`
      INSERT INTO "campaign_participant" ("id", "campaignId", "creatorId", status)
      VALUES ('p1', 'demo-camp-1', 'demo-creator-1', 'ACTIVE')
    `);
    console.log(`  ✓ Creator joined campaign`);
    
    // Step 5: Submit content
    console.log("\nStep 5: Creator submits content");
    const now = new Date();
    await client.query(`
      INSERT INTO "submission" ("id", "campaignId", "creatorId", "platform", "contentUrl", "caption", "status", "moderationStatus")
      VALUES ('demo-sub-1', 'demo-camp-1', 'demo-creator-1', 'instagram',
        'https://www.instagram.com/p/demo1', "Check out these Nike Air Max!", 'APPROVED', 'APPROVED')
    `);
    await client.query(`
      INSERT INTO "content_metric_snapshot" ("id", "submissionId", "capturedAt", "views", "likes", "comments", "shares", "saves", "watchTime", "clicks", "conversions", "revenue")
      VALUES ('demo-meta-1', 'demo-sub-1', NOW(), 250000, 25000, 1000, 2000, 500, 300000.0, 2000, 100, 125.50)
    `);
    console.log("  ✓ Content submitted with metrics (250K views, 25K likes)");
    
    // Step 6: AI Analysis
    console.log("\nStep 6: AI Creative Intelligence analysis");
    await client.query(`
      INSERT INTO "ai_insight" ("id", "campaignId", "insightType", "summary", "confidence", "evidence")
      VALUES ('demo-ai-1', 'demo-camp-1', 'hook_pattern',
        '17 of the top 25 submissions introduce the product within the first 3 seconds.',
        0.87, '{"topPerformersWithEarlyHook": 17, "totalTop25": 25, "retentionEarly": 68, "retentionLate": 41}')
    `);
    await client.query(`
      INSERT INTO "ai_insight" ("id", "campaignId", "insightType", "summary", "confidence", "evidence")
      VALUES ('demo-ai-2', 'demo-camp-1', 'format_analysis',
        'Vertical videos outperform horizontal by 35%.',
        0.82, '{"formatWins": "vertical", "performanceGap": "35%"}')
    `);
    console.log("  ✓ AI insights generated (hook patterns, format analysis)");
    
    // Step 7: Fraud Detection
    console.log("\nStep 7: Fraud signal detection");
    await client.query(`
      INSERT INTO "fraud_signal" ("id", "creatorId", "submissionId", "campaignId", "signalType", "severity", "evidence", "status")
      VALUES ('demo-fraud-1', 'demo-creator-1', 'demo-sub-1', 'demo-camp-1',
        'suspicious_engagement_ratio', 0.3, '{"views": 250000, "likes": 25000, "engagementRate": 0.10}', 'CLEAR')
    `);
    console.log("  ✓ Fraud signals reviewed (none confirmed - all CLEAR)");
    
    // Step 8: Reward Calculation
    console.log("\nStep 8: Reward calculation");
    await client.query(`
      INSERT INTO "reward" ("id", "campaignId", "creatorId", "amount", "currency", "reason", "status")
      VALUES ('demo-reward-1', 'demo-camp-1', 'demo-creator-1', 50000, 'INR', 'Performance-based reward', 'CALCULATING')
    `);
    await client.query(`
      INSERT INTO "payout" ("id", "rewardId", "provider", "providerReference", "status", "amount", "currency")
      VALUES ('demo-payout-1', 'demo-reward-1', 'MOCK', 'DEMO-REF-001', 'COMPLETED', 50000, 'INR')
    `);
    await client.query(`
      UPDATE "reward" SET "status" = 'PAID', "paidAt" = NOW() WHERE "id" = 'demo-reward-1'
    `);
    console.log("  ✓ Reward calculated (₹50,000) and creator paid");
    
    await client.query("COMMIT");
    
    console.log("\n" + "=".repeat(60));
    console.log("DEMO COMPLETE - Full product loop demonstrated");
    console.log("=".repeat(60));
    console.log("\nWorkflow: Brand → Campaign → Creator → Submission");
    console.log("         → AI Insight → Fraud Check → Reward → Payout");
    console.log("\nAll simulated data - no real social/api/payment accounts required.\n");
    
    process.exit(0);
    
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Demo mode error:", error);
    process.exit(1);
  } finally {
    client.release();
  }
}

demo();
