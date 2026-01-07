"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Header from "../../../../components/Header";
import { getSupabaseBrowser } from "../../../../lib/supabase-browser";

// Dynamic import for Monaco to prevent SSR issues
const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

interface FileNode {
  name: string;
  path: string;
  type: "file" | "folder";
  children?: FileNode[];
  content?: string;
}

// Mock file structure (in production, this would come from the exported project)
const mockFileTree: FileNode[] = [
  {
    name: "app",
    path: "app",
    type: "folder",
    children: [
      {
        name: "_layout.tsx",
        path: "app/_layout.tsx",
        type: "file",
        content: `import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}`
      },
      {
        name: "index.tsx",
        path: "app/index.tsx",
        type: "file",
        content: `import { View, Text, StyleSheet } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Your App</Text>
      <Text style={styles.subtitle}>Built with OkapiLaunch AI</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e1b4b',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 8,
  },
});`
      }
    ]
  },
  {
    name: "package.json",
    path: "package.json",
    type: "file",
    content: `{
  "name": "my-app",
  "version": "1.0.0",
  "main": "expo-router/entry",
  "scripts": {
    "start": "expo start",
    "ios": "expo start --ios",
    "android": "expo start --android"
  },
  "dependencies": {
    "expo": "~52.0.0",
    "expo-router": "~4.0.0",
    "react": "18.3.1",
    "react-native": "0.76.0"
  }
}`
  },
  {
    name: "app.json",
    path: "app.json",
    type: "file",
    content: `{
  "expo": {
    "name": "My App",
    "slug": "my-app",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.example.myapp"
    }
  }
}`
  }
];

