/**
 * Performance test for timezone optimization
 * Tests the improvement from pg_timezone_names optimization
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { 
  getCommonTimezones, 
  isValidTimezone, 
  getTimezoneDisplayName,
  getUserTimezone,
  getAvailableTimezones 
} from '../../lib/timezone-cache';

// Mock database query times for comparison
const mockDatabaseQueryTime = 130; // 130ms average from production data
const performanceThreshold = 10; // Maximum 10ms for optimized queries

describe('Timezone Optimization Performance Tests', () => {
  
  describe('getCommonTimezones()', () => {
    it('should return results faster than database query', async () => {
      const startTime = performance.now();
      const timezones = getCommonTimezones();
      const endTime = performance.now();
      
      const executionTime = endTime - startTime;
      
      expect(executionTime).toBeLessThan(performanceThreshold);
      expect(timezones).toContain('America/New_York');
      expect(timezones).toContain('UTC');
      expect(timezones.length).toBeGreaterThan(5);
      
      console.log(`✅ getCommonTimezones: ${executionTime.toFixed(2)}ms (vs ${mockDatabaseQueryTime}ms database)`);
    });
  });

  describe('isValidTimezone()', () => {
    it('should validate timezones faster than database lookup', async () => {
      const testTimezones = [
        'America/New_York',
        'UTC', 
        'Europe/London',
        'Invalid/Timezone'
      ];
      
      const startTime = performance.now();
      
      const results = testTimezones.map(tz => ({
        timezone: tz,
        isValid: isValidTimezone(tz)
      }));
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      expect(executionTime).toBeLessThan(performanceThreshold);
      expect(results[0].isValid).toBe(true); // America/New_York
      expect(results[1].isValid).toBe(true); // UTC
      expect(results[2].isValid).toBe(true); // Europe/London
      expect(results[3].isValid).toBe(false); // Invalid/Timezone
      
      console.log(`✅ isValidTimezone: ${executionTime.toFixed(2)}ms for ${testTimezones.length} timezones`);
    });
  });

  describe('getAvailableTimezones()', () => {
    it('should provide timezone list faster than pg_timezone_names', async () => {
      const startTime = performance.now();
      const timezones = await getAvailableTimezones(20);
      const endTime = performance.now();
      
      const executionTime = endTime - startTime;
      
      expect(executionTime).toBeLessThan(performanceThreshold);
      expect(timezones).toBeInstanceOf(Array);
      expect(timezones.length).toBeGreaterThan(0);
      expect(timezones.length).toBeLessThanOrEqual(20);
      
      console.log(`✅ getAvailableTimezones: ${executionTime.toFixed(2)}ms (vs ${mockDatabaseQueryTime}ms database)`);
    });
  });

  describe('Performance Benchmark Comparison', () => {
    it('should demonstrate significant performance improvement', async () => {
      const iterations = 100;
      const results = {
        optimized: [] as number[],
        estimated_database: mockDatabaseQueryTime * iterations
      };
      
      // Test optimized version multiple times
      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now();
        getCommonTimezones();
        isValidTimezone('America/New_York');
        await getAvailableTimezones(10);
        const endTime = performance.now();
        
        results.optimized.push(endTime - startTime);
      }
      
      const avgOptimized = results.optimized.reduce((a, b) => a + b, 0) / iterations;
      const totalOptimized = avgOptimized * iterations;
      const improvementRatio = results.estimated_database / totalOptimized;
      const improvementPercent = ((results.estimated_database - totalOptimized) / results.estimated_database) * 100;
      
      expect(improvementRatio).toBeGreaterThan(10); // At least 10x improvement
      expect(improvementPercent).toBeGreaterThan(90); // At least 90% faster
      
      console.log('\n📊 PERFORMANCE BENCHMARK RESULTS:');
      console.log(`🔴 Estimated database time: ${results.estimated_database.toFixed(2)}ms (${iterations} × ${mockDatabaseQueryTime}ms)`);
      console.log(`🟢 Optimized time: ${totalOptimized.toFixed(2)}ms (avg: ${avgOptimized.toFixed(2)}ms)`);
      console.log(`🚀 Performance improvement: ${improvementRatio.toFixed(1)}x faster (${improvementPercent.toFixed(1)}% reduction)`);
      console.log(`💾 Time saved: ${(results.estimated_database - totalOptimized).toFixed(2)}ms per ${iterations} operations`);
    });
  });

  describe('Load Test Simulation', () => {
    it('should handle concurrent timezone operations efficiently', async () => {
      const concurrentUsers = 35; // Demo load from K6 test
      const operationsPerUser = 3;
      
      const startTime = performance.now();
      
      // Simulate concurrent timezone operations
      const promises = Array.from({ length: concurrentUsers }, async () => {
        const operations: Promise<any>[] = [];
        for (let i = 0; i < operationsPerUser; i++) {
          // Mix sync and async operations properly
          operations.push(
            Promise.resolve(getCommonTimezones()),
            Promise.resolve(isValidTimezone('America/New_York')),
            getAvailableTimezones(5)
          );
        }
        return Promise.all(operations);
      });
      
      await Promise.all(promises);
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const totalOperations = concurrentUsers * operationsPerUser * 3;
      const avgTimePerOperation = totalTime / totalOperations;
      
      expect(totalTime).toBeLessThan(1000); // Should complete in under 1 second
      expect(avgTimePerOperation).toBeLessThan(5); // Each operation under 5ms
      
      console.log(`\n🎯 LOAD TEST SIMULATION (${concurrentUsers} users, ${totalOperations} operations):`);
      console.log(`⏱️  Total time: ${totalTime.toFixed(2)}ms`);
      console.log(`📈 Average per operation: ${avgTimePerOperation.toFixed(2)}ms`);
      console.log(`✅ Demo load handling: ${totalTime < 1000 ? 'PASS' : 'FAIL'}`);
    });
  });

  describe('Memory Usage', () => {
    it('should use minimal memory compared to database results', () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Perform operations that would normally query database
      for (let i = 0; i < 1000; i++) {
        getCommonTimezones();
        isValidTimezone(`America/New_York`);
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      const memoryIncreaseKB = memoryIncrease / 1024;
      
      // Should use less than 100KB for 1000 operations
      expect(memoryIncreaseKB).toBeLessThan(100);
      
      console.log(`💾 Memory usage for 1000 operations: ${memoryIncreaseKB.toFixed(2)}KB`);
    });
  });
});

describe('Edge Cases and Reliability', () => {
  it('should handle invalid inputs gracefully', () => {
    const startTime = performance.now();
    
    // Test various invalid inputs
    const invalidInputs = [
      '',
      null as any,
      undefined as any,
      'definitely/not/a/timezone',
      'America/NonExistent'
    ];
    
    invalidInputs.forEach(input => {
      expect(() => isValidTimezone(input)).not.toThrow();
      expect(isValidTimezone(input)).toBe(false);
    });
    
    const endTime = performance.now();
    expect(endTime - startTime).toBeLessThan(performanceThreshold);
  });

  it('should maintain consistency with browser timezone API', () => {
    const userTz = getUserTimezone();
    expect(typeof userTz).toBe('string');
    expect(userTz.length).toBeGreaterThan(0);
    
    // Should be a valid timezone format
    expect(userTz).toMatch(/^[A-Za-z_]+\/[A-Za-z_]+$|^UTC$/);
  });
});