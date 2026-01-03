import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from "../../services/firebase";
import { updateCurrentUser } from "firebase/auth";

const QuizCreator = () => {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [batch, setBatch] = useState("Basic");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const [questions, setQuestions] = useState([
    {
      type: "mcq", // mcq | coding
      question: "",
      options: { A: "", B: "", C: "", D: "" },
      correctAnswer: "A",
      codeSnippet: "",
    },
  ]);

  /* ---------------- ADD QUESTION ---------------- */
  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        type: "mcq",
        question: "",
        options: { A: "", B: "", C: "", D: "" },
        correctAnswer: "A",
        codeSnippet: "",
      },
    ]);
  };

  /* ---------------- UPDATE QUESTION ---------------- */
  const updateQuestion = (index, field, value) => {
    const updated = [...questions];
    updated[index][field] = value;
    setQuestions(updated);
  };

  const updateOption = (qIndex, optionKey, value) => {
    const updated = [...questions];
    updated[qIndex].options[optionKey] = value;
    setQuestions(updated);
  };

  /* ---------------- REMOVE QUESTION ---------------- */
  const removeQuestion = (index) => {
    const updated = questions.filter((_, i) => i !== index);
    setQuestions(updated);
  };

  /* ---------------- SUBMIT QUIZ ---------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title || !startTime || !endTime) {
      alert("Please fill all required fields");
      return;
    }

    try {
      await addDoc(collection(db, "quizzes"), {
        title,
        batch,
        startTime: Timestamp.fromDate(new Date(startTime)),
        endTime: Timestamp.fromDate(new Date(endTime)),
        questions,
        createdAt: Timestamp.now(),
        
        "permissions": {},
      });

      alert("Quiz Created Successfully!");
      setTitle("");
      setQuestions([]);
      navigate(-1); // go back after submit
    } catch (error) {
      console.error("Error creating quiz:", error);
      alert("Failed to create quiz");
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto bg-white shadow rounded">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4 mb-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="px-3 py-1 border rounded hover:bg-gray-100"
        >
          ← Back
        </button>
        <h2 className="text-2xl font-bold">Create Quiz   </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Quiz Title */}
        <input
          type="text"
          placeholder="Quiz Title"
          className="w-full p-2 border rounded"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        {/* Batch */}
        <select
          className="w-full p-2 border rounded"
          value={batch}
          onChange={(e) => setBatch(e.target.value)}
        >
          <option value="Basic">Basic</option>
          <option value="Advanced">Advanced</option>
        </select>

        {/* Time */}
        <div className="grid grid-cols-2 gap-4">
          <input
            type="datetime-local"
            className="p-2 border rounded"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
          />
          <input
            type="datetime-local"
            className="p-2 border rounded"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            required
          />
        </div>

        {/* Questions */}
        {questions.map((q, index) => (
          <div key={index} className="border p-4 rounded space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Question {index + 1}</h3>
              <button
                type="button"
                onClick={() => removeQuestion(index)}
                className="text-red-500 text-sm"
              >
                Remove
              </button>
            </div>

            {/* Type */}
            <select
              value={q.type}
              onChange={(e) => updateQuestion(index, "type", e.target.value)}
              className="p-2 border rounded w-full"
            >
              <option value="mcq">MCQ</option>
              <option value="coding">Coding</option>
            </select>

            {/* Question Text */}
            <textarea
              placeholder="Question"
              className="w-full p-2 border rounded"
              value={q.question}
              onChange={(e) => updateQuestion(index, "question", e.target.value)}
            />

            {/* Code Snippet */}
            <textarea
              placeholder="Code Snippet (optional)"
              className="w-full p-2 border rounded font-mono"
              value={q.codeSnippet}
              onChange={(e) => updateQuestion(index, "codeSnippet", e.target.value)}
            />

            {/* MCQ Options */}
            {q.type === "mcq" && (
              <>
                {["A", "B", "C", "D"].map((opt) => (
                  <input
                    key={opt}
                    type="text"
                    placeholder={`Option ${opt}`}
                    className="w-full p-2 border rounded"
                    value={q.options[opt]}
                    onChange={(e) => updateOption(index, opt, e.target.value)}
                  />
                ))}

                <select
                  className="p-2 border rounded w-full"
                  value={q.correctAnswer}
                  onChange={(e) => updateQuestion(index, "correctAnswer", e.target.value)}
                >
                  <option value="A">Correct: A</option>
                  <option value="B">Correct: B</option>
                  <option value="C">Correct: C</option>
                  <option value="D">Correct: D</option>
                </select>
              </>
            )}
          </div>
        ))}

        {/* Buttons */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={addQuestion}
            className="px-4 py-2 bg-gray-200 rounded"
          >
            Add Question
          </button>

          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded"
          >
            Publish Quiz
          </button>
        </div>
      </form>
    </div>
  );
};

export default QuizCreator;