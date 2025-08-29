// Phase 1.1 Basic Internationalization System

export type Locale = 'zh-CN' | 'en'

export const SUPPORTED_LOCALES: Locale[] = ['zh-CN', 'en']

export const DEFAULT_LOCALE: Locale = 'zh-CN'

// Basic translation strings for Phase 1
export const translations = {
  'zh-CN': {
    // Common actions
    'submit': '提交',
    'cancel': '取消',
    'save': '保存',
    'edit': '编辑',
    'delete': '删除',
    'confirm': '确认',
    'loading': '加载中...',
    
    // Prayer form
    'author_name': '您的姓名',
    'author_name_placeholder': '请输入您的姓名',
    'fellowship': '团契',
    'fellowship_select': '选择团契',
    'thanksgiving_content': '感恩祷告',
    'thanksgiving_placeholder': '感谢神的恩典，分享你心中的感恩...',
    'thanksgiving': '感恩',
    'intercession_content': '代祷请求',
    'intercession_placeholder': '为他人代祷，分享你的祈求...',
    'intercession': '代祷',
    'submit_prayer': '提交祷告',
    'share_prayer': '分享祷告',
    'edit_prayer': '编辑祷告',
    'update_prayer': '更新祷告',
    'post_prayer': '发布祷告',
    'updating': '更新中...',
    'posting': '发布中...',
    'total_chars': '总字数',
    'chars': '字',
    'exceeded_limit': '超出限制',
    
    // Prayer wall
    'prayer_wall': '祷告墙',
    'this_week': '本周',
    'current_week': '当前周',
    'read_only': '只读模式',
    'no_prayers': '暂无祷告',
    'no_prayers_message': '这个星期还没有祷告，成为第一位分享的人吧。',
    'week_theme': '本周主题',
    'loading_error': '加载祷告失败',
    
    // User interactions
    'like': '点赞',
    'comment': '评论',
    'share': '分享',
    'prayer_count': '祷告数量',
    'participant_count': '参与人数',
    'login_required': '请先登录才能评论',
    'private_to_me': '仅自己可见',
    'post': '发布',
    'confirm_delete_comment': '确定要删除这条评论吗？',
    'loading_comments_failed': '加载评论失败',
    'current_selection': '当前选择',
    'share_gratitude': '分享感谢和赞美',
    'prayer_requests': '为他人或事情祈求',
    'name_too_long': '名字不能超过',
    'characters': '个字符',
    'submit_failed': '提交失败',
    'collapse': '收起',
    
    // Search and Filter
    'search_placeholder': '搜索祷告内容...',
    'filters': '筛选',
    'clear': '清除',
    'all': '全部',
    'prayer_type': '祷告类型',
    'both_types': '两种类型',
    'date_range': '日期范围',
    'this_month': '本月',
    
    // Validation messages
    'name_required': '请输入您的姓名',
    'content_required': '至少需要填写感恩祷告或代祷请求中的一项',
    'content_too_long': '总字数不能超过500字符',
    'invalid_content': '内容可能包含不当词汇，请修改后重新提交',
    'confirm_delete_prayer': '确定要删除这个祷告吗？',
    'delete_failed': '删除失败',
    
    // Navigation and Auth
    'login': '登录',
    'logout': '退出登录',
    'profile': '个人资料',
    'my_prayers': '我的祷告',
    'archive': '历史档案',
    'explore_past_prayers': '探索过往周的祷告和社区支持',
    'no_archive_weeks': '暂无历史周墙（还没有过往祷告）。',
    'archive_note': '仅显示过往的周；当前周不会出现在这里。',
    'week_of': '周',
    'welcome_to_prayer_wall': '欢迎来到祷告墙',
    'join_community': '加入我们的祷告和支持社区',
    'continue_with_google': '使用 Google 继续',
    'invalid_email': '邮箱格式不正确',
    'email_domain_error': '该邮箱域名不存在或无法接收邮件',
    'login_error': '登录错误',
    'magic_link_sent': 'Magic link 已发送，请查收邮件并返回本站',
    'track_prayer_journey': '追踪你的祷告历程和属灵成长',
    'prayer_reminders': '祷告提醒',
    
    // Account settings
    'language_preference': '语言偏好',
    'language_preference_note': '选择界面语言。',
    
    // Admin
    'admin_panel': '管理面板',
    'admin_description': '管理祷告墙主题和组织设置',
    'theme_settings': '主题设置',
    'user_management': '用户管理',
    'statistics': '统计数据',
    'insufficient_permissions': '权限不足',
    'export_prayers': '导出祷告',
    'export_format': '导出格式',
    'date_from': '开始日期',
    'date_to': '结束日期',
    'exporting': '导出中...',
    
    // QR Code
    'qr_code_title': '祷告墙二维码',
    'qr_code_description': '分享此二维码邀请他人加入我们的祷告社区',
    'qr_code_note': '提示：可将此页加入书签或打印张贴。二维码始终指向主页，用户扫描后会自动跳转到当周页面。',
    
    // Individual Prayer Page
    'prayer_not_found': '祷告未找到',
    'invalid_prayer_data': '无效的祷告数据',
    'shared_prayer': '分享的祷告',
    'shared_prayer_description': '来自祷告墙社区的祷告分享',
    'anonymous': '匿名',
    'likes': '赞',
    'prayer_id': '祷告ID',
    'join_prayer_community': '加入我们的祷告社区',
    'share_connect_prayers': '分享你的祷告，与他人在信仰和希望中连接。',
    'visit_prayer_wall': '访问祷告墙',
    'prayer_shared_from': '此祷告分享自',
    'community_space_description': '信仰与希望的社区空间',
    'prayer_removed_message': '此祷告可能已被移除或链接无效。',
    
    // Statistics
    'total_prayers': '总祷告数',
    'total_likes': '总点赞数',
    'total_comments': '总评论数',
    'try_again': '重试',
    
    // Prayer Edit Modal
    'edit_prayer_description': '修改你的祷告。你只能编辑本周的祷告。',
    'edit_current_week_only': '你只能编辑本周的祷告。',
    'update_failed': '更新失败',
    
    // Prayer Analytics
    'prayer_analytics': '祷告分析',
    'all_time': '全部时间',
    'last_year': '过去一年',
    'last_6_months': '过去6个月',
    'unknown_error': '未知错误',
    'prayer_frequency': '祷告频率',
    'daily_average': '日均',
    'weekly_average': '周均',
    'monthly_average': '月均',
    'prayer_patterns': '祷告模式',
    'current_streak': '当前连续',
    'longest_streak': '最长连续',
    'total_active': '总活跃',
    'days': '天',
    'preferred_time': '偏好时间',
    'engagement_insights': '互动洞察',
    'average_likes': '平均点赞',
    'average_comments': '平均评论',
    'average_words': '平均字数',
    'longest_prayer': '最长祷告',
    'words': '字',
    'most_liked_prayer': '最受欢迎的祷告',
    'most_discussed_prayer': '讨论最多的祷告',
    'comments': '评论',
    'fellowship_participation': '团契参与',
    'prayer_distribution_by_fellowship': '各团契祷告分布',
    'prayer_content_types': '祷告内容类型',
    'mixed_prayer': '综合祷告',
    'most_active_fellowship': '最活跃团契',
    'most_active_in': '你在',
    'monthly_activity': '月度活动',
    'no_analytics_data': '暂无分析数据',
    'start_sharing_for_analytics': '开始分享祷告以查看你的分析数据',
    
    // Timeline related
    'my_prayer_timeline': '我的祷告时间线',
    'export': '导出',
    'refresh': '刷新',
    'search_prayers': '搜索祷告...',
    'sort': '排序',
    'time': '时间',
    'most_recent': '最近的',
    'most_liked': '最多点赞',
    'most_commented': '最多评论',
    'last_3_months': '过去3个月',
    'loading_ellipsis': '加载中...',
    'load_more': '加载更多',
    'no_prayers_found': '没有找到祷告',
    'no_prayers_yet': '还没有祷告',
    'no_prayers_matching': '没有找到匹配的祷告',
    'start_sharing_prayer': '从主祷告墙开始分享祷告吧',
    'clear_search': '清除搜索',
    'showing': '显示',
    'of': '个祷告，共',
    'prayers_matching': '个祷告匹配',
    'failed_to_load_prayers': '加载祷告失败',
    'please_login_to_view': '请登录查看您的祷告',
    'please_login_to_delete': '请登录删除祷告',
    'failed_to_delete_prayer': '删除祷告失败',
    'prayer_deleted_successfully': '祷告删除成功',
    
    // User Prayer Card
    'only_visible_to_me': '仅自己可见',
    'unknown_time': '未知时间',
    'show_less': '收起',
    'show_more': '展开',
    
    // Account Settings Page
    'account_settings': '账户设置',
    'manage_profile_preferences': '管理您的个人资料信息和偏好',
    'profile_information': '个人资料信息',
    'update_profile_details': '更新您的个人资料详情和头像',
    'username': '用户名',
    'enter_your_username': '输入您的用户名',
    'birthday': '生日',
    'select_your_birthday': '选择您的生日',
    'birthday_optional_note': '可选 - 用于生日祝福',
    'choose_language': '选择语言',
    'language_preference_note': '语言偏好设置将在页面刷新后生效',
    'prayer_privacy': '祷告隐私',
    'choose_privacy_setting': '选择隐私设置',
    'all_prayers_visible': '所有祷告可见',
    'only_last_1_week_visible': '仅最近1周可见',
    'only_last_3_weeks_visible': '仅最近3周可见', 
    'only_last_6_months_visible': '仅最近6个月可见',
    'prayer_privacy_note': '控制其他人可以看到您多久前的祷告。您始终可以看到自己的所有祷告。本周的祷告对所有人都可见。',
    'avatar_url': '头像链接',
    'avatar_url_placeholder': 'https://example.com/avatar.jpg',
    'avatar_url_note': '提供一个指向您头像图片的直接链接',
    'saving': '保存中...',
    'save_changes': '保存更改',
    'saved': '已保存！',
    'save_error': '保存出错',
    'loading': '加载中...',
    
    // Prayer Reminders
    'prayer_reminders': '祷告提醒',
    'enabled': '已启用',
    'disabled': '已禁用',
    'notifications_not_supported': '您的浏览器不支持通知',
    'notifications_blocked': '通知被阻止。请在浏览器设置中启用通知以使用提醒功能。',
    'enable_reminders_for_notifications': '启用提醒以允许接收祷告提醒通知。',
    'reminders_active': '提醒已激活！您将在选定的时间收到通知。',
    'reminder_time': '提醒时间',
    'frequency': '频率',
    'daily': '每天',
    'weekly_sundays': '每周（周日）',
    'custom_days': '自定义日期',
    'select_days': '选择日期',
    'reminder_message': '提醒消息',
    'custom_reminder_message': '自定义提醒消息...',
    'characters_left': '剩余字符',
    'save_settings': '保存设置',
    'reminder_settings_saved': '提醒设置保存成功！',
    'time_for_prayer_reflection': '祷告和反思的时间到了',
    'sunday': '周日',
    'monday': '周一',
    'tuesday': '周二',
    'wednesday': '周三',
    'thursday': '周四',
    'friday': '周五',
    'saturday': '周六',
    
    // Prayer Export Modal
    'export_prayers': '导出祷告',
    'download_prayers_various_formats': '以各种格式下载您的祷告',
    'export_format': '导出格式',
    'text_file_readable': '文本文件 (.txt) - 可读格式',
    'json_structured_data': 'JSON (.json) - 结构化数据',
    'csv_spreadsheet_format': 'CSV (.csv) - 电子表格格式',
    'date_range': '日期范围',
    'all_time_count': '全部时间（{count} 个祷告）',
    'prayers_will_be_exported': '{count} 个祷告将被导出',
    'export_will_include': '导出将包含：',
    'prayer_content_dates': '祷告内容和日期',
    'author_names': '作者姓名',
    'like_comment_counts': '点赞和评论数',
    'export_metadata': '导出元数据',
    'exporting': '导出中...',
    'export_count_prayers': '导出 {count} 个祷告',
    'no_prayers_to_export': '选定日期范围内没有可导出的祷告。',
    'export_failed': '导出祷告失败。请重试。',
    'unknown_date': '未知日期',
    'my_prayer_journal_export': '我的祷告日志导出',
    'generated_on': '生成日期：',
    'total_prayers': '祷告总数：',
    'date_label': '日期：',
    'author_label': '作者：',
    'prayer_label': '祷告：',
    'likes_label': '点赞：',
    'comments_label': '评论：'
  },
  'en': {
    // Common actions
    'submit': 'Submit',
    'cancel': 'Cancel',
    'save': 'Save',
    'edit': 'Edit',
    'delete': 'Delete',
    'confirm': 'Confirm',
    'loading': 'Loading...',
    
    // Prayer form
    'author_name': 'Your Name',
    'author_name_placeholder': 'Enter your name',
    'fellowship': 'Fellowship',
    'fellowship_select': 'Select Fellowship',
    'thanksgiving_content': 'Thanksgiving Prayer',
    'thanksgiving_placeholder': 'Give thanks to God, share your gratitude...',
    'thanksgiving': 'Thanksgiving',
    'intercession_content': 'Prayer Request',
    'intercession_placeholder': 'Pray for others, share your requests...',
    'intercession': 'Intercession',
    'submit_prayer': 'Submit Prayer',
    'share_prayer': 'Share a Prayer',
    'edit_prayer': 'Edit Prayer',
    'update_prayer': 'Update Prayer',
    'post_prayer': 'Post Prayer',
    'updating': 'Updating...',
    'posting': 'Posting...',
    'total_chars': 'Total Characters',
    'chars': 'chars',
    'exceeded_limit': 'Exceeded limit',
    
    // Prayer wall
    'prayer_wall': 'Prayer Wall',
    'this_week': 'This Week',
    'current_week': 'Current Week',
    'read_only': 'Read Only',
    'no_prayers': 'No prayers yet',
    'no_prayers_message': 'No prayers this week yet, be the first to share.',
    'week_theme': 'This Week\'s Theme',
    'loading_error': 'Failed to load prayers',
    
    // User interactions
    'like': 'Like',
    'comment': 'Comment',
    'share': 'Share',
    'prayer_count': 'Prayer Count',
    'participant_count': 'Participants',
    'login_required': 'Please login to comment',
    'private_to_me': 'Private to me',
    'post': 'Post',
    'confirm_delete_comment': 'Are you sure you want to delete this comment?',
    'loading_comments_failed': 'Failed to load comments',
    'current_selection': 'Current selection',
    'share_gratitude': 'Share gratitude and praise',
    'prayer_requests': 'Pray for others or situations',
    'name_too_long': 'Name cannot exceed',
    'characters': 'characters',
    'submit_failed': 'Submit failed',
    'collapse': 'Collapse',
    
    // Search and Filter
    'search_placeholder': 'Search prayers...',
    'filters': 'Filters',
    'clear': 'Clear',
    'all': 'All',
    'prayer_type': 'Prayer Type',
    'both_types': 'Both Types',
    'date_range': 'Date Range',
    'this_month': 'This Month',
    
    // Validation messages
    'name_required': 'Please enter your name',
    'content_required': 'Please fill in at least one of thanksgiving or prayer request',
    'content_too_long': 'Content cannot exceed 500 characters',
    'invalid_content': 'Content may contain inappropriate words, please modify and resubmit',
    'confirm_delete_prayer': 'Are you sure you want to delete this prayer?',
    'delete_failed': 'Delete failed',
    
    // Navigation and Auth
    'login': 'Login',
    'logout': 'Logout',
    'profile': 'Profile',
    'my_prayers': 'My Prayers',
    'archive': 'Archive',
    'explore_past_prayers': 'Explore past weeks of prayers and community support',
    'no_archive_weeks': 'No archive weeks yet (no past prayers).',
    'archive_note': 'Only shows past weeks; current week will not appear here.',
    'week_of': 'Week of',
    'welcome_to_prayer_wall': 'Welcome to Prayer Wall',
    'join_community': 'Join our community of prayer and support',
    'continue_with_google': 'Continue with Google',
    'invalid_email': 'Invalid email format',
    'email_domain_error': 'Email domain does not exist or cannot receive emails',
    'login_error': 'Login error',
    'magic_link_sent': 'Magic link sent, please check your email',
    'track_prayer_journey': 'Track your prayer journey and spiritual growth',
    'prayer_reminders': 'Prayer Reminders',
    
    // Account settings
    'language_preference': 'Language Preference',
    'language_preference_note': 'Choose your interface language.',
    
    // Admin
    'admin_panel': 'Admin Panel',
    'admin_description': 'Manage prayer wall themes and settings for your organization',
    'theme_settings': 'Theme Settings',
    'user_management': 'User Management',
    'statistics': 'Statistics',
    'insufficient_permissions': 'Insufficient Permissions',
    'export_prayers': 'Export Prayers',
    'export_format': 'Export Format',
    'date_from': 'Date From',
    'date_to': 'Date To',
    'exporting': 'Exporting...',
    
    // QR Code
    'qr_code_title': 'Prayer Wall QR Code',
    'qr_code_description': 'Share this QR code to invite others to join our prayer community',
    'qr_code_note': 'Tip: Bookmark this page or print and post it. The QR code always points to the homepage, users will automatically jump to the current week page after scanning.',
    
    // Individual Prayer Page
    'prayer_not_found': 'Prayer not found',
    'invalid_prayer_data': 'Invalid prayer data',
    'shared_prayer': 'Shared Prayer',
    'shared_prayer_description': 'A prayer shared from the Prayer Wall community',
    'anonymous': 'Anonymous',
    'likes': 'likes',
    'prayer_id': 'Prayer ID',
    'join_prayer_community': 'Join Our Prayer Community',
    'share_connect_prayers': 'Share your own prayers and connect with others in faith and hope.',
    'visit_prayer_wall': 'Visit Prayer Wall',
    'prayer_shared_from': 'This prayer was shared from',
    'community_space_description': 'A community space for faith and hope',
    'prayer_removed_message': 'This prayer may have been removed or the link may be invalid.',
    
    // Statistics
    'total_prayers': 'Total Prayers',
    'total_likes': 'Total Likes',
    'total_comments': 'Total Comments',
    'try_again': 'Try Again',
    
    // Prayer Edit Modal
    'edit_prayer_description': 'Make changes to your prayer. You can only edit prayers from the current week.',
    'edit_current_week_only': 'You can only edit prayers from the current week.',
    'update_failed': 'Failed to update',
    
    // Prayer Analytics
    'prayer_analytics': 'Prayer Analytics',
    'all_time': 'All Time',
    'last_year': 'Last Year',
    'last_6_months': 'Last 6 Months',
    'unknown_error': 'Unknown error',
    'prayer_frequency': 'Prayer Frequency',
    'daily_average': 'Daily Average',
    'weekly_average': 'Weekly Average',
    'monthly_average': 'Monthly Average',
    'prayer_patterns': 'Prayer Patterns',
    'current_streak': 'Current Streak',
    'longest_streak': 'Longest Streak',
    'total_active': 'Total Active',
    'days': 'days',
    'preferred_time': 'Preferred Time',
    'engagement_insights': 'Engagement Insights',
    'average_likes': 'Average Likes',
    'average_comments': 'Average Comments',
    'average_words': 'Average Words',
    'longest_prayer': 'Longest Prayer',
    'words': 'words',
    'most_liked_prayer': 'Most Liked Prayer',
    'most_discussed_prayer': 'Most Discussed Prayer',
    'comments': 'comments',
    'fellowship_participation': 'Fellowship Participation',
    'prayer_distribution_by_fellowship': 'Prayer Distribution by Fellowship',
    'prayer_content_types': 'Prayer Content Types',
    'mixed_prayer': 'Mixed Prayer',
    'most_active_fellowship': 'Most Active Fellowship',
    'most_active_in': 'You are most active in',
    'monthly_activity': 'Monthly Activity',
    'no_analytics_data': 'No analytics data available',
    'start_sharing_for_analytics': 'Start sharing prayers to see your analytics',
    
    // Timeline related
    'my_prayer_timeline': 'My Prayer Timeline',
    'export': 'Export',
    'refresh': 'Refresh',
    'search_prayers': 'Search prayers...',
    'sort': 'Sort',
    'time': 'Time',
    'most_recent': 'Most Recent',
    'most_liked': 'Most Liked',
    'most_commented': 'Most Commented',
    'last_3_months': 'Last 3 Months',
    'loading_ellipsis': 'Loading...',
    'load_more': 'Load More',
    'no_prayers_found': 'No prayers found',
    'no_prayers_yet': 'No prayers yet',
    'no_prayers_matching': 'No prayers found matching',
    'start_sharing_prayer': 'Start by sharing a prayer on the main prayer wall',
    'clear_search': 'Clear search',
    'showing': 'Showing',
    'of': 'of',
    'prayers_matching': 'prayers matching',
    'failed_to_load_prayers': 'Failed to load prayers',
    'please_login_to_view': 'Please login to view your prayers',
    'please_login_to_delete': 'Please login to delete prayers',
    'failed_to_delete_prayer': 'Failed to delete prayer',
    'prayer_deleted_successfully': 'Prayer deleted successfully',
    
    // User Prayer Card
    'only_visible_to_me': 'Only visible to me',
    'unknown_time': 'Unknown time',
    'show_less': 'Show less',
    'show_more': 'Show more',
    
    // Account Settings Page
    'account_settings': 'Account Settings',
    'manage_profile_preferences': 'Manage your profile information and preferences',
    'profile_information': 'Profile Information',
    'update_profile_details': 'Update your profile details and avatar',
    'username': 'Username',
    'enter_your_username': 'Enter your username',
    'birthday': 'Birthday',
    'select_your_birthday': 'Select your birthday',
    'birthday_optional_note': 'Optional - used for birthday greetings',
    'choose_language': 'Choose language',
    'language_preference_note': 'Language preference will take effect after page refresh',
    'prayer_privacy': 'Prayer Privacy',
    'choose_privacy_setting': 'Choose privacy setting',
    'all_prayers_visible': 'All prayers visible',
    'only_last_1_week_visible': 'Only last 1 week visible',
    'only_last_3_weeks_visible': 'Only last 3 weeks visible',
    'only_last_6_months_visible': 'Only last 6 months visible',
    'prayer_privacy_note': 'Controls who can see your older prayers. You always see all your prayers. Current week is always visible to everyone.',
    'avatar_url': 'Avatar URL',
    'avatar_url_placeholder': 'https://example.com/avatar.jpg',
    'avatar_url_note': 'Provide a direct link to your profile image',
    'saving': 'Saving...',
    'save_changes': 'Save Changes',
    'saved': 'Saved!',
    'save_error': 'Save error',
    
    // Prayer Reminders
    'prayer_reminders': 'Prayer Reminders',
    'enabled': 'Enabled',
    'disabled': 'Disabled',
    'notifications_not_supported': 'Notifications are not supported in your browser',
    'notifications_blocked': 'Notifications are blocked. Please enable them in your browser settings to use reminders.',
    'enable_reminders_for_notifications': 'Enable reminders to allow notifications for prayer reminders.',
    'reminders_active': 'Reminders are active! You\'ll receive notifications at your selected times.',
    'reminder_time': 'Reminder Time',
    'frequency': 'Frequency',
    'daily': 'Daily',
    'weekly_sundays': 'Weekly (Sundays)',
    'custom_days': 'Custom days',
    'select_days': 'Select Days',
    'reminder_message': 'Reminder Message',
    'custom_reminder_message': 'Custom reminder message...',
    'characters_left': 'left',
    'save_settings': 'Save Settings',
    'reminder_settings_saved': 'Reminder settings saved successfully!',
    'time_for_prayer_reflection': 'Time for prayer and reflection',
    'sunday': 'Sunday',
    'monday': 'Monday',
    'tuesday': 'Tuesday',
    'wednesday': 'Wednesday',
    'thursday': 'Thursday',
    'friday': 'Friday',
    'saturday': 'Saturday',
    
    // Prayer Export Modal
    'export_prayers': 'Export Prayers',
    'download_prayers_various_formats': 'Download your prayers in various formats',
    'export_format': 'Export Format',
    'text_file_readable': 'Text File (.txt) - Readable format',
    'json_structured_data': 'JSON (.json) - Structured data',
    'csv_spreadsheet_format': 'CSV (.csv) - Spreadsheet format',
    'all_time_count': 'All Time ({count} prayers)',
    'prayers_will_be_exported': '{count} prayers will be exported',
    'export_will_include': 'Export will include:',
    'prayer_content_dates': 'Prayer content and dates',
    'author_names': 'Author names',
    'like_comment_counts': 'Like and comment counts',
    'export_metadata': 'Export metadata',
    'exporting': 'Exporting...',
    'export_count_prayers': 'Export {count} Prayers',
    'no_prayers_to_export': 'No prayers to export for the selected date range.',
    'export_failed': 'Failed to export prayers. Please try again.',
    'unknown_date': 'Unknown date',
    'my_prayer_journal_export': 'My Prayer Journal Export',
    'generated_on': 'Generated on: ',
    'total_prayers': 'Total prayers: ',
    'date_label': 'Date: ',
    'author_label': 'Author: ',
    'prayer_label': 'Prayer: ',
    'likes_label': 'Likes: ',
    'comments_label': 'Comments: '
  }
} as const

