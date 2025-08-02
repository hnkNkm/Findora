use std::fs;
use std::path::Path;
use std::time::SystemTime;
use serde::{Serialize, Deserialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileMetadata {
    pub size: u64,
    pub created: Option<i64>,
    pub modified: Option<i64>,
    pub is_readonly: bool,
}

impl FileMetadata {
    pub fn from_path(path: &Path) -> Result<Self, std::io::Error> {
        let metadata = fs::metadata(path)?;
        
        let created = metadata.created()
            .ok()
            .and_then(|time| time.duration_since(SystemTime::UNIX_EPOCH).ok())
            .map(|duration| duration.as_secs() as i64);
            
        let modified = metadata.modified()
            .ok()
            .and_then(|time| time.duration_since(SystemTime::UNIX_EPOCH).ok())
            .map(|duration| duration.as_secs() as i64);

        Ok(FileMetadata {
            size: metadata.len(),
            created,
            modified,
            is_readonly: metadata.permissions().readonly(),
        })
    }
}