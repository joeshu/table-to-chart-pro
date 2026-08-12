# 表格转图表 Pro

基于 Tauri 2 + Rust + Web 的桌面图表工具。

## 本地运行

```bash
npm install
npm run tauri dev
```

## GitHub Actions

- `Windows Build`：推送到 `main` 后验证并构建 Windows NSIS 安装包。
- `iOS IPA Build`：推送到 `main` 或手动触发，尝试构建未签名 IPA。
- `Release`：推送 `v*` 标签后创建 GitHub Release，附带 Windows 安装包、便携版、SHA-256 校验值、隐私说明和许可清单。

## 发布

1. 更新 `package.json` 中的版本号，构建时会自动同步到 `tauri.conf.json`。
2. 更新 `CHANGELOG.md`。
3. 创建并推送标签，例如 `git tag v1.0.0 && git push origin v1.0.0`。

Windows 代码签名和 iOS 真机签名需要证书与 GitHub Secrets，当前未配置。未签名 IPA 仅用于构建验证或后续签名。
