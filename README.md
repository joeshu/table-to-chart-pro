# 表格转图表 Pro

基于 Tauri 2 + Rust + Web 的桌面图表工具。

## 本地运行

```bash
npm install
npm run tauri dev
```

## GitHub Actions

- `Windows Build`：推送到 `main` 后构建 Windows 安装包，并上传 Artifact。
- `iOS IPA Build`：推送到 `main` 或手动触发，构建未签名 IPA，并上传 Artifact。

iOS 真机安装需要 Apple 签名证书和 Provisioning Profile。未签名 IPA 仅用于构建产物验证或后续签名。
