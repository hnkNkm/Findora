# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Tauri desktop application combining a Rust backend with a React/TypeScript frontend. The application uses Tauri 2.x for cross-platform desktop functionality.

## Development Commands

### Running the Application
```bash
npm run tauri dev    # Start development mode with hot reload
```

### Building
```bash
npm run build        # Build frontend only
npm run tauri build  # Build complete desktop application
```

### Frontend Development
```bash
npm run dev          # Start Vite dev server (frontend only)
npm run preview      # Preview production build
```

### Rust Backend
```bash
cd src-tauri
cargo build          # Build Rust code
cargo check          # Check for compilation errors
```

## Architecture

### Directory Structure
- `src-tauri/` - Rust backend (Tauri application)
  - `src/lib.rs` - Core application logic and Tauri commands
  - `src/main.rs` - Entry point wrapper
  - `tauri.conf.json` - Tauri configuration
  - `capabilities/` - Security permissions
- `src/` - React frontend
  - `App.tsx` - Main React component
  - `main.tsx` - React entry point

### Key Patterns
- **Frontend-Backend Communication**: Use Tauri commands via `@tauri-apps/api`
- **Command Pattern**: Define commands in `src-tauri/src/lib.rs` with `#[tauri::command]`
- **State Management**: Currently using React hooks (useState)
- **Build System**: Vite for frontend, Cargo for Rust

### Adding New Commands
1. Define command in `src-tauri/src/lib.rs`:
   ```rust
   #[tauri::command]
   fn my_command(param: &str) -> Result<String, String> {
       Ok(format!("Result: {}", param))
   }
   ```
2. Register in the builder chain in `lib.rs`
3. Import and use in React via `@tauri-apps/api/core`

### Security Configuration
- Permissions defined in `src-tauri/capabilities/`
- Currently allows core functionality and external link opening
- CSP is disabled in development

## Development Environment
- Vite dev server: http://localhost:1420
- HMR websocket: port 1421
- Recommended extensions: Tauri, rust-analyzer