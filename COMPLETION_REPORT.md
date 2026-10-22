# QRCode666 — 开发完成报告

日期：2026-10-22 · 项目目录：`E:\qrcode666` · 许可证：MIT

## 结论

所有要求的功能已实现：生产构建成功，全部自动化测试通过（单元/解码测试 104 项，浏览器端到端测试 40 项，
连续两轮全部通过）。项目是纯静态站点，可直接部署到 Cloudflare Pages。

## 最终验证结果

| 检查 | 结果 |
| --- | --- |
| TypeScript 类型检查（`npm run typecheck`） | 通过，0 错误 |
| 单元 + 解码测试（`npm test`） | **115 / 115 通过** |
| 生产构建（`npm run build`） | 成功：预渲染 `/`、`/zh/`、`/404.html`，生成 sitemap、robots |
| 端到端测试（`npm run test:e2e`，Microsoft Edge） | **59 / 59 通过** |
| Lighthouse `/` 移动端 | 性能 98 · 无障碍 100 · 最佳实践 100 · SEO 92* |
| Lighthouse `/` 桌面端 | 性能 100 · 无障碍 100 · 最佳实践 100 · SEO 92* |
| Lighthouse `/zh/` 移动端 | 性能 98 · 无障碍 100 · 最佳实践 100 · SEO 92* |

移动端指标：FCP 1.4 s，LCP 2.2 s，TBT 10 ms，CLS 0。

\* SEO 唯一未通过的是 `robots-txt` 检查：Lighthouse 在页面内部用 fetch 读取 robots.txt，而我们的隐私
安全策略（`connect-src 'none'`）禁止页面发起任何网络请求。搜索引擎会直接请求 robots.txt，它可以正常访问。
这条 CSP 正是“数据不会离开设备”的技术保证，因此保留。

## 二维码正确性验证方式

不只是检查“图片生成了”，而是**把实际输出解码回来**：

- 单元测试：生成 SVG，用 resvg 栅格化，再用 **jsQR** 和 **ZXing** 两个独立解码器解码。解码结果必须与
  预期内容逐字一致。
- 端到端测试：在真实浏览器中点击下载，读取真实的 PNG/SVG 文件后再解码。

已验证的情况：普通网址、长网址、中文、日文/韩文、emoji、特殊字符、多行文本、含特殊字符的 Wi-Fi 密码、
vCard、邮件/电话/短信/位置/日程、空输入（不生成任何二维码，下载按钮禁用）、容量上限（恰好上限可以生成，
多 1 字节即给出清晰提示）、PNG 512/1024/2048/4096、SVG（确认为纯矢量路径、无内嵌位图）、自定义 Logo
（最大尺寸下仍可扫描）、全部 5 个预设、透明背景、低对比度拦截、深色/浅色模式、移动端布局。另有测试确认：
输入、上传和下载全过程中**没有任何网络请求**。

## 测试中发现并修复的问题

1. **点状/圆角码点下 jsQR 无法识别**：原因是对齐图案被拆成离散的点。修复：定位和对齐图案始终绘制为实心形状。
2. **圆角定位样式在部分尺寸下 ZXing 识别失败**：经多尺寸扫描定位，根因是圆角的*对齐图案*。修复：圆角样式
   保留方形对齐图案，并把这项多尺寸扫描（1152 次解码）加入了永久测试。
3. **Logo 尺寸上限**：实测 Q 级在 36% 宽度、H 级在 40% 宽度开始失效，因此上限定为 22% / 26%，留出约 10 个
   百分点的安全余量。添加 Logo 时自动把纠错等级提升到 H。
4. **开场动画单词之间缺少真实空格**：会影响读屏软件。已修复。
5. **字体加载导致移动端布局偏移**（CLS 0.136）：内联 CSS、预加载首屏字体、添加度量匹配的回退字体后降为 0。
6. **包体积**：移除了 Motion 动画库（约 30 KB gzip），开场动画改用 CSS 关键帧实现；二维码库只引入核心编码器；
   首页 HTML 从 272 KB 降到 170 KB（gzip 后 32 KB）。
7. **中文斜体衬线回退效果不佳**：中文环境下改用无衬线字体。
8. 测试本身的稳定性问题（点击 1px 的隐藏单选框）已改为点击可见标签。

## 后续更新（同日）

- **开场动画放慢**：总时长从约 4 秒延长到约 6.3 秒。每一幕完整出现后停留片刻再切换（之前第二、三幕在出现过程中就被切走）。调整位置：`src/components/Intro.tsx` 顶部的 `T`。
- **捐赠（不是给我们）**：新增“想说谢谢？别给我们。”区块，访客可在 **UNICEF（联合国儿童基金会）** 和 **WFP（世界粮食计划署）** 之间选择。页脚和每次下载完成后也会出现同样两个链接。链接指向官方捐款页，不带追踪参数、不传 referrer，并注明“与两家机构均无关联”。链接维护位置：`src/lib/donate.ts`。
- **捐款点击匿名计数**：捐款链接先经过本站的 `/donate/<机构>`，由 Cloudflare Pages Function 在 D1 数据库中按“日期 + 机构 + 页面语言”累加计数，再 302 跳转到官方捐款页。不读取、不存储 IP、浏览器信息、来源或 Cookie。FAQ 和捐赠区块已如实说明。已在本地用 `wrangler pages dev` + 本地 D1 实测：3 次 UNICEF、1 次 WFP 点击被准确计数，HEAD 请求和未知机构不计数。查看数据的方法见 README “Donation click counts”。

