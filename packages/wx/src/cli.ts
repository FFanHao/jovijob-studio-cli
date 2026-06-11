#!/usr/bin/env node
import { Command } from 'commander'

const program = new Command()
program.name('jovipost-wx').description('JoviJob 微信公众号 CLI + MCP Server（开发中）').version('0.1.0')

// ===== mcp =====
program
  .command('mcp')
  .description('启动 MCP Server（stdio 模式，供 Claude 调用）')
  .action(async () => {
    await import('./mcp-server.js')
  })

program.parse()
