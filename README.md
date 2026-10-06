# 小小自习室

给三位朋友使用的私人线上自习室：房间场景、Supabase Auth 登录、成员在线/工作状态、多段专注、英中双时区显示、聊天、专注历史和预设动物。

## 预览

在项目目录运行：

```powershell
python -m http.server 4173
```

然后打开 <http://localhost:4173>。请通过网页服务器访问，不要直接打开 `index.html`。使用 Supabase Auth 中已创建且已加入 `room_members` 的邮箱和密码登录。

## 数据和云端接入

Supabase URL 和 publishable key 配置在 [`supabase-config.js`](supabase-config.js)。登录使用 Supabase Auth 持久化 session；房间成员及昵称/形象来自 `room_members`，专注记录读写 `work_sessions`，工作状态通过 Postgres Changes 同步，在线状态通过 Presence 同步。账号必须已经加入对应房间的 `room_members`。数据库策略见 [`supabase/schema.sql`](supabase/schema.sql)。浏览器只使用 publishable/anon key，不要放置 service-role key。

已有房间要启用创建者改名权限，请在 SQL Editor 单独运行 [`supabase/room-owner-migration.sql`](supabase/room-owner-migration.sql)。它会为指定的现有房间增加 `created_by` 并在仅为空时回填，不删除或重建记录。不要为了这个变更重新运行包含初始化插入的整个 `schema.sql`。

聊天复用同一个 Supabase Auth session。运行 [`supabase/chat.sql`](supabase/chat.sql) 后，成员可读取房间历史消息并订阅当前房间的 Realtime INSERT。RLS 拒绝非成员读取和发送消息。

## 规则

- 每次开始和结束都会形成独立工作时段；同一成员最多只有一个未结束时段。
- 时间戳按 UTC 保存。英国统计使用 `Europe/London`，中国统计使用 `Asia/Shanghai`，各自按本地日历日汇总；英国夏令时由时区数据库处理。
- 用户身份始终由已认证的 Supabase Auth user ID 决定，不提供本地身份切换。
- Presence（在线连接）与工作时段（持久记录）是两个概念：用户可以在线休息，也可能关闭页面后留下未结束的时段。
