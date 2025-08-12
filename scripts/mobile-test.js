/**
 * Mobile UI Quick Validation Script
 * 在浏览器控制台运行此脚本进行快速验证
 */

(function() {
  'use strict';
  
  console.log('🚀 Mobile UI Optimization Validation Starting...\n');
  
  // 1. 检查触摸目标大小
  function checkTouchTargets() {
    console.log('📱 Checking Touch Target Sizes...');
    
    const touchElements = document.querySelectorAll('[class*="touch-manipulation"]');
    let passed = 0;
    let failed = 0;
    
    touchElements.forEach((el, index) => {
      const rect = el.getBoundingClientRect();
      const minSize = 44;
      const id = el.id || el.className.split(' ').slice(0, 2).join(' ') || `Element ${index}`;
      
      if (rect.height >= minSize && rect.width >= minSize) {
        console.log(`✅ ${id}: ${Math.round(rect.width)}x${Math.round(rect.height)}px`);
        passed++;
      } else {
        console.warn(`❌ ${id}: ${Math.round(rect.width)}x${Math.round(rect.height)}px (too small)`);
        failed++;
      }
    });
    
    console.log(`\nTouch Targets: ${passed} passed, ${failed} failed\n`);
    return failed === 0;
  }
  
  // 2. 检查响应式类名
  function checkResponsiveClasses() {
    console.log('📐 Checking Responsive Classes...');
    
    const allElements = document.querySelectorAll('*');
    const responsivePatterns = {
      'sm:': 0,
      'md:': 0,
      'lg:': 0,
      'xl:': 0
    };
    
    let mobileFirstViolations = 0;
    
    allElements.forEach(el => {
      const classes = el.className.toString();
      
      // 计算响应式断点使用
      Object.keys(responsivePatterns).forEach(prefix => {
        const matches = classes.match(new RegExp(`\\b${prefix}`, 'g'));
        if (matches) {
          responsivePatterns[prefix] += matches.length;
        }
      });
      
      // 检查是否有违反移动优先的类名
      if (classes.includes('max-sm:') || classes.includes('max-md:')) {
        mobileFirstViolations++;
        console.warn('⚠️ Non-mobile-first breakpoint detected:', el);
      }
    });
    
    console.log('Responsive class usage:');
    Object.entries(responsivePatterns).forEach(([prefix, count]) => {
      console.log(`  ${prefix} ${count} uses`);
    });
    
    if (mobileFirstViolations === 0) {
      console.log('✅ Mobile-first approach maintained');
    } else {
      console.warn(`❌ ${mobileFirstViolations} mobile-first violations found`);
    }
    
    console.log('');
    return mobileFirstViolations === 0;
  }
  
  // 3. 检查最小宽度适配
  function checkMinWidthAdaptation() {
    console.log('📏 Checking Minimum Width Adaptation (320px)...');
    
    const originalWidth = window.innerWidth;
    
    // 模拟320px宽度
    const testWidth = 320;
    
    // 检查是否有水平滚动条
    const hasHorizontalScroll = document.documentElement.scrollWidth > testWidth;
    
    // 检查固定宽度元素
    const fixedWidthElements = [];
    const allElements = document.querySelectorAll('*');
    
    allElements.forEach(el => {
      const computedStyle = window.getComputedStyle(el);
      const width = parseFloat(computedStyle.width);
      
      if (width > testWidth && !el.className.includes('max-w')) {
        fixedWidthElements.push({
          element: el,
          width: width,
          tagName: el.tagName,
          classes: el.className
        });
      }
    });
    
    if (fixedWidthElements.length === 0) {
      console.log('✅ No problematic fixed-width elements found');
    } else {
      console.warn('❌ Elements potentially too wide for 320px:');
      fixedWidthElements.slice(0, 5).forEach(item => {
        console.warn(`  ${item.tagName}: ${item.width}px`, item.element);
      });
    }
    
    console.log('');
    return fixedWidthElements.length === 0;
  }
  
  // 4. 检查字体大小响应式
  function checkTypographyResponsiveness() {
    console.log('📝 Checking Typography Responsiveness...');
    
    const textElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, div');
    let responsiveTextCount = 0;
    let totalTextElements = 0;
    
    textElements.forEach(el => {
      if (el.textContent && el.textContent.trim().length > 0) {
        totalTextElements++;
        
        const classes = el.className.toString();
        if (classes.includes('text-') && classes.includes('sm:text-')) {
          responsiveTextCount++;
        }
      }
    });
    
    const responsivePercentage = (responsiveTextCount / totalTextElements * 100).toFixed(1);
    
    console.log(`📊 Typography Analysis:`);
    console.log(`  Total text elements: ${totalTextElements}`);
    console.log(`  Responsive typography: ${responsiveTextCount} (${responsivePercentage}%)`);
    
    if (responsivePercentage > 30) {
      console.log('✅ Good typography responsiveness coverage');
    } else {
      console.warn('⚠️ Consider adding more responsive typography');
    }
    
    console.log('');
    return responsivePercentage > 30;
  }
  
  // 5. 检查间距响应式
  function checkSpacingResponsiveness() {
    console.log('📦 Checking Spacing Responsiveness...');
    
    const spacingClasses = [
      'p-', 'px-', 'py-', 'pt-', 'pb-', 'pl-', 'pr-',
      'm-', 'mx-', 'my-', 'mt-', 'mb-', 'ml-', 'mr-',
      'gap-', 'space-x-', 'space-y-'
    ];
    
    let responsiveSpacingCount = 0;
    let totalSpacingCount = 0;
    
    const allElements = document.querySelectorAll('*');
    
    allElements.forEach(el => {
      const classes = el.className.toString();
      
      spacingClasses.forEach(spacing => {
        if (classes.includes(spacing)) {
          totalSpacingCount++;
          
          if (classes.includes(`sm:${spacing}`) || 
              classes.includes(`md:${spacing}`) || 
              classes.includes(`lg:${spacing}`)) {
            responsiveSpacingCount++;
          }
        }
      });
    });
    
    const spacingPercentage = totalSpacingCount > 0 ? 
      (responsiveSpacingCount / totalSpacingCount * 100).toFixed(1) : 0;
    
    console.log(`📊 Spacing Analysis:`);
    console.log(`  Total spacing utilities: ${totalSpacingCount}`);
    console.log(`  Responsive spacing: ${responsiveSpacingCount} (${spacingPercentage}%)`);
    
    if (spacingPercentage > 20) {
      console.log('✅ Good spacing responsiveness coverage');
    } else {
      console.warn('⚠️ Consider adding more responsive spacing');
    }
    
    console.log('');
    return spacingPercentage > 20;
  }
  
  // 6. 生成测试报告
  function generateReport(results) {
    console.log('📋 MOBILE UI OPTIMIZATION VALIDATION REPORT');
    console.log('='.repeat(50));
    
    const testNames = [
      'Touch Target Sizes',
      'Responsive Classes', 
      'Minimum Width Adaptation',
      'Typography Responsiveness',
      'Spacing Responsiveness'
    ];
    
    let passedTests = 0;
    
    results.forEach((passed, index) => {
      const status = passed ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} ${testNames[index]}`);
      if (passed) passedTests++;
    });
    
    console.log('-'.repeat(50));
    console.log(`Overall Score: ${passedTests}/${results.length} tests passed`);
    
    if (passedTests === results.length) {
      console.log('🎉 ALL TESTS PASSED! Mobile optimization looks good.');
    } else if (passedTests >= results.length * 0.8) {
      console.log('✨ MOSTLY GOOD! Minor improvements needed.');
    } else {
      console.log('🔧 NEEDS WORK! Several issues need attention.');
    }
    
    console.log('\n💡 Next Steps:');
    console.log('1. Test on actual mobile devices');
    console.log('2. Verify desktop layout remains unchanged');
    console.log('3. Run automated test suite: npm test');
    console.log('4. Check accessibility with screen readers');
  }
  
  // 运行所有测试
  const results = [
    checkTouchTargets(),
    checkResponsiveClasses(),
    checkMinWidthAdaptation(),
    checkTypographyResponsiveness(),
    checkSpacingResponsiveness()
  ];
  
  generateReport(results);
  
})();

console.log('\n🔧 Usage Instructions:');
console.log('1. Open browser DevTools (F12)');
console.log('2. Switch to mobile device simulation (Ctrl+Shift+M)');
console.log('3. Paste and run this script in Console tab');
console.log('4. Test different screen sizes (320px, 375px, 414px)');
console.log('5. Compare results across different viewports');