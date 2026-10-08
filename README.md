# K5032 宣化幅 · 下马岭组野外地质地图

这是适用于手机浏览器的宣化幅 K5032 地质采样地图。包含夏家沟、黄土岗、下花园、鸡镇屯和赵家山等 **12 个预设点位**，使用高德 GCJ-02 坐标。

## 目前状态

- ✅ 已提交单文件 `index.html`，提供手机端点位查询、GPS 定位、高德导航链接、卫星底图切换，以及新增点位和 CSV 导出。
- ⚠️ 尚未上传 v5.1 集合包中的地图原色 WebP 栅格、图例、矢量属性数据。目前地图可显示点位，高德底图需要你自己的 Web JS API Key 与 Security JS Code。
- ⚠️ 地质图为近似坐标配准，实地采样须结合原始地质图和控制点校正。

## 启用 GitHub Pages

打开本仓库 **Settings → Pages → Build and deployment**，选择 **Deploy from a branch**，分支选 **main**，目录选 **/(root)**，保存。

手机访问：<https://yuhuiwang91-coder.github.io/k5032-xiamaling-map/>

若是 404，检查 Pages 发布状态、是否已经完成首次部署，以及 `index.html` 是否在仓库根目录。

## 补上传完整集合包

本项目完整的 **K5032_宣化幅_手机GitHubPages_部署包.zip** 目前保存在 ChatGPT 对话下载链接中。下载后**先解压**，在本仓库 `Add file → Upload files` 上传解压目录中的所有内容，确保 `index.html`、`app.js`、`styles.css` 位于仓库根目录，并保留 `data` 下各子目录原始层级。GitHub 会提示替换现有 `index.html`，正常提交即可。

文件包括：

- `index.html`、`app.js`、`styles.css`、`data/raster_layers.js`
- `data/raster/K5032_native_GCJ02_local.webp`（原色采样区图）
- `data/raster/K5032_native_GCJ02_full.webp`（原色全幅图）
- `data/local_data.js`、`data/full_data.js`（地质属性查询）
- `data/legend/`、`data/gis/`、`data/preview/`（图例、点位及预览）

**必须上传目录内部文件，不能只上传 ZIP。** 文件全部小于 GitHub 网页上传单文件 25 MB 的限制。

完整 v5.1 版上传后将替换目前简化版首页，恢复地质信息搜索、地图图层切换、图例等完整功能。

## 注意

高德 Web JS API Key 和 Security JS Code 由使用者在运行页面输入，不应把密钥写入 GitHub 的公开源文件。公开 Pages 仓库的预设采样点坐标对访问者可见。新增点位保存在手机浏览器的 localStorage，重要数据请及时导出 CSV。

原始坐标系和 TIF 地图叠加都属于近似配准；不要用它来替代米级测量或严格地层追索。