export default function EditorPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  const [project, setProject] = useState<any>(null);
  const [subscription, setSubscription] = useState<{ plan: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [fileContent, setFileContent] = useState("");
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(["app"]));

  useEffect(() => {
    loadProject();
    loadSubscription();
  }, [projectId]);

  async function loadProject() {
    const supabase = getSupabaseBrowser();
    const { data } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (data) {
      setProject(data);
      // Select first file by default
      const firstFile = findFirstFile(mockFileTree);
      if (firstFile) {
        setSelectedFile(firstFile);
        setFileContent(firstFile.content || "");
      }
    }
    setLoading(false);
  }

  async function loadSubscription() {
    try {
      const res = await fetch("/api/usage");
      if (res.ok) {
        const data = await res.json();
        setSubscription(data.subscription);
      }
    } catch (e) {
      console.error("Failed to load subscription:", e);
    }
  }

  function findFirstFile(nodes: FileNode[]): FileNode | null {
    for (const node of nodes) {
      if (node.type === "file") return node;
      if (node.children) {
        const found = findFirstFile(node.children);
        if (found) return found;
      }
    }
    return null;
  }

  function toggleFolder(path: string) {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  }

  function selectFile(file: FileNode) {
    if (unsavedChanges) {
      if (!confirm("You have unsaved changes. Discard them?")) return;
    }
    setSelectedFile(file);
    setFileContent(file.content || "");
    setUnsavedChanges(false);
  }

  function handleEditorChange(value: string | undefined) {
    setFileContent(value || "");
    setUnsavedChanges(true);
  }

  function saveFile() {
    // In production, this would save to the project's storage
    if (selectedFile) {
      selectedFile.content = fileContent;
      setUnsavedChanges(false);
      alert("Changes saved! (In production, this would update the project files)");
    }
  }

  function getLanguage(filename: string): string {
    if (filename.endsWith(".tsx") || filename.endsWith(".ts")) return "typescript";
    if (filename.endsWith(".jsx") || filename.endsWith(".js")) return "javascript";
    if (filename.endsWith(".json")) return "json";
    if (filename.endsWith(".md")) return "markdown";
    if (filename.endsWith(".css")) return "css";
    return "plaintext";
  }

  const isPro = subscription?.plan === "pro" || subscription?.plan === "team";

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#0d1117" }}>
        <Header />
        <div style={{ padding: 40, textAlign: "center", color: "#8b949e" }}>
          Loading editor...
        </div>
      </div>
    );
  }

  if (!isPro) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>
        <Header />
        <div style={{ maxWidth: 500, margin: "0 auto", padding: "80px 20px", textAlign: "center" }}>
          <div
            style={{
              width: 80,
              height: 80,
              margin: "0 auto 24px",
              borderRadius: "50%",
              backgroundColor: "#fef3c7",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2">
              <path d="M12 15v2m0 0v2m0-2h2m-2 0H10m9.364-7.364l-3.182 3.182M3 17.636l3.182-3.182m0-5.09L3 6.182m18 5.09l-3.182 3.364M12 2v2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 style={{ margin: 0, fontSize: 28, color: "#1e1b4b" }}>Code Editor - Pro Feature</h1>
          <p style={{ color: "#6b7280", fontSize: 16, marginTop: 12, marginBottom: 32 }}>
            The in-app code editor is available on Pro and Team plans. Edit your app's code directly in the browser.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <Link
              href="/pricing"
              style={{
                padding: "14px 28px",
                background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                color: "#fff",
                borderRadius: 10,
                textDecoration: "none",
                fontWeight: 600
              }}
            >
              Upgrade to Pro
            </Link>
            <Link
              href={`/projects/${projectId}`}
              style={{
                padding: "14px 28px",
                backgroundColor: "#fff",
                color: "#374151",
                border: "1px solid #e5e7eb",
                borderRadius: 10,
                textDecoration: "none",
                fontWeight: 500
              }}
            >
              Back to Project
            </Link>
          </div>
        </div>
      </div>
    );
  }

  function renderFileTree(nodes: FileNode[], depth = 0) {
    return nodes.map((node) => (
      <div key={node.path}>
        <div
          onClick={() => node.type === "folder" ? toggleFolder(node.path) : selectFile(node)}
          style={{
            padding: "6px 12px",
            paddingLeft: 12 + depth * 16,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
            backgroundColor: selectedFile?.path === node.path ? "#1f2937" : "transparent",
            color: selectedFile?.path === node.path ? "#fff" : "#8b949e",
            borderLeft: selectedFile?.path === node.path ? "2px solid #6366f1" : "2px solid transparent"
          }}
        >
          {node.type === "folder" ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {expandedFolders.has(node.path) ? (
                  <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round"/>
                ) : (
                  <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
                )}
              </svg>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#6366f1" stroke="none">
                <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
              </svg>
            </>
          ) : (
            <>
              <span style={{ width: 14 }}></span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </>
          )}
          <span style={{ fontSize: 13 }}>{node.name}</span>
        </div>
        {node.type === "folder" && node.children && expandedFolders.has(node.path) && (
          <div>{renderFileTree(node.children, depth + 1)}</div>
        )}
      </div>
    ));
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0d1117", display: "flex", flexDirection: "column" }}>
      {/* Editor Header */}
      <div
        style={{
          padding: "10px 16px",
          backgroundColor: "#161b22",
          borderBottom: "1px solid #30363d",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Link
            href={`/projects/${projectId}`}
            style={{ color: "#8b949e", textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back
          </Link>
          <span style={{ color: "#f0f6fc", fontWeight: 600 }}>{project?.name}</span>
          {selectedFile && (
            <span style={{ color: "#8b949e", fontSize: 14 }}>
              / {selectedFile.path}
              {unsavedChanges && <span style={{ color: "#f97316" }}> (unsaved)</span>}
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={saveFile}
            disabled={!unsavedChanges}
            style={{
              padding: "6px 16px",
              backgroundColor: unsavedChanges ? "#238636" : "#21262d",
              color: unsavedChanges ? "#fff" : "#8b949e",
              border: "1px solid",
              borderColor: unsavedChanges ? "#238636" : "#30363d",
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 500,
              cursor: unsavedChanges ? "pointer" : "default"
            }}
          >
            Save
          </button>
          <button
            onClick={() => alert("Build functionality coming soon!")}
            style={{
              padding: "6px 16px",
              backgroundColor: "#6366f1",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer"
            }}
          >
            Build & Preview
          </button>
        </div>
      </div>

      {/* Editor Body */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* File Tree */}
        <div
          style={{
            width: 240,
            backgroundColor: "#0d1117",
            borderRight: "1px solid #30363d",
            overflowY: "auto"
          }}
        >
          <div style={{ padding: "12px 16px", borderBottom: "1px solid #30363d" }}>
            <span style={{ color: "#f0f6fc", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Explorer
            </span>
          </div>
          <div style={{ paddingTop: 8 }}>
            {renderFileTree(mockFileTree)}
          </div>
        </div>

        {/* Editor */}
        <div style={{ flex: 1 }}>
          {selectedFile ? (
            <Editor
              height="100%"
              language={getLanguage(selectedFile.name)}
              value={fileContent}
              onChange={handleEditorChange}
              theme="vs-dark"
              options={{
                minimap: { enabled: true },
                fontSize: 14,
                lineNumbers: "on",
                wordWrap: "on",
                automaticLayout: true,
                scrollBeyondLastLine: false,
                padding: { top: 16 }
              }}
            />
          ) : (
            <div style={{ padding: 40, textAlign: "center", color: "#8b949e" }}>
              Select a file to edit
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
