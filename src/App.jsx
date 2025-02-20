import { useState } from "react";
import { motion } from "framer-motion";
import "./App.css";

const Chatbot = () => {
  const [messages, setMessages] = useState([
    { text: "Welcome business owner! If you're ready for your AI readiness evaluation type 'yes' to get started. (Please note: refreshing the browser will cause our conversation to be lost)", sender: "bot" }
  ]);
  const [userInput, setUserInput] = useState("");
  const [questionIndex, setQuestionIndex] = useState(null);
  const [email, setEmail] = useState("");

  const sendToN8N = async (data) => {
    const response = await fetch("https://liamalbrecht.app.n8n.cloud/webhook/d0cfdecc-b7a5-4938-b299-e6bd10a980cd", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return response.json();
  };

  const handleSend = async () => {
    if (!userInput.trim()) return;
    
    setMessages((prev) => [...prev, { text: userInput, sender: "user" }]);
    
    if (userInput.toLowerCase().includes("yes") && questionIndex === null) {
      const data = await sendToN8N({ questionIndex: 1 });
      setQuestionIndex(1);
      setMessages((prev) => [...prev, { text: data.question, sender: "bot" }]);
    } else if (questionIndex !== null) {
      const nextIndex = questionIndex + 1;

      if (nextIndex === 2) {
        setEmail(userInput);
      }
      
      const data = await sendToN8N({ questionIndex: nextIndex, answer: userInput, email: nextIndex === 2 ? userInput : email });
      
      if (data.question) {
        setMessages((prev) => [...prev, { text: data.question, sender: "bot" }]);
        setQuestionIndex(nextIndex);
      }
      
      if (data.question && data.question.includes("Fantastic, that should be it, it was lovely speaking with you, take care!")) {
        setTimeout(() => {
          window.location.reload();
        }, 7000);
      }
      
    } else {
      setMessages((prev) => [...prev, { text: "Let me know when you're ready, type 'yes' to proceed.", sender: "bot" }]);
    }
    
    setUserInput("");
  };

  return (
    <div className="chat-container">
      <h1>AI Opportnity Audit Bot</h1>
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
      </div>
    </div>
  );
};

export default Chatbot;
