# Artillery Load Testing Evaluation

## Tool Information
- **Tool Name**: Artillery
- **Type**: Dynamic Analysis - Load/Performance Testing
- **Version**: Check with `npm list artillery`
- **Documentation**: https://www.artillery.io/docs

## Installation

```bash
npm install --save-dev artillery
```

Added to `package.json` as a dev dependency and created two npm scripts:
- `npm run artillery:basic` - runs the 4-minute HTTP test
- `npm run artillery:api` - runs the 1-minute API test

## Test Setup

Created two test configurations:

**Basic HTTP Test** (`artillery-test-basic.yml`)
- Tests forum pages: home, recent, popular, tags, users
- 4 minutes total with 3 phases (warm-up, sustained load, cool-down)
- Simulates real users with 1-3 second "think time" between requests
- Load: 5-10 users per second

**API Test** (`artillery-test-api.yml`)
- Tests 6 API endpoints
- 1 minute, rapid-fire (no think time)
- Load: 15 requests per second

## Test Results

Ran both tests on October 23, 2025:

### Basic HTTP Test
- 1,680 requests, all succeeded (100% HTTP 200)
- Response times: median 4ms, p95 21.1ms, p99 183.1ms
- Downloaded 51 MB of data
- Note: Got some "capture match" errors but those are config issues, not actual failures

### API Test  
- 5,400 requests, all succeeded (100% HTTP 200)
- Response times: median 1ms, p95 6ms, p99 57.4ms
- Downloaded 34 MB of data
- Much faster than the HTTP test - makes sense since APIs return JSON not full HTML

The test results show NodeBB performs well under moderate load. All requests succeeded and response times were fast (median 1-4ms). This gives us a good baseline to compare against in the future.

## Files Generated

**Configuration:**
- `artillery-test-basic.yml` - Basic test config
- `artillery-test-api.yml` - API test config

**Results:**
- `artillery-output-basic.txt` (51 KB) - Terminal output from basic test
- `artillery-output-api.txt` (20 KB) - Terminal output from API test