export type TranslationKey = keyof typeof translations['zh-CN']

// Simple translation function with template support
export function t(key: TranslationKey, locale: Locale = DEFAULT_LOCALE, params?: Record<string, string | number>): string {
  let text = translations[locale][key] || translations[DEFAULT_LOCALE][key] || key
  
  // Replace template parameters like {count} with actual values
  if (params) {
    Object.entries(params).forEach(([param, value]) => {
      text = text.replace(new RegExp(`{${param}}`, 'g'), String(value))
    })
  }
  
  return text
}

// Locale detection and validation
export function validateLocale(locale: string): Locale {
  return SUPPORTED_LOCALES.includes(locale as Locale) ? locale as Locale : DEFAULT_LOCALE
}

// Get locale from various sources
export function detectLocale(
  userPreference?: string | null,
  savedLocale?: string | null,
  urlLocale?: string | null,
  browserLocale?: string
): Locale {
  // Priority: user preference > saved preference > URL parameter > browser > default
  if (userPreference) {
    return validateLocale(userPreference)
  }
  
  if (savedLocale) {
    return validateLocale(savedLocale)
  }
  
  if (urlLocale) {
    return validateLocale(urlLocale)
  }
  
  if (browserLocale) {
    // Handle browser locale formats like 'en-US', 'zh-CN', etc.
    if (browserLocale.startsWith('en')) return 'en'
    if (browserLocale.startsWith('zh')) return 'zh-CN'
  }
  
  return DEFAULT_LOCALE
}

// Locale formatting helpers
export function formatDate(date: string | Date, locale: Locale): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  if (locale === 'en') {
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  } else {
    return dateObj.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long', 
      day: 'numeric'
    })
  }
}

// Number formatting
export function formatNumber(num: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'zh-CN').format(num)
}

// Week display formatting
export function formatWeekDisplay(weekStart: string, locale: Locale): string {
  if (locale === 'en') {
    return `Week of ${formatDate(weekStart, locale)}`
  } else {
    return `${formatDate(weekStart, locale)} 周`
  }
}