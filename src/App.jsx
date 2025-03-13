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
  const [exampleAnswers, setExampleAnswers] = useState(() =>
    JSON.parse(localStorage.getItem("exampleAnswers")) || []
  );
  const [reportData, setReportData] = useState(() => JSON.parse(localStorage.getItem("reportData")) || null);
  const [showReportPopup, setShowReportPopup] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [borderGlowData, setBorderGlowData] = useState({
    isActive: false,
    border: null,
    position: 0,
  });

  const [lastSurveyQuestionIndex, setLastSurveyQuestionIndex] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const chatBoxRef = useRef(null);
  const circleTextRef = useRef(null);

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
    localStorage.setItem("lastSurveyQuestionIndex", JSON.stringify(lastSurveyQuestionIndex));
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, questionIndex, email, answers, fixedMessages, exampleAnswers, reportData, lastSurveyQuestionIndex]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!chatBoxRef.current) return;

      const box = chatBoxRef.current.getBoundingClientRect();
      const x = e.clientX - box.left;
      const y = e.clientY - box.top;

      setMousePosition({ x, y });

      const distToLeft = x;
      const distToRight = box.width - x;
      const distToTop = y;
      const distToBottom = box.height - y;

      const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom);
      const borderThreshold = 50;

      if (minDist < borderThreshold) {
        let closestBorder;
        let relativePosition;

        if (minDist === distToLeft) {
          closestBorder = "left";
          relativePosition = y / box.height;
        } else if (minDist === distToRight) {
          closestBorder = "right";
          relativePosition = y / box.height;
        } else if (minDist === distToTop) {
          closestBorder = "top";
          relativePosition = x / box.width;
        } else {
          closestBorder = "bottom";
          relativePosition = x / box.width;
        }

        setBorderGlowData({
          isActive: true,
          border: closestBorder,
          position: relativePosition,
        });
      } else {
        setBorderGlowData({
          isActive: false,
          border: null,
          position: 0,
        });
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    return () => document.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    const textElement = circleTextRef.current;
    if (!textElement) return;

    const text = textElement.textContent || "ROTATING CIRCLE TEXT";
    const characters = text.split("");
    const radius = 30; // Smaller fixed radius to reduce space between characters
    const angleIncrement = 360 / characters.length;

    textElement.innerHTML = "";

    characters.forEach((char, index) => {
      const span = document.createElement("span");
      span.textContent = char === " " ? "\u00A0" : char;
      const angle = angleIncrement * index;
      span.style.transform = `rotate(${angle}deg) translate(0, -${radius}px)`;
      textElement.appendChild(span);
    });
  }, []);
  
  const sendToChatN8N = async (data) => {

    const response = await fetch(
      "https://liamalbrecht.app.n8n.cloud/webhook/15695c64-0d39-4362-82be-7c9e73f1de4f", // Replace with your actual chat webhook URL
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

  const handleSend = async () => {
    if (!userInput.trim()) return;
  
    setMessages((prev) => [...prev, { text: userInput, sender: "user" }]);
    setUserInput("");
    setExampleAnswers([]);
    setIsTyping(true);
  
    const currentFixedQuestion = fixedMessages.length > 0 ? fixedMessages[fixedMessages.length - 1].text : "";
    const lastBotMessage = messages
      .filter((msg) => msg.sender === "bot")
      .slice(-1)[0]?.text || "";
  
    // Email validation before sending to n8n when questionIndex is 1
    let emailInput = ""
    if (questionIndex === 1) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Basic email validation
      if (!emailRegex.test(userInput)) {
        setMessages((prev) => [
          ...prev,
          { text: "Please provide a valid email address (e.g., example@domain.com) before continuing or asking any questions.", sender: "bot" },
        ]);
        setIsTyping(false);
        inputRef.current.focus();
        return; // Stop here; don’t proceed to n8n
      }
      setEmail(userInput);
      emailInput = userInput
    }

    let emailToSend = ""
    if(!email) {
      emailToSend = emailInput
    }else {
      emailToSend = email
    }
  
    // Proceed to n8n if email is valid or not question 2
    const chatData = await sendToChatN8N({
      userInput,
      questionIndex,
      emailToSend,
      answers,
      lastSurveyQuestionIndex,
      currentFixedQuestion,
      lastBotMessage,
      initialised,
    });
  
    setIsTyping(false);
  
    if (chatData.text) {
      setMessages((prev) => [...prev, { text: chatData.text, sender: "bot" }]);
  
      if (!chatData.isDeviatedAnswer) {
        let nextIndex;
  
        if (questionIndex === null) {
          nextIndex = 1;
        } else {
          nextIndex = questionIndex + 1;
        }
  
        // Update survey state
        setAnswers((prev) => ({ ...prev, [questionIndex]: userInput }));
        setQuestionIndex(nextIndex);
        setLastSurveyQuestionIndex(nextIndex);
        setInitialised(true);
  
        if (chatData.example_answers) setExampleAnswers(chatData.example_answers);
        else setExampleAnswers([]);
  
        if (chatData.fixedQuestion) {
          setFixedMessages((prev) => [...prev, { text: chatData.fixedQuestion }]);
        }
  
        if (chatData.text.includes("Fantastic, that should be it!")) {
          setMessages((prev) => [
            ...prev,
            {
              text: "In order to generate your report, please review your answers first by clicking 'Review Answers' below.",
              sender: "bot",
            },
          ]);
          setExampleAnswers([]);
        }
      }
    }
  
    inputRef.current.focus();
  };

  const handleExampleAnswerClick = async (answer) => {
    setMessages((prev) => [...prev, { text: answer, sender: "user" }]);
    setUserInput("");
    setExampleAnswers([]);
    setIsTyping(true);

    // Get the current fixed question from fixedMessages (last element)
    const currentFixedQuestion = fixedMessages.length > 0 ? fixedMessages[fixedMessages.length - 1].text : "";
    
    // Get the most recent bot message from messages
    const lastBotMessage = messages
      .filter((msg) => msg.sender === "bot")
      .slice(-1)[0]?.text || "";

    // Send example answer to the chat workflow (deviation handler)
    const chatData = await sendToChatN8N({
      userInput: answer,
      questionIndex,
      email,
      answers,
      lastSurveyQuestionIndex,
      currentFixedQuestion,
      lastBotMessage,
      initialised,
    });

    setIsTyping(false);

    if (chatData.text) {
      setMessages((prev) => [...prev, { text: chatData.text, sender: "bot" }]);

      // Handle survey logic only if isDeviatedAnswer is false
      if (!chatData.isDeviatedAnswer) {
        const nextIndex = chatData.questionIndex || questionIndex + 1;

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
        setQuestionIndex(nextIndex);
        setLastSurveyQuestionIndex(nextIndex);

        if (chatData.example_answers) setExampleAnswers(chatData.example_answers);
        else setExampleAnswers([]);

        if (chatData.fixedQuestion) {
          setFixedMessages((prev) => [...prev, { text: chatData.fixedQuestion }]);
        }

        if (chatData.text.includes("Fantastic, that should be it!")) {
          setMessages((prev) => [
            ...prev,
            {
              text: "In order to generate your report, please review your answers first by clicking 'Review Answers' below.",
              sender: "bot",
            },
          ]);
        }
      }
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
    setExampleAnswers([]);
    setReportData(null);
    setShowReportPopup(false);
    setLastSurveyQuestionIndex(null);
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
        setReportData(data.result);
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
      setShowReportPopup(true);
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
      <div className="background-grid">
        <img src="/balmer_background.jpg" alt="Background 1" className="background-image large-image" />
        <img src="/balmer_background2.jpg" alt="Background 2" className="background-image small-image" />
        <img src="/balmer_background3.jpg" alt="Background 3" className="background-image small-image" />
      </div>
      <div className="circle-text">
        <span className="text" ref={circleTextRef}>
          BALMERAGENCY
        </span>
      </div>
      <div
        className={`chat-box ${borderGlowData.isActive ? "glow-active" : ""}`}
        ref={chatBoxRef}
        style={{
          "--mouse-x": `${mousePosition.x}px`,
          "--mouse-y": `${mousePosition.y}px`,
          "--glow-position": borderGlowData.position,
          "--glow-border": borderGlowData.border,
        }}
        data-glow-border={borderGlowData.border}
      >
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
                  GENERATE<img src="/Group 1.png" alt="Arrow" className="arrow-icon" />
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
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M2 12L22 2L12 22L2 12Z" />
            </svg>
          </button>
        </div>
        <div className="restart_button_container">
          <button className="restart_button" onClick={restartChat}>
            RESTART<img src="/Group 2.png" alt="Arrow" className="arrow-icon2" />
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
              View Report<img src="/Group 1.png" alt="Arrow" className="arrow-icon" />
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