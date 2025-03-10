import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import "./App.css";
import ReviewAnswersPopup from "./ReviewAnswersPopup";
import ReportPopup from "./ReportPopup";

const Chatbot = () => {
  const [messages, setMessages] = useState(() =>
    JSON.parse(localStorage.getItem("chatMessages")) || [
      {
        text: "Hi, I am an AI Opportunity Audit bot by Balmer Agency - if you answer a few questions for me I can provide an evaluation on your business.",
        sender: "bot",
      },
    ]
  );
  const [fixedMessages, setFixedMessages] = useState(() =>
    JSON.parse(localStorage.getItem("fixedMessages")) || []
  );
  const [userInput, setUserInput] = useState("");
  const [questionIndex, setQuestionIndex] = useState(() =>
    JSON.parse(localStorage.getItem("questionIndex")) || null
  );
  const [email, setEmail] = useState(() => localStorage.getItem("userEmail") || "");
  const [answers, setAnswers] = useState(() => JSON.parse(localStorage.getItem("answers")) || {});
  const [isTyping, setIsTyping] = useState(false);
  const [initialised, setInitialised] = useState(false);
  const [conMessage, setConMessage] = useState("");
  const [exampleAnswers, setExampleAnswers] = useState(() =>
    JSON.parse(localStorage.getItem("exampleAnswers")) || []
  );
  const [reportData, setReportData] = useState(() => JSON.parse(localStorage.getItem("reportData")) || null);
  const [showReportPopup, setShowReportPopup] = useState(false); // New state to toggle popup
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const numOfQuestions = 15;
  const progressPercentage =
    questionIndex > 2 ? Math.round(((questionIndex - 2) / numOfQuestions) * 100) : 0;

  useEffect(() => {
    inputRef.current.focus();
  }, []);

  useEffect(() => {
    localStorage.setItem("chatMessages", JSON.stringify(messages));
    localStorage.setItem("questionIndex", JSON.stringify(questionIndex));
    localStorage.setItem("userEmail", email);
    localStorage.setItem("answers", JSON.stringify(answers));
    localStorage.setItem("fixedMessages", JSON.stringify(fixedMessages));
    localStorage.setItem("exampleAnswers", JSON.stringify(exampleAnswers));
    localStorage.setItem("reportData", JSON.stringify(reportData));
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, questionIndex, email, answers, fixedMessages, exampleAnswers, reportData]);

  const sendToN8N = async (data) => {
    const response = await fetch(
      "https://liamalbrecht.app.n8n.cloud/webhook/d0cfdecc-b7a5-4938-b299-e6bd10a980cd",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }
    );
    return response.json();
  };

  const sendSubmitToN8N = async (email) => {
    const response = await fetch(
      "https://liamalbrecht.app.n8n.cloud/webhook/25e0bbd0-a49d-4106-b4e3-973ecb98f202",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      }
    );
    return response.json();
  };

  const sendConfirmationToN8N = async (text) => {
    const response = await fetch(
      "https://liamalbrecht.app.n8n.cloud/webhook/f7c8632e-d2e5-4192-8129-b9b7f63f79ee",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      }
    );
    return response.json();
  };

  const handleSend = async () => {
    if (!userInput.trim()) return;

    setMessages((prev) => [...prev, { text: userInput, sender: "user" }]);
    setUserInput("");
    setExampleAnswers([]);

    let tempConMessage = "";
    if (!initialised) {
      setIsTyping(true);
      const confirmation = await sendConfirmationToN8N(userInput);

      if (confirmation.text) {
        setConMessage(confirmation.text);
        tempConMessage = confirmation.text;

        if (confirmation.text.toLowerCase().includes("yes")) {
          setInitialised(true);
        }
      }

      if (userInput.includes("?")) {
        setMessages((prev) => [
          ...prev,
          {
            text: "Great question! This survey helps assess the AI readiness of your business. It takes about 5-10 minutes. Let me know if you need more info. If you're ready, just say 'yes'!",
            sender: "bot",
          },
        ]);
        setIsTyping(false);
        return;
      }
    }

    if (!initialised && messages.length === 1) {
      setMessages((prev) => [
        ...prev,
        {
          text: "Welcome! This survey will take around 5-10 minutes and helps assess the AI readiness of your business. If you have any questions about the process, feel free to ask! Otherwise, type 'yes' to begin.",
          sender: "bot",
        },
      ]);
      setIsTyping(false);
      return;
    }

    if ((conMessage.includes("yes") || tempConMessage.includes("yes")) && questionIndex === null) {
      setIsTyping(true);
      const data = await sendToN8N({ questionIndex: 1 });

      if (data.question) {
        setIsTyping(false);
        setQuestionIndex(1);
        setMessages((prev) => [...prev, { text: data.question, sender: "bot" }]);
        if (data.example_answers) setExampleAnswers(data.example_answers);
      }
    } else if (questionIndex !== null) {
      const nextIndex = questionIndex + 1;

      if (nextIndex === 2) {
        if (!userInput.includes("@")) {
          setMessages((prev) => [
            ...prev,
            { text: "Please provide a valid email address before continuing.", sender: "bot" },
          ]);
          setIsTyping(false);
          return;
        }
        setEmail(userInput);
      }

      setAnswers((prev) => ({ ...prev, [questionIndex]: userInput }));
      setIsTyping(true);

      const data = await sendToN8N({
        questionIndex: nextIndex,
        answer: userInput,
        email: nextIndex === 2 ? userInput : email,
      });

      if (data.question) {
        setIsTyping(false);
        setMessages((prev) => [...prev, { text: data.question, sender: "bot" }]);
        setQuestionIndex(nextIndex);
        if (data.example_answers) setExampleAnswers(data.example_answers);
        else setExampleAnswers([]);
      }

      if (data.fixedQuestion) {
        setIsTyping(false);
        setFixedMessages((prev) => [...prev, { text: data.fixedQuestion }]);
      }

      if (data.question && data.question.includes("Fantastic, that should be it!")) {
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            text: "In order to generate your report, please review your answers first by clicking 'Review Answers' below.",
            sender: "bot",
          },
        ]);
        setExampleAnswers([]);
      }
    } else {
      const lowerInput = userInput.toLowerCase();
      if (["hello", "hi", "hey"].some((greeting) => lowerInput.startsWith(greeting))) {
        setMessages((prev) => [
          ...prev,
          { text: "Hey there! This survey takes about 5-10 minutes. Let me know if you have any questions before we start! Otherwise, type 'yes' to begin.", sender: "bot" },
        ]);
      } else if (lowerInput.includes("not sure") || lowerInput.includes("maybe")) {
        setMessages((prev) => [
          ...prev,
          { text: "No worries! Take your time, let me know when you're ready.", sender: "bot" },
        ]);
      } else if (lowerInput.includes("What's this about?")) {
        setMessages((prev) => [
          ...prev,
          { text: "That's a great question! This survey helps assess [survey purpose]. It should only take about 5-10 minutes. Let me know if you need more details!", sender: "bot" },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { text: "I see! Could you clarify if you're ready to start the survey?", sender: "bot" },
        ]);
      }
      setIsTyping(false);
    }

    inputRef.current.focus();
  };

  const handleExampleAnswerClick = async (answer) => {
    setMessages((prev) => [...prev, { text: answer, sender: "user" }]);
    setUserInput("");
    setExampleAnswers([]);

    const nextIndex = questionIndex + 1;

    if (nextIndex === 2) {
      if (!answer.includes("@")) {
        setMessages((prev) => [
          ...prev,
          { text: "Please provide a valid email address before continuing.", sender: "bot" },
        ]);
        return;
      }
      setEmail(answer);
    }

    setAnswers((prev) => ({ ...prev, [questionIndex]: answer }));
    setIsTyping(true);

    const data = await sendToN8N({
      questionIndex: nextIndex,
      answer: answer,
      email: nextIndex === 2 ? answer : email,
    });

    if (data.question) {
      setIsTyping(false);
      setMessages((prev) => [...prev, { text: data.question, sender: "bot" }]);
      setQuestionIndex(nextIndex);
      if (data.example_answers) setExampleAnswers(data.example_answers);
      else setExampleAnswers([]);
    }

    if (data.fixedQuestion) {
      setIsTyping(false);
      setFixedMessages((prev) => [...prev, { text: data.fixedQuestion }]);
    }

    if (data.question && data.question.includes("Fantastic, that should be it!")) {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          text: "In order to generate your report, please review your answers first by clicking 'Review Answers' below.",
          sender: "bot",
        },
      ]);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      handleSend();
    }
  };

  const restartChat = () => {
    localStorage.clear();
    setMessages([
      {
        text: "Hi, I am an AI Opportunity Audit bot by Balmer Agency - if you answer a few questions for me I can provide an evaluation on your business.",
        sender: "bot",
      },
    ]);
    setQuestionIndex(null);
    setEmail("");
    setAnswers({});
    setFixedMessages([]);
    setInitialised(false);
    setConMessage("");
    setExampleAnswers([]);
    setReportData(null);
    setShowReportPopup(false);
  };

  const handleFirstClose = () => {
    setMessages((prev) => [
      ...prev,
      { text: "Are you ready to generate your report?", sender: "bot" },
      { text: "", sender: "submit_button" },
    ]);
  };

  const handleSubmit = async () => {
    if (!email) {
      setMessages((prev) => [
        ...prev,
        { text: "No email provided. Please provide an email before continuing.", sender: "bot" },
      ]);
      return;
    }

    setIsTyping(true);
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, 50);

    try {
      const data = await sendSubmitToN8N(email);
      setIsTyping(false);
      if (data.result && Array.isArray(data.result)) {
        setReportData(data.result); // Set the report data but don't show popup
        setMessages((prev) => [
          ...prev,
          { text: "Your report is ready! Click 'View Report' to see it.", sender: "bot" },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { text: "Error: Invalid report format received.", sender: "bot" },
        ]);
      }
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    } catch (error) {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        { text: "Error submitting answers. Please try again.", sender: "bot" },
      ]);
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
      console.error("Submit error:", error);
    }
  };

  const handleViewReport = () => {
    if (reportData) {
      setShowReportPopup(true); // Show the popup
    }
  };

  return (
    <div className="chat-container">
      <div className="particle"></div>
      <div className="particle"></div>
      <div className="particle"></div>
      <div className="particle"></div>
      <div className="particle"></div>
      <div className="particle"></div>
      <div className="particle"></div>
      <div className="particle"></div>
      <div className="particle"></div>
      <div className="particle"></div>
      <div className="particle"></div>
      <div className="particle"></div>
      <div className="particle"></div>
      <div className="particle"></div>
      <div className="particle"></div>
      <div className="particle"></div>
      <div className="particle"></div>
      <div className="particle"></div>
      <div className="particle"></div>
      <h1>BALMER AGENCY</h1>
      <p>AI Business Acceleration Bot</p>
      <div className="chat-box">
        <div className="progress-bar-container">
          <div className="progress-bar" style={{ width: `${progressPercentage}%` }} />
        </div>
        <div className="messages">
          {messages.map((msg, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`message ${
                msg.sender === "bot"
                  ? "bot-message"
                  : msg.sender === "submit_button"
                  ? "submit-button-container"
                  : "user-message"
              }`}
            >
              {msg.sender === "submit_button" ? (
                <button className="submit_button" onClick={handleSubmit}>
                  GENERATE<img src="/Group 1.png" alt="Arrow" className="arrow-icon"/>
                </button>
              ) : (
                msg.text
              )}
            </motion.div>
          ))}
          {exampleAnswers.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="example-answers-container"
            >
              <div className="example-answers-label">Suggestions:</div>
              {exampleAnswers.map((answer, idx) => (
                <button
                  key={idx}
                  className="example-answer-button"
                  onClick={() => handleExampleAnswerClick(answer)}
                >
                  {answer}
                </button>
              ))}
            </motion.div>
          )}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="message bot-message"
            >
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} style={{ height: "1px" }} />
        </div>
        <div className="input-container">
          <input
            ref={inputRef}
            type="text"
            className="input-box"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type here..."
          />
          <button className="send-button" onClick={handleSend}>
            SEND<img src="/Group 1.png" alt="Arrow" className="arrow-icon"/>
          </button>
        </div>
        <div className="restart_button_container">
          <button className="restart_button" onClick={restartChat}>
            Restart<img src="/Group 2.png" alt="Arrow" className="arrow-icon2"/>
          </button>
          {messages.some((msg) =>
            msg.text.includes(
              "In order to generate your report, please review your answers first by clicking 'Review Answers' below."
            )
          ) && (
            <ReviewAnswersPopup
              messages={messages}
              answers={answers}
              email={email}
              fixedMessages={fixedMessages}
              updateAnswers={setAnswers}
              updateEmail={setEmail}
              onFirstClose={handleFirstClose}
            />
          )}
          {reportData && (
            <button className="view_report_button" onClick={handleViewReport}>
              View Report<img src="/Group 1.png" alt="Arrow" className="arrow-icon"/>
            </button>
          )}
          {showReportPopup && reportData && (
            <ReportPopup reportData={reportData} onClose={() => setShowReportPopup(false)} />
          )}
        </div>
      </div>
    </div>
  );
};

export default Chatbot;