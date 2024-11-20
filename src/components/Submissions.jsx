import React, { useState } from "react";
import axios from "axios";
import { Controlled as ControlledEditor } from "react-codemirror2"; // Import the React wrapper
import "codemirror/lib/codemirror.css"; // Import the necessary CodeMirror styles
import "codemirror/theme/material.css"; // Import the material dark theme
import { python } from "@codemirror/lang-python"; // Import the Python mode (adjust this based on your needs)
import { onBackgroundMessage } from "firebase/messaging/sw";

const Submissions = () => {
  const [code, setCode] = useState(""); // Store the code input
  const [languageId, setLanguageId] = useState("71"); // Default to Python
  const [output, setOutput] = useState(""); // Store the output
  const [loading, setLoading] = useState(false); // Track the loading state

  // Submit the code to RapidAPI Judge0
  const submitCode = async () => {
    setLoading(true);
    setOutput(""); // Reset output before submitting new code

    try {
      // Send code to RapidAPI Judge0 for execution
      const response = await axios.post(
        "https://judge0-ce.p.rapidapi.com/submissions", // Judge0 endpoint on RapidAPI
        {
          source_code: code,
          language_id: languageId,
        },
        {
          headers: {
            "Content-Type": "application/json",
            "x-rapidapi-key":
              "54bf880227msh38c9ae1d83225f7p190680jsn71d26bfd832e", // Your RapidAPI Key
            "x-rapidapi-host": "judge0-ce.p.rapidapi.com", // Judge0 API Host
          },
        }
      );

      // Get the token from the response
      const { token } = response.data;

      // Poll the status of the code execution
      const result = await pollSubmission(token);
      // Update the output based on the result
      setOutput(result.stdout || result.stderr || "No output");
    } catch (error) {
      console.error("Error submitting code:", error);
      setOutput("An error occurred while submitting the code.");
    } finally {
      setLoading(false);
    }
  };

  // Poll the RapidAPI Judge0 to check the status of the code execution
  const pollSubmission = async (token) => {
    let result = null;

    while (!result || result.status.id < 3) {
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait for 2 seconds before polling again

      const response = await axios.get(
        `https://judge0-ce.p.rapidapi.com/submissions/${token}`, // Judge0 endpoint on RapidAPI
        {
          headers: {
            "x-rapidapi-key": import.meta.env.VITE_FIREBASE_RAPID_API_KEY, // Your RapidAPI Key
            "x-rapidapi-host": "judge0-ce.p.rapidapi.com", // Judge0 API Host
          },
        }
      );
      result = response.data;
    }

    return result; // Return the result once it's finished
  };

  return (
    <div className="main-container">
      {" "}
      <div className="settings">
        <select
          value={languageId}
          onChange={(e) => setLanguageId(e.target.value)}
        >
          <option value="71">Python</option>
          <option value="54">C++</option>
          <option value="62">Java</option>
          {/* Add more languages as needed */}
        </select>{" "}
        <button onClick={submitCode} disabled={loading}>
          {loading ? "Judging..." : "Submit"}
        </button>
        <h3>Output</h3>
      </div>
      {/* Submit button */}
      <div className="left-container">
        {" "}
        <ControlledEditor
          value={code}
          onBeforeChange={(editor, data, value) => setCode(value)} // Update the code state as the user types
          options={{
            mode: python, // Set the language mode to Python
            theme: "material", // Set the theme to material (dark theme)
            lineNumbers: true, // Show line numbers
            indentUnit: 4, // Set indentation to 4 spaces
            matchBrackets: true, // Enable bracket matching
            autoCloseBrackets: true, // Enable auto-closing of brackets
            viewportMargin: Infinity, // Smooth scrolling
          }}
        />{" "}
        <div>
          <ControlledEditor value={output} />
        </div>
      </div>
    </div>
  );
};

export default Submissions;
