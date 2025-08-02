use crate::file_system::scan_directory;
use crate::text_extractor::extract_text_from_file;
use super::{SearchResult, Match};
use std::path::Path;
use serde::{Serialize, Deserialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchOptions {
    pub case_sensitive: bool,
    pub file_extensions: Option<Vec<String>>,
    pub max_file_size: Option<u64>,
}

pub struct SearchEngine;

impl SearchEngine {
    pub fn new() -> Self {
        Self
    }

    pub async fn search(
        &self,
        directory: &Path,
        query: &str,
        options: SearchOptions,
    ) -> Result<Vec<SearchResult>, Box<dyn std::error::Error>> {
        if query.is_empty() {
            return Ok(Vec::new());
        }

        println!("Searching in directory: {:?} for query: {}", directory, query);

        // ディレクトリをスキャン
        let files = scan_directory(directory, options.file_extensions.clone(), true);
        println!("Found {} files to search", files.len());
        let mut results = Vec::new();

        for file_path in files {
            // ファイルサイズチェック
            if let Some(max_size) = options.max_file_size {
                if let Ok(metadata) = std::fs::metadata(&file_path) {
                    if metadata.len() > max_size {
                        continue;
                    }
                }
            }

            // ファイル内容を読み取り
            match extract_text_from_file(&file_path) {
                Ok(content) => {
                    // 検索実行
                    let matches = self.search_in_content(&content, query, options.case_sensitive);
                    
                    if !matches.is_empty() {
                        let metadata = std::fs::metadata(&file_path)?;
                        let modified = metadata.modified()?
                            .duration_since(std::time::SystemTime::UNIX_EPOCH)?
                            .as_secs() as i64;

                        results.push(SearchResult {
                            file_path: file_path.clone(),
                            file_name: file_path
                                .file_name()
                                .and_then(|n| n.to_str())
                                .unwrap_or("unknown")
                                .to_string(),
                            matches,
                            file_size: metadata.len(),
                            modified,
                        });
                    }
                }
                Err(_) => {
                    // ファイルが読めない場合はスキップ
                    continue;
                }
            }
        }

        Ok(results)
    }

    fn search_in_content(&self, content: &str, query: &str, case_sensitive: bool) -> Vec<Match> {
        let mut matches = Vec::new();
        let lines: Vec<&str> = content.lines().collect();
        
        let search_query = if case_sensitive {
            query.to_string()
        } else {
            query.to_lowercase()
        };

        for (line_index, line) in lines.iter().enumerate() {
            let search_line = if case_sensitive {
                line.to_string()
            } else {
                line.to_lowercase()
            };

            let mut start = 0;
            while let Some(pos) = search_line[start..].find(&search_query) {
                let column = start + pos;
                
                // コンテキストを取得（前後の行を含む）
                let context_start = line_index.saturating_sub(10);
                let context_end = (line_index + 11).min(lines.len());
                let context = lines[context_start..context_end].join("\n");

                matches.push(Match {
                    line_number: line_index + 1,
                    column: column + 1,
                    context,
                    matched_text: line[column..column + query.len()].to_string(),
                });

                start = column + query.len();
            }
        }

        matches
    }
}