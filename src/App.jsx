import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import "./App.css";
import ReviewAnswersPopup from "./ReviewAnswersPopup";

const Chatbot = () => {
  const [messages, setMessages] = useState(() =>
    JSON.parse(localStorage.getItem("chatMessages")) || [
      {
        text: "Hi, I am an AI Opportunity Audit bot by Balmer Agency - if you answer a few questions for me I can provide an evaluation on your business. This survey should take about 10-15 minutes to complete",
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
  const [initialised, setInitialised] = useState(false)
  const [conMessage, setConMessage] = useState("")
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const numOfQuestions = 26;
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
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, questionIndex, email, answers, fixedMessages]);

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
      "https://liamalbrecht.app.n8n.cloud/webhook/25e0bbd0-a49d-4106-b4e3-973ecb98f202", // Replace with your webhook URL
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
      "https://liamalbrecht.app.n8n.cloud/webhook/f7c8632e-d2e5-4192-8129-b9b7f63f79ee", // Replace with your webhook URL
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      }
    );
    return response.json();
  };

  const targetMessage = {
    text: "In order to submit your answers, please review them first by clicking 'Review Answers' below.",
    sender: "bot",
  };

  const handleSend = async () => {
    if (!userInput.trim()) return;
  
    setMessages((prev) => [...prev, { text: userInput, sender: "user" }]);
    setUserInput("");
  
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
  
      // Handle questions before starting
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
  
    // Improved initial message
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
            text: "In order to submit your answers, please review them first by clicking 'Review Answers' below.",
            sender: "bot",
          },
        ]);
      }
    } else {
      // Handle general questions & greetings
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

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      handleSend();
    }
  };

  const restartChat = () => {
    localStorage.clear();
    setMessages([
      {
        text: "Hi, I am an AI Opportunity Audit bot by Balmer Agency - if you answer a few questions for me I can provide an evaluation on your business. This survey should take around 10-15 minutes.",
        sender: "bot",
      },
    ]);
    setQuestionIndex(null);
    setEmail("");
    setAnswers({});
    setFixedMessages([]);
    setInitialised(false);
    setConMessage("")
  };

  const handleFirstClose = () => {
    setMessages((prev) => [
      ...prev,
      { text: "Are you ready to submit your answers?", sender: "bot" },
      { text: "", sender: "submit_button" }, // Special sender for the button
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
  
    setIsTyping(true); // Show typing indicator
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, 50); // Small delay to allow DOM update
  
    try {
      const data = await sendSubmitToN8N(email);
      setIsTyping(false); // Hide typing indicator
      if (data.text) {
        setMessages((prev) => [...prev, { text: data.text, sender: "bot" }]);
      } else {
        setMessages((prev) => [
          ...prev,
          { text: "Error: No confirmation message received.", sender: "bot" },
        ]);
      }
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); // Scroll after new message
    } catch (error) {
      setIsTyping(false); // Hide typing indicator on error
      setMessages((prev) => [
        ...prev,
        { text: "Error submitting answers. Please try again.", sender: "bot" },
      ]);
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); // Scroll after error
      console.error("Submit error:", error);
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
      <p>Artificial intelligence opportunity bot</p>
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
                  Submit
                </button>
              ) : (
                msg.text
              )}
            </motion.div>
          ))}
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
            Send
          </button>
        </div>
        <div className="restart_button_container">
          <button className="restart_button" onClick={restartChat}>
            Restart
          </button>
          {messages.some((msg) =>
            msg.text.includes(
              "In order to submit your answers, please review them first by clicking 'Review Answers' below."
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
        </div>
      </div>
    </div>
  );
};

export default Chatbot;