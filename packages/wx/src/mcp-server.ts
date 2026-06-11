import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'

const server = new McpServer({
  name: 'jovipost-wx',
  version: '0.1.0',
})

// TODO: 微信公众号工具待开发

const transport = new StdioServerTransport()
await server.connect(transport)
