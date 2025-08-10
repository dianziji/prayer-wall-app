# Supabase OAuth 配置说明

## 问题背景
为了支持生产环境、预览环境(Vercel)和本地开发环境的OAuth登录，需要在Supabase Dashboard中配置所有可能的回调URL。

## 配置步骤

### 1. 登录Supabase Dashboard
访问: https://supabase.com/dashboard
选择项目: `tyyurvugpkmjieoxlvny`

### 2. 配置OAuth重定向URL
导航到: **Authentication** > **URL Configuration**

### 3. 在 "Redirect URLs" 部分添加以下URL:

```
# 生产环境
https://prayer-wall-app.vercel.app/auth/callback

# 本地开发环境  
http://localhost:3000/auth/callback

# 预览环境示例(根据实际预览URL添加)
https://prayer-wall-app-git-feature-prayer-edit-delete-dianzijis-projects.vercel.app/auth/callback
```

### 4. 通配符支持(如果Supabase支持)
如果Supabase支持通配符，可以添加:
```
https://*.vercel.app/auth/callback
```

### 5. Site URL 配置
在 "Site URL" 中设置:
```
https://prayer-wall-app.vercel.app
```

## 注意事项

1. **每次新建预览环境时**，如果URL不匹配已有模式，需要手动添加新的回调URL
2. **安全考虑**：只添加你控制的域名，避免添加过于宽泛的通配符
3. **测试建议**：在每个环境中测试OAuth流程确保配置正确

## 验证配置
配置完成后，在各环境测试Google登录:
- ✅ localhost:3000 - 应该正常登录并留在localhost
- ✅ 预览环境 - 应该正常登录并留在预览域名
- ✅ 生产环境 - 应该正常登录并留在生产域名

## 故障排除
如果仍然出现重定向到错误域名的问题:
1. 检查浏览器开发者工具中的Network标签，查看OAuth请求的实际redirectTo参数
2. 确认Supabase Dashboard中的配置已保存
3. 清除浏览器缓存和cookies
4. 检查代码中是否还有硬编码的URL