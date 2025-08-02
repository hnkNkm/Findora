import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import "./App.css";

interface FileInfo {
  path: string;
  name: string;
  content_preview: string;
}

interface SearchResult {
  file_path: string;
  file_name: string;
  matches: Match[];
  file_size: number;
  modified: number;
}

interface Match {
  line_number: number;
  column: number;
  context: string;
  matched_text: string;
}

function App() {
  const [directory, setDirectory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [files, setFiles] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null);
  const [selectedSearchResult, setSelectedSearchResult] = useState<SearchResult | null>(null);
  const [error, setError] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<"relevance" | "date" | "size">("relevance");
  const itemsPerPage = 10;

  async function scanDirectory() {
    try {
      setError("");
      const result = await invoke<string[]>("test_scan_directory", { directory });
      setFiles(result);
    } catch (e) {
      setError(String(e));
      setFiles([]);
    }
  }

  async function readFile(filePath: string) {
    try {
      setError("");
      const result = await invoke<FileInfo>("test_read_file", { filePath });
      setSelectedFile(result);
    } catch (e) {
      setError(String(e));
      setSelectedFile(null);
    }
  }

  async function searchFiles() {
    try {
      setError("");
      setIsSearching(true);
      console.log("Searching with params:", { directory, query: searchQuery });
      const results = await invoke<SearchResult[]>("search_files", {
        directory,
        query: searchQuery,
        caseSensitive,
        fileExtensions: ["txt", "md", "rs", "toml", "json", "js", "ts", "tsx"],
      });
      console.log("Search results:", results);
      setSearchResults(results);
      setCurrentPage(1);
    } catch (e) {
      console.error("Search error:", e);
      setError(String(e));
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }

  async function openFile(filePath: string) {
    try {
      await invoke("open_file", { filePath });
    } catch (e) {
      setError(String(e));
    }
  }

  async function selectDirectory() {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
      });
      
      if (selected) {
        setDirectory(selected as string);
      }
    } catch (e) {
      setError(String(e));
    }
  }

  function getSortedResults() {
    const sorted = [...searchResults];
    switch (sortBy) {
      case "relevance":
        // マッチ数の多い順
        sorted.sort((a, b) => b.matches.length - a.matches.length);
        break;
      case "date":
        // 更新日時の新しい順
        sorted.sort((a, b) => b.modified - a.modified);
        break;
      case "size":
        // ファイルサイズの大きい順
        sorted.sort((a, b) => b.file_size - a.file_size);
        break;
    }
    return sorted;
  }

  return (
    <main className="container">
      <h1>Findora - ファイル検索ツール</h1>

      <div style={{ marginBottom: "20px" }}>
        <h2>ファイル検索</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            searchFiles();
          }}
        >
          <div style={{ marginBottom: "10px" }}>
            <input
              type="text"
              value={directory}
              onChange={(e) => setDirectory(e.target.value)}
              placeholder="検索対象ディレクトリ（例: /Users/username/Documents）"
              style={{ width: "400px", marginRight: "10px" }}
            />
            <button type="button" onClick={selectDirectory}>
              フォルダを選択
            </button>
          </div>
          <div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="検索キーワード"
              style={{ width: "300px", marginRight: "10px" }}
            />
            <button type="submit" disabled={isSearching || !directory || !searchQuery}>
              {isSearching ? "検索中..." : "検索"}
            </button>
            <label style={{ marginLeft: "20px", fontSize: "14px" }}>
              <input
                type="checkbox"
                checked={caseSensitive}
                onChange={(e) => setCaseSensitive(e.target.checked)}
                style={{ marginRight: "5px" }}
              />
              大文字小文字を区別
            </label>
          </div>
        </form>
        
        <div style={{ marginTop: "10px" }}>
          <button onClick={() => scanDirectory()} disabled={!directory}>
            ディレクトリスキャン（テスト）
          </button>
        </div>
      </div>

      {error && (
        <div style={{ color: "red", marginBottom: "10px" }}>
          エラー: {error}
        </div>
      )}

      {searchResults.length > 0 && (
        <div style={{ marginBottom: "20px" }}>
          <h3>検索結果: {searchResults.length}件のファイルが見つかりました</h3>
          
          {/* ソート */}
          <div style={{ marginBottom: "10px" }}>
            <label>
              並び順: 
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value as "relevance" | "date" | "size")}
                style={{ marginLeft: "10px" }}
              >
                <option value="relevance">関連度順</option>
                <option value="date">更新日時順</option>
                <option value="size">サイズ順</option>
              </select>
            </label>
          </div>
          
          {/* ページネーション */}
          {searchResults.length > itemsPerPage && (
            <div style={{ marginBottom: "10px" }}>
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                前へ
              </button>
              <span style={{ margin: "0 10px" }}>
                ページ {currentPage} / {Math.ceil(searchResults.length / itemsPerPage)}
              </span>
              <button 
                onClick={() => setCurrentPage(p => Math.min(Math.ceil(searchResults.length / itemsPerPage), p + 1))}
                disabled={currentPage === Math.ceil(searchResults.length / itemsPerPage)}
              >
                次へ
              </button>
            </div>
          )}
          
          <div style={{ maxHeight: "400px", overflow: "auto", border: "1px solid #ccc", padding: "10px" }}>
            {console.log("Rendering search results:", searchResults)}
            {getSortedResults()
              .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
              .map((result, index) => {
              console.log("Rendering result:", result);
              return (
              <div key={index} style={{ marginBottom: "20px", borderBottom: "1px solid #eee", paddingBottom: "10px" }}>
                <div style={{ marginBottom: "5px" }}>
                  <strong>{result.file_name}</strong>
                  <button 
                    onClick={() => openFile(result.file_path)}
                    style={{ marginLeft: "10px", fontSize: "12px" }}
                  >
                    ファイルを開く
                  </button>
                  <button 
                    onClick={() => {
                      readFile(result.file_path);
                      setSelectedSearchResult(result);
                    }}
                    style={{ marginLeft: "10px", fontSize: "12px" }}
                  >
                    プレビュー
                  </button>
                </div>
                <div style={{ fontSize: "12px", color: "#666" }}>{result.file_path}</div>
                <div style={{ fontSize: "12px", color: "#666" }}>
                  サイズ: {(result.file_size / 1024).toFixed(1)} KB | 
                  更新日: {new Date(result.modified * 1000).toLocaleString()} | 
                  <strong>マッチ数: {result.matches.length}件</strong>
                </div>
              </div>
            )})}
          </div>
        </div>
      )}

      {files.length > 0 && (
        <div style={{ marginBottom: "20px" }}>
          <h3>スキャン結果（.txt, .md）: {files.length}件</h3>
          <div style={{ maxHeight: "200px", overflow: "auto", border: "1px solid #ccc", padding: "10px" }}>
            {files.map((file, index) => (
              <div key={index} style={{ cursor: "pointer", padding: "2px" }}>
                <a onClick={() => {
                  readFile(file);
                  setSelectedSearchResult(null);
                }} style={{ color: "#0066cc" }}>
                  {file}
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedFile && (
        <div>
          <h3>ファイル内容プレビュー</h3>
          <div style={{ border: "1px solid #ccc", padding: "10px", backgroundColor: "#f5f5f5", color: "black" }}>
            <strong>ファイル名:</strong> {selectedFile.name}<br />
            <strong>パス:</strong> {selectedFile.path}<br />
            
            {selectedSearchResult && (
              <div style={{ marginTop: "10px" }}>
                <strong>検索結果: "{searchQuery}" - {selectedSearchResult.matches.length}件のマッチ</strong>
                <div style={{ maxHeight: "300px", overflow: "auto", marginTop: "10px", backgroundColor: "white", color: "black", padding: "10px", border: "1px solid #ddd" }}>
                  {selectedSearchResult.matches.map((match, index) => (
                    <div key={index} style={{ marginBottom: "15px", paddingBottom: "10px", borderBottom: "1px solid #eee" }}>
                      <div style={{ fontSize: "12px", color: "#666", marginBottom: "5px" }}>
                        行 {match.line_number}:
                      </div>
                      <pre style={{ margin: 0, whiteSpace: "pre-wrap", fontFamily: "monospace", fontSize: "12px", color: "black" }}>
                        {match.context.split('\n').map((line, lineIndex) => {
                          const searchLine = caseSensitive ? line : line.toLowerCase();
                          const searchPattern = caseSensitive ? searchQuery : searchQuery.toLowerCase();
                          const matchIndex = searchLine.indexOf(searchPattern);
                          
                          if (matchIndex !== -1) {
                            return (
                              <div key={lineIndex}>
                                {line.substring(0, matchIndex)}
                                <mark style={{ backgroundColor: "yellow" }}>
                                  {line.substring(matchIndex, matchIndex + searchQuery.length)}
                                </mark>
                                {line.substring(matchIndex + searchQuery.length)}
                              </div>
                            );
                          }
                          return <div key={lineIndex}>{line}</div>;
                        })}
                      </pre>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {!selectedSearchResult && (
              <>
                <strong>内容（最初の200文字）:</strong><br />
                <pre style={{ whiteSpace: "pre-wrap", marginTop: "10px", color: "black" }}>
                  {selectedFile.content_preview}
                </pre>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

export default App;
