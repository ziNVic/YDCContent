# Kimi 本地审核版启动说明

1. 在终端进入本目录。
2. 运行 `npm run dev:kimi`。
3. 在浏览器打开 `http://localhost:3000`。

API Key 保存在 macOS 系统钥匙串，服务启动时读取，不会写入本项目文件。

当前模型配置：

- 接口：`https://api.kimi.com/coding/v1`
- 模型：`kimi-for-coding`
- Thinking：关闭；Kimi Coding 服务会按其机制切换至 K2.6 非思考模式。
