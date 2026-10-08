# 宣化幅 K5032 · 下马岭组野外地质地图（v5.1）

**手机地图：** https://yuhuiwang91-coder.github.io/k5032-xiamaling-map/

此项目按照 [黄麦岭野外地质地图](https://yuhuiwang91-coder.github.io/Huangmailing-Field-Map/) 的交互形式部署，包含相同的主工具栏、五标签侧栏（图层 / 搜索 / 属性 / 样点 / 数据审计）、原版图例展示及新样点记录。

## 已部署的完整网页

- `index.html`、`app.js`、`styles.css`：手机版互动页面（全部位于仓库根目录）
- `data/raster/K5032_native_GCJ02_local.webp`：12点采样区原色地质图
- `data/raster/K5032_native_GCJ02_full.webp`：整幅宣化幅原色地质图
- `data/raster_layers.js`：采样区及全幅影像范围
- `data/local_data.js`：采样区654个查询要素，含12处既有采样点
- `data/full_data.js`：全幅6637个查询要素（按需加载）
- `data/legend/`：原版图例、地层柱、剖面图
- `data/gis/`：样点坐标表与GeoJSON
- `manifest.webmanifest`：手机添加到主屏幕

**不需要再上传资源，也不需要重新建仓库。** 旧版部署包留在仓库子目录作为备份，网页根目录运行的是完整版本。

## 手机使用

1. 打开上方手机地图网址。
2. 如要求填写高德 Web端 JS API Key 和安全密钥，输入自己的密钥。页面会优先沿用先前简化版保存在同域浏览器中的Key。
3. 左侧“图层”调整原色地质图透明度；右上角“数据范围”在采样区和宣化幅全图间切换。
4. “样点”中浏览12个位置、跳转高德APP；“新增样点”后及时导出CSV或GeoJSON。
5. Android Chrome / iPhone Safari 均可添加网页到手机主屏幕。

需要在 `Settings → Pages` 中使用 `main` 分支的 `/(root)` 目录进行发布。

## 数据及精度说明

数据来自MAPGIS 6.7 K5032工程与宣化幅TIF，网页展示使用GCJ-02，高德底图及导航需要联网。原始TIF未带精确地理配准信息，现有栅格仅为图框配准近似版，野外需使用已知控制点核验。1∶20万地层边界不适用于米级定位。

公开 GitHub Pages 中的预设点位是公开可访问的；个人新增点位只保存在当前浏览器中，不会自动同步。重要记录请及时备份。高德密钥切勿写进公开代码中。
