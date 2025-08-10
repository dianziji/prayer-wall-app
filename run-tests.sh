#!/bin/bash

# Prayer Wall App - Test Runner Script
# Usage: ./run-tests.sh [basic|all|coverage]

set -e

echo "🧪 Prayer Wall App Test Suite"
echo "=============================="

case "${1:-basic}" in
  "basic")
    echo "Running basic functionality tests..."
    npm test tests/basic.test.ts
    npm test tests/utils/time-utils.test.ts
    ;;
  
  "all")
    echo "Running all tests..."
    npm test
    ;;
    
  "coverage")
    echo "Running tests with coverage report..."
    npm run test:coverage
    ;;
    
  "watch")
    echo "Running tests in watch mode..."
    npm run test:watch
    ;;
    
  *)
    echo "Usage: $0 [basic|all|coverage|watch]"
    echo ""
    echo "Commands:"
    echo "  basic    - Run basic utility and validation tests"
    echo "  all      - Run complete test suite"
    echo "  coverage - Generate coverage report"
    echo "  watch    - Run tests in watch mode"
    exit 1
    ;;
esac

echo ""
echo "✅ Test run completed!"
echo ""
echo "📋 Next steps:"
echo "1. Run RLS migration: supabase-migrations-prayers-rls-edit-delete.sql"
echo "2. Follow manual testing guide: TESTING_GUIDE.md"  
echo "3. Test edit/delete functionality with real user sessions"