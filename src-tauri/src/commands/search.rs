use crate::search::{SearchEngine, SearchOptions, SearchResult};
use std::path::PathBuf;

#[tauri::command]
pub async fn search_files(
    directory: String,
    query: String,
    case_sensitive: bool,
    file_extensions: Vec<String>,
) -> Result<Vec<SearchResult>, String> {
    let path = PathBuf::from(directory);
    
    if !path.exists() || !path.is_dir() {
        return Err("Invalid directory path".to_string());
    }

    let options = SearchOptions {
        case_sensitive,
        file_extensions: if file_extensions.is_empty() { None } else { Some(file_extensions) },
        max_file_size: Some(50 * 1024 * 1024), // 50MB
    };

    let engine = SearchEngine::new();
    engine.search(&path, &query, options)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn open_file(file_path: String) -> Result<(), String> {
    open::that(&file_path).map_err(|e| e.to_string())
}