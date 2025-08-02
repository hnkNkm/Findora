mod file_system;
mod text_extractor;

use file_system::scan_directory;
use text_extractor::extract_text_from_file;
use std::path::PathBuf;
use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize)]
struct FileInfo {
    path: String,
    name: String,
    content_preview: String,
}

// テスト用の簡単なコマンド
#[tauri::command]
async fn test_scan_directory(directory: String) -> Result<Vec<String>, String> {
    let path = PathBuf::from(directory);
    
    if !path.exists() || !path.is_dir() {
        return Err("Invalid directory path".to_string());
    }

    let files = scan_directory(&path, Some(vec!["txt".to_string(), "md".to_string()]), true);
    
    Ok(files.iter()
        .map(|p| p.to_string_lossy().to_string())
        .collect())
}

// テキストファイルの内容を読み取るテストコマンド
#[tauri::command]
async fn test_read_file(file_path: String) -> Result<FileInfo, String> {
    let path = PathBuf::from(&file_path);
    
    if !path.exists() || !path.is_file() {
        return Err("Invalid file path".to_string());
    }

    let content = extract_text_from_file(&path)
        .map_err(|e| e.to_string())?;
    
    let preview = content.chars().take(200).collect::<String>();
    
    Ok(FileInfo {
        path: file_path,
        name: path.file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("unknown")
            .to_string(),
        content_preview: preview,
    })
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            test_scan_directory,
            test_read_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
