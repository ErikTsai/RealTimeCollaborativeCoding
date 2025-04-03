"use client"; // Monaco Editor interacts with the DOM directly

import Editor, { OnChange, OnMount } from "@monaco-editor/react";
import type * as monaco from "monaco-editor";
import { useState, useRef } from "react"; // useRef can be useful for editor instance

interface CodeEditorProps {
  initialCode?: string;
  language?: string;
  // Add props for handling changes later (e.g., onCodeChange based on OT)
  // onCodeChange?: (value: string | undefined, event: monaco.editor.IModelContentChangedEvent) => void;
  readOnly?: boolean;
}

export default function CodeEditor({
  initialCode = "// Start typing your code here...\n",
  language = "javascript", // Default language
  readOnly = false,
}: CodeEditorProps) {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  // State to hold the current code value (can be driven by OT later)
  const [code, setCode] = useState<string>(initialCode);

  const handleEditorDidMount: OnMount = (editor, _monaco) => {
    editorRef.current = editor;
    // You can add editor configurations here
    // Example: editor.focus();
    console.log("Monaco Editor Mounted");
  };

  // This basic handler just updates local state.
  // In a real collab editor, this would generate and emit an OT operation.
  const handleEditorChange: OnChange = (value, _event) => {
    console.log("Editor content changed:", value);
    setCode(value || "");
    // Later: Call prop like onCodeChange(value, event) to process OT
  };

  return (
    <div className="w-full h-full border rounded-md overflow-hidden">
      {" "}
      {/* Basic container */}
      <Editor
        // height="90vh" // Or manage height via parent container
        // width="100%"
        language={language}
        theme="vs-dark" // Or "light", or load custom themes
        value={code} // Controlled component
        defaultValue={initialCode} // Use defaultValue if uncontrolled initially
        options={{
          minimap: { enabled: true },
          fontSize: 14,
          wordWrap: "on", // Useful for readability
          readOnly: readOnly, // Set based on props
          scrollBeyondLastLine: false,
          // Add other Monaco options as needed
        }}
        onMount={handleEditorDidMount}
        onChange={handleEditorChange} // Hook up the change handler
      />
    </div>
  );
}
