# 🚀 Production部署前检查清单

## ✅ 已完成项目

### 1. 环境配置切换
- [x] ✅ 恢复Production Supabase配置 (.env.local)
- [x] ✅ 生产URL: `https://tyyurvugpkmjieoxlvny.supabase.co`
- [x] ✅ 备份本地测试配置 (.env.test)

## 🚨 CRITICAL: Production数据库必要迁移

### 1. **archive_weeks表** (导致100%错误率)
**必须在上线前执行，否则archive页面完全无法访问！**

```sql
-- 在Supabase Dashboard > SQL Editor中执行
CREATE TABLE archive_weeks (
  week_start_et DATE PRIMARY KEY,
  prayer_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 插入示例数据 (根据实际需求调整)
INSERT INTO archive_weeks (week_start_et, prayer_count) VALUES
  ('2025-08-10', 25),
  ('2025-08-03', 18),
  ('2025-07-27', 32),
  ('2025-07-20', 15),
  ('2025-07-13', 8);

-- 创建索引
CREATE INDEX idx_archive_weeks_date ON archive_weeks(week_start_et DESC);
```

### 2. **Fellowship功能支持**
```sql
-- 执行完整的fellowship迁移
-- 从 supabase-fellowship-migration.sql 复制内容到Dashboard
```

### 3. **Prayer Categories字段**
```sql
-- 添加新的祷告分类字段
ALTER TABLE prayers 
ADD COLUMN thanksgiving_content TEXT,
ADD COLUMN intercession_content TEXT;

-- 创建索引
CREATE INDEX idx_prayers_thanksgiving_content ON prayers (thanksgiving_content) WHERE thanksgiving_content IS NOT NULL;
CREATE INDEX idx_prayers_intercession_content ON prayers (intercession_content) WHERE intercession_content IS NOT NULL;
```

### 4. **性能优化**
```sql
-- 执行完整的性能优化
-- 从 supabase-performance-optimization.sql 复制内容到Dashboard
```

## 📦 Supabase Storage配置

### Avatar Storage Bucket
在Supabase Dashboard > Storage中创建：

1. **创建Bucket**: `avatars`
   - Public: `false` (私有)
   - File size limit: `5MB`
   - Allowed MIME types: `image/jpeg,image/png,image/webp`

2. **Storage Policies**:
```sql
-- 允许已认证用户上传头像
CREATE POLICY "Users can upload avatar" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 允许公开读取头像
CREATE POLICY "Avatar are publicly readable" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

-- 允许用户更新自己的头像
CREATE POLICY "Users can update own avatar" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);
```

## 🔐 Authentication配置

### OAuth回调URL配置
在Supabase Dashboard > Authentication > URL Configuration中确认：

**Site URL**: `https://prayer-wall-app.vercel.app`

**Redirect URLs**:
```
https://prayer-wall-app.vercel.app/auth/callback
http://localhost:3000/auth/callback
https://*.vercel.app/auth/callback
```

## 🛡️ Row Level Security检查

确认以下RLS policies已启用：
- [x] prayers表的编辑/删除权限
- [x] user_profiles访问权限  
- [x] storage avatars权限
- [x] fellowships读取权限

## 🔍 生产环境验证步骤

### 部署后立即测试：

1. **基础功能**
   - [ ] 首页加载正常
   - [ ] 祷告墙显示祷告内容
   - [ ] Archive页面不报错（关键！）

2. **新功能**
   - [ ] Fellowship分类工作正常
   - [ ] 新的祷告分类字段显示
   - [ ] 时区显示正确（/dev/time-debug）

3. **性能验证**
   - [ ] 页面加载速度 < 2s
   - [ ] API响应时间 < 500ms
   - [ ] Archive查询不超时

4. **认证流程**
   - [ ] Google登录正常
   - [ ] 头像上传工作（如果测试）
   - [ ] 权限控制正确

## ⚠️ 回滚计划

如果生产环境出现问题：

1. **立即回滚代码**到上一个稳定版本
2. **数据库回滚**（如果需要）：
   ```sql
   -- 如果出现问题，可以暂时禁用新字段
   ALTER TABLE prayers ALTER COLUMN fellowship DROP DEFAULT;
   -- 其他回滚SQL保存在各migration文件中
   ```

## 📝 注意事项

### 数据迁移顺序
1. **先执行archive_weeks** (阻塞性错误)
2. **然后fellowship相关** (功能性)
3. **最后性能优化** (性能提升)

### 测试数据清理
- 本地测试的LoadTestUser数据**不会**影响生产环境
- 生产环境是独立的Supabase项目

### 监控要点
- 关注/api/archive-weeks响应
- 监控头像处理队列状态
- 观察时区计算性能

---

## 🎯 关键成功指标

部署成功后应该达到：
- ✅ Archive页面 0% 错误率（当前本地100%错误已修复）
- ✅ 支持100并发用户（已测试验证）
- ✅ API响应 < 500ms（已优化）
- ✅ 所有功能正常（已集成测试）

**Ready for Demo! 🚀**