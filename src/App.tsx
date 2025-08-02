import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

interface FileInfo {
  path: string;
  name: string;
  content_preview: string;
}

function App() {
  const [directory, setDirectory] = useState("");
  const [files, setFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null);
  const [error, setError] = useState("");

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

  return (
    <main className="container">
      <h1>Findora - ファイル検索ツール（テスト版）</h1>

      <div style={{ marginBottom: "20px" }}>
        <h2>ディレクトリスキャンテスト</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            scanDirectory();
          }}
        >
          <input
            type="text"
            value={directory}
            onChange={(e) => setDirectory(e.target.value)}
            placeholder="ディレクトリパスを入力（例: /Users/username/Documents）"
            style={{ width: "400px", marginRight: "10px" }}
          />
          <button type="submit">スキャン</button>
        </form>
      </div>

      {error && (
        <div style={{ color: "red", marginBottom: "10px" }}>
          エラー: {error}
        </div>
      )}

      {files.length > 0 && (
        <div style={{ marginBottom: "20px" }}>
          <h3>見つかったファイル（.txt, .md）: {files.length}件</h3>
          <div style={{ maxHeight: "200px", overflow: "auto", border: "1px solid #ccc", padding: "10px" }}>
            {files.map((file, index) => (
              <div key={index} style={{ cursor: "pointer", padding: "2px" }}>
                <a onClick={() => readFile(file)} style={{ color: "#0066cc" }}>
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
          <div style={{ border: "1px solid #ccc", padding: "10px", backgroundColor: "#f5f5f5" }}>
            <strong>ファイル名:</strong> {selectedFile.name}<br />
            <strong>パス:</strong> {selectedFile.path}<br />
            <strong>内容（最初の200文字）:</strong><br />
            <pre style={{ whiteSpace: "pre-wrap", marginTop: "10px" }}>
              {selectedFile.content_preview}
            </pre>
          </div>
        </div>
      )}
    </main>
  );
}

export default App;
