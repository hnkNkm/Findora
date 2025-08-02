use ignore::WalkBuilder;
use std::path::{Path, PathBuf};
use walkdir::WalkDir;

pub struct FileScanner {
    use_gitignore: bool,
    max_depth: Option<usize>,
}

impl FileScanner {
    pub fn new() -> Self {
        Self {
            use_gitignore: true,
            max_depth: None,
        }
    }

    pub fn with_gitignore(mut self, use_gitignore: bool) -> Self {
        self.use_gitignore = use_gitignore;
        self
    }

    pub fn with_max_depth(mut self, depth: Option<usize>) -> Self {
        self.max_depth = depth;
        self
    }

    pub fn scan(&self, root_path: &Path, extensions: Option<&[String]>) -> Vec<PathBuf> {
        let mut files = Vec::new();

        if self.use_gitignore {
            let mut builder = WalkBuilder::new(root_path);
            builder.standard_filters(true);
            
            if let Some(depth) = self.max_depth {
                builder.max_depth(Some(depth));
            }

            for entry in builder.build() {
                if let Ok(entry) = entry {
                    let path = entry.path();
                    if path.is_file() && self.matches_extension(path, extensions) {
                        files.push(path.to_path_buf());
                    }
                }
            }
        } else {
            let walker = if let Some(depth) = self.max_depth {
                WalkDir::new(root_path).max_depth(depth)
            } else {
                WalkDir::new(root_path)
            };

            for entry in walker.into_iter().filter_map(|e| e.ok()) {
                let path = entry.path();
                if path.is_file() && self.matches_extension(path, extensions) {
                    files.push(path.to_path_buf());
                }
            }
        }

        files
    }

    fn matches_extension(&self, path: &Path, extensions: Option<&[String]>) -> bool {
        if let Some(exts) = extensions {
            if let Some(ext) = path.extension() {
                let ext_str = ext.to_string_lossy().to_lowercase();
                return exts.iter().any(|e| e.to_lowercase() == ext_str);
            }
            false
        } else {
            true
        }
    }
}

pub fn scan_directory(
    root_path: &Path,
    extensions: Option<Vec<String>>,
    use_gitignore: bool,
) -> Vec<PathBuf> {
    let scanner = FileScanner::new()
        .with_gitignore(use_gitignore);
    
    scanner.scan(root_path, extensions.as_deref())
}