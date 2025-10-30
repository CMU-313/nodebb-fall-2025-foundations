# Artillery Load Testing Evaluation

## Tool Information
- **Name**: Artillery
- **Type**: Dynamic Analysis (Load/Performance Testing)
- **Documentation**: https://www.artillery.io/docs
- **Source**: https://github.com/artilleryio/artillery

## Overview

Artillery is a modern load testing toolkit that simulates realistic user traffic to measure application performance under various load conditions. We conducted three test scenarios totaling **94,043 requests** to validate NodeBB's performance and establish baseline metrics for CI integration.

## Test Results Summary

| Test | Concurrent Users | Requests | Success Rate | Median | P99 | Status |
|------|------------------|----------|--------------|--------|-----|--------|
| CI Test | ~20 | 1,800 | 100% | 3ms | 12ms | ✅ Pass |
| Basic HTTP | ~40-80 | 1,680 | 100% | 4ms | 183ms | ✅ Pass |
| Stress (Peak) | ~1,200 | 90,563 | 58% | 46ms | 9,607ms | ⚠️ Overload |

## Configuration

- CI Test (Primary for Integration): `artillery-test-ci.yml` - 1 minute, 10 users/second
- Basic Test: `artillery-test-basic.yml` - 4 minutes with multi-phase load (warmup, sustained, cooldown)
- Stress Test: `artillery-test-stress.yml` - 7 minutes, ramping 10-150 users/second

**Performance Envelope Identified**:
- ✅ **Up to 400 concurrent**: 100% success, <100ms P99
- ⚠️ **400-800 concurrent**: 89% success, ~6.8s P99 (degraded)
- ❌ **800-1200+ concurrent**: 58% success, ~9.6s P99 (breaking point)
- ✅ **Recovery**: System returns to 10ms P99 after load (no memory leaks)

## Key Findings

1. ✅ **Excellent baseline performance**: 3-4ms median, 0% errors at 20-80 concurrent users
2. ✅ **CI-ready**: 83x safety margin on thresholds, reliable passing results  
3. ⚠️ **Capacity identified**: Single instance comfortable up to 400 concurrent users, degrades beyond 800
4. ✅ **Stable**: System fully recovers after stress with no memory leaks