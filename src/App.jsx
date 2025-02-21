import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import "./App.css"
import ReviewAnswersPopup from "./ReviewAnswersPopup";

const Chatbot = () => {
  const [messages, setMessages] = useState(() => JSON.parse(localStorage.getItem("chatMessages")) || [
    { text: "Welcome business owner! If you're ready for your AI readiness evaluation type 'yes' to get started.", sender: "bot" }
  ]);
  const [fixedMessages, setFixedMessages] = useState(() => JSON.parse(localStorage.getItem("fixedMessages")) || [])
  const [userInput, setUserInput] = useState("");
  const [questionIndex, setQuestionIndex] = useState(() => JSON.parse(localStorage.getItem("questionIndex")) || null);
  const [email, setEmail] = useState(() => localStorage.getItem("userEmail") || "");
  const [answers, setAnswers] = useState(() => JSON.parse(localStorage.getItem("answers")) || {});
  const messagesEndRef = useRef(null);

  useEffect(() => {
    localStorage.setItem("chatMessages", JSON.stringify(messages));
    localStorage.setItem("questionIndex", JSON.stringify(questionIndex));
    localStorage.setItem("userEmail", email);
    localStorage.setItem("answers", JSON.stringify(answers));
    localStorage.setItem("fixedMessages", JSON.stringify(fixedMessages));
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, questionIndex, email, answers, fixedMessages]);

  const sendToN8N = async (data) => {
    const response = await fetch("https://liamalbrecht.app.n8n.cloud/webhook/d0cfdecc-b7a5-4938-b299-e6bd10a980cd", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return response.json();
  };

  const targetMessage = {
    text: "You'll receive your audit results via email shortly! If you'd like to review or change any answers, click 'Review Answers' below.",
    sender: "bot"
  };

  const handleSend = async () => {
    if (!userInput.trim() || messages.some(
      message => message.text === targetMessage.text && message.sender === targetMessage.sender
    )) return;
    
    setMessages((prev) => [...prev, { text: userInput, sender: "user" }]);
    setUserInput("");

    if (userInput.toLowerCase().includes("yes") && questionIndex === null) {
      const data = await sendToN8N({ questionIndex: 1 });
      setQuestionIndex(1);
      setMessages((prev) => [...prev, { text: data.question, sender: "bot" }]);
    } else if (questionIndex !== null) {
      const nextIndex = questionIndex + 1;
      if (nextIndex === 2) setEmail(userInput);
      
      setAnswers((prev) => ({ ...prev, [questionIndex]: userInput }));
      const data = await sendToN8N({ questionIndex: nextIndex, answer: userInput, email: nextIndex === 2 ? userInput : email });
      
      if (data.question) {
        setMessages((prev) => [...prev, { text: data.question, sender: "bot" }]);
        setQuestionIndex(nextIndex);
      }
      if (data.fixedQuestion) {
        setFixedMessages((prev) => [...prev, { text: data.fixedQuestion }]);
      }
      
      if (data.question && data.question.includes("Fantastic, that should be it")) {
        setMessages((prev) => [...prev, { text: "You'll receive your audit results via email shortly! If you'd like to review or change any answers, click 'Review Answers' below.", sender: "bot" }]);
      }
    } else {
      setMessages((prev) => [...prev, { text: "Let me know when you're ready, type 'yes' to proceed.", sender: "bot" }]);
    }
  };

  const restartChat = () => {
    localStorage.clear();
    setMessages([{ text: "Welcome business owner! If you're ready for your AI readiness evaluation type 'yes' to get started.", sender: "bot" }]);
    setQuestionIndex(null);
    setEmail("");
    setAnswers({});
    setFixedMessages([])
  };

  return (
    <div className="chat-container">
      <h1>AI Opportunity Audit Bot</h1>
      <div className="chat-box">
        <div className="messages">
          {messages.map((msg, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`message ${msg.sender === "bot" ? "bot-message" : "user-message"}`}
            >
              {msg.text}
            </motion.div>
          ))}
          <div ref={messagesEndRef} style={{ height: "1px" }} /> {/* Small spacer */}
        </div>
        <div className="input-container">
          <input
            type="text"
            className="input-box"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
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
          {messages[messages.length - 1].text.includes("You'll receive your audit results via email shortly! If you'd like to review or change any answers, click 'Review Answers' below.") && (
            <ReviewAnswersPopup 
            messages={messages} 
            answers={answers} 
            email={email} 
            fixedMessages={fixedMessages}
            updateAnswers={setAnswers} // Function to update answers state
          />
          )}
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
