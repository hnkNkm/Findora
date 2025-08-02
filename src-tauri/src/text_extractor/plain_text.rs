use super::TextExtractor;
use encoding_rs::Encoding;
use std::fs::File;
use std::io::Read;
use std::path::Path;

pub struct PlainTextExtractor;

impl PlainTextExtractor {
    pub fn new() -> Self {
        Self
    }

    fn detect_encoding(bytes: &[u8]) -> &'static Encoding {
        // Try BOM detection first
        if bytes.len() >= 3 && bytes[0] == 0xEF && bytes[1] == 0xBB && bytes[2] == 0xBF {
            return encoding_rs::UTF_8;
        }
        if bytes.len() >= 2 && bytes[0] == 0xFF && bytes[1] == 0xFE {
            return encoding_rs::UTF_16LE;
        }
        if bytes.len() >= 2 && bytes[0] == 0xFE && bytes[1] == 0xFF {
            return encoding_rs::UTF_16BE;
        }

        // Default to UTF-8 if no BOM detected
        encoding_rs::UTF_8
    }
}

impl TextExtractor for PlainTextExtractor {
    fn extract_text(&self, path: &Path) -> Result<String, Box<dyn std::error::Error>> {
        let mut file = File::open(path)?;
        let mut buffer = Vec::new();
        file.read_to_end(&mut buffer)?;

        if buffer.is_empty() {
            return Ok(String::new());
        }

        let encoding = Self::detect_encoding(&buffer);
        let (text, _, had_errors) = encoding.decode(&buffer);
        
        if had_errors {
            // Fall back to UTF-8 with replacement characters
            Ok(String::from_utf8_lossy(&buffer).to_string())
        } else {
            Ok(text.to_string())
        }
    }

    fn supported_extensions(&self) -> Vec<&'static str> {
        vec!["txt", "md", "log", "cfg", "conf", "json", "xml", "yml", "yaml", "toml", "ini", "csv", "tsv"]
    }
}

pub fn extract_text_from_file(path: &Path) -> Result<String, Box<dyn std::error::Error>> {
    let extractor = PlainTextExtractor::new();
    extractor.extract_text(path)
}