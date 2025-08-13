# GitHub Actions CI/CD Configuration

## Workflow Files

### `ci.yml` - Comprehensive CI/CD Pipeline
- **Matrix testing**: Runs unit, API, component, and E2E tests in parallel
- **Multi-job setup**: Separate jobs for testing, linting, security, and building
- **Coverage reporting**: Uploads test coverage to Codecov
- **Artifact collection**: Stores test results and build files
- **Security auditing**: Checks for vulnerabilities
- **Summary reporting**: Generates detailed test summaries

**Triggers**: Push to main/develop/feature branches, PRs to main/develop

### `simple-test.yml` - Basic Test Runner
- **Lightweight**: Single job running all tests
- **Fast feedback**: Quick validation for simple changes
- **Coverage upload**: Basic coverage reporting

**Triggers**: Same as comprehensive pipeline

## Environment Variables Required

For local testing and CI:
```env
NEXT_PUBLIC_SUPABASE_URL=mock://localhost
NEXT_PUBLIC_SUPABASE_ANON_KEY=mock_key
```

## Usage

### Automatic Triggers
Both workflows run automatically on:
- Push to `main`, `develop`, or any `feature/*` branch
- Pull requests targeting `main` or `develop`

### Manual Triggers
You can manually trigger workflows from GitHub Actions tab:
1. Go to repository → Actions tab
2. Select workflow
3. Click "Run workflow"

### Viewing Results
- **Test results**: Check Actions tab for detailed logs
- **Coverage reports**: View uploaded coverage on Codecov
- **Artifacts**: Download test results, build files from completed runs

## Workflow Configuration

### Node.js Version
Both workflows use Node.js 18 with npm caching for faster builds.

### Test Execution
- **Parallel execution**: `--maxWorkers=2` for CI efficiency
- **Coverage collection**: Generates lcov.info for coverage reporting
- **Silent mode**: Reduces log noise with `--passWithNoTests`

### Security Features
- **Dependency audit**: Checks for known vulnerabilities
- **Code scanning**: TypeScript compilation checks
- **Lint validation**: ESLint rules enforcement

## Customization

### Adding New Test Categories
To add new test types to the matrix in `ci.yml`:

```yaml
strategy:
  matrix:
    test-type: [unit, api, components, e2e, integration, mobile]
```

### Environment Specific Configuration
Add branch-specific behavior:

```yaml
- name: Deploy to staging
  if: github.ref == 'refs/heads/develop'
  run: echo "Deploy to staging"
  
- name: Deploy to production
  if: github.ref == 'refs/heads/main'
  run: echo "Deploy to production"
```

### Coverage Thresholds
Modify Jest configuration to enforce coverage minimums:

```yaml
- name: Check coverage thresholds
  run: |
    npm test -- --coverage --coverageThreshold='{"global":{"branches":80,"functions":80,"lines":80,"statements":80}}'
```

## Troubleshooting

### Common Issues

**Tests failing in CI but passing locally:**
- Check environment variables
- Verify Node.js version consistency
- Review CI-specific test configurations

**E2E tests timeout:**
- Increase Playwright timeout settings
- Use `--workers=1` for E2E tests in CI

**Coverage upload failures:**
- Ensure `lcov.info` file is generated
- Check Codecov token configuration
- Use `fail_ci_if_error: false` for non-blocking uploads

### Debugging Steps

1. **Check workflow logs**: Actions tab → Select run → View logs
2. **Download artifacts**: Test results and coverage files
3. **Local reproduction**: Run same commands locally
4. **Environment check**: Verify all required environment variables

## Best Practices

1. **Keep workflows fast**: Use caching, parallel execution
2. **Fail fast**: Put quick checks (lint, typecheck) first
3. **Meaningful names**: Clear job and step names
4. **Artifact retention**: Balance storage costs with debugging needs
5. **Security conscious**: Use specific action versions, audit regularly