pub mod engine;

pub use engine::*;

use serde::{Serialize, Deserialize};
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchResult {
    pub file_path: PathBuf,
    pub file_name: String,
    pub matches: Vec<Match>,
    pub file_size: u64,
    pub modified: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Match {
    pub line_number: usize,
    pub column: usize,
    pub context: String,
    pub matched_text: String,
}