- **新 Logo**：采用你提供的设计（黑色二维码、蓝色定位中心、中间 “666”、下方文字标），用我们自己的编码器重建为矢量图形，扫码结果为 `https://qrcode666.app`。从 140 到 1200 像素共 47 个尺寸，jsQR 和 ZXing 都能识别。原图的天蓝色 `#019eff` 在定位中心会被相机识别为中灰，导致约 15% 的尺寸 jsQR 无法识别，因此 Logo 改用网站主色电光蓝 `#1d4bff`。原图保存在 `brand/original-artwork.webp`。
- **本地预览时捐款链接回到首页的问题**：`vite preview` 中没有 Cloudflare Function，页面会被直接返回。现在页面的启动脚本识别 `/donate/<机构>` 后会立即跳转到官方捐款页（此时不计数）；部署到 Cloudflare 后由 Function 计数并跳转。

- **SEO 扩展**：新增 9 个按类型划分的生成器落地页（如 `/wifi-qr-code-generator`、`/vcard-qr-code-generator`，生成器自动预选对应类型）和 2 篇指南（`/do-qr-codes-expire`、`/qr-code-stopped-working`），中英文各一套，共 24 个预渲染页面。每页都有独立的标题、描述、规范链接、hreflang、Open Graph 和结构化数据（应用、常见问题、面包屑、文章）；页脚链接到所有页面；sitemap 自动生成。从搜索进入落地页的访客不再自动播放开场动画。为满足对比度要求，次要灰色文字加深（无障碍评分恢复 100）。站外推广清单见 README “SEO: getting found”。

- **已部署到 Cloudflare Pages**（2026-10-22）：项目名 `qrcode666`，地址 https://qrcode666.pages.dev 。D1 数据库 `qrcode666-donations` 已建表。线上验证通过：24 个页面均返回 200，未知页面返回 404，安全响应头齐全，捐款链接 302 跳转到官方页面且点击被正确计数（验证用的 2 条测试记录已删除，统计从零开始）。以后更新网站：先运行 `npm run build`，再运行 `npx wrangler pages deploy --branch main`。

- **正式域名已生效**：https://qrcode666.app 和 https://www.qrcode666.app 均已绑定并签发 HTTPS 证书，http 自动跳转到 https；www 页面的规范链接指向主域名。所有页面、404、安全响应头和捐款跳转均已在正式域名下验证通过。
- **需要关闭 Cloudflare Web Analytics**：Cloudflare 会自动向该域名下的页面注入统计脚本（`static.cloudflareinsights.com/beacon.min.js`）。我们的安全策略已经拦截了它，没有收集任何数据，但仍应在后台关闭：qrcode666.app → Analytics & Logs → Web Analytics。

## 主要技术决策

- React 19 + TypeScript + Vite 8 + Tailwind CSS 4。构建时预渲染为静态 HTML，客户端再接管（hydration），无需服务器。
- 不使用 Motion：一段固定的约 6 秒时间线用 CSS 关键帧即可实现，节省约 30 KB。开场动画不会延迟页面加载，
  主页面在动画下方已完成渲染。
- 二维码编码使用成熟的 `qrcode` 库（仅核心编码器）。渲染由我们自己实现，预览、SVG 和 PNG 共用同一套几何数据，
  三者完全一致。
- 隐私由浏览器强制执行：CSP `connect-src 'none'`，字体和脚本全部本地打包，内联脚本仅允许指定哈希。
- 文案严谨：明确说明静态码无法修改；链接本身失效时二维码也就失去作用；Cloudflare 会处理 IP 等标准请求数据；
  浏览器中只保存语言、主题和“已看过开场动画”这几个标记。

## 交付内容

- 完整源代码：`src/`、`scripts/`、`tests/`、`public/`
- `README.md`：功能、本地运行、测试、Cloudflare Pages 部署、自定义域名绑定、技术决策、后续扩展
- `LICENSE`：MIT
- 品牌资源：`public/logo.svg`、`favicon.svg/.ico`、`icon-192/512.png`、`icon-maskable-512.png`、
  `apple-touch-icon.png`、`avatar.png`（GitHub/社交头像）、`og-image.png`
- 生产构建产物：`dist/`（可直接上传）

## 本地运行

```
npm install
npm run dev        # http://localhost:5173
npm run build      # 输出到 dist/
npm test           # 单元 + 解码测试
npm run test:e2e   # 浏览器测试（需先 build）
```

## 需要注意的事项

- **尚未提交 git commit**（我没有替你提交）。仓库已 `git init`，但 Windows 提示该目录存在 “dubious ownership”，
  首次使用 git 前可能需要执行：`git config --global --add safe.directory E:/qrcode666`
- 二维码已通过两个独立解码器、多种尺寸验证；**尚未用实体手机扫描**（自动化环境无法做到），正式印刷前
  建议用 iPhone 和 Android 各扫一次。
- `_headers` 中启用了 HSTS（`includeSubDomains`），如果 qrcode666.app 下有不支持 HTTPS 的子域名，请先调整。
- Cloudflare Pages 项目中请保持 Web Analytics 关闭，以保证“无追踪”的承诺属实。

## 后续可扩展功能

本地历史记录（默认关闭）、CSV 批量生成并打包为 ZIP、更多类型（EPC/SEPA 支付码、MeCard、应用商店链接）、
定位图案单独配色、渐变填充（带对比度校验）、PDF/EPS 印刷导出、打印尺寸计算器、本地摄像头“试扫”、
更多语言、离线 PWA。
