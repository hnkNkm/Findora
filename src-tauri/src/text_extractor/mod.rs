pub mod plain_text;

pub use plain_text::*;

use std::path::Path;

pub trait TextExtractor {
    fn extract_text(&self, path: &Path) -> Result<String, Box<dyn std::error::Error>>;
    fn supported_extensions(&self) -> Vec<&'static str>;
}