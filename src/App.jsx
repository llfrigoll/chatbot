import { useState } from "react";
import { motion } from "framer-motion";

const Chatbot = () => {
  const [messages, setMessages] = useState([
    { text: "Welcome business owner! If you're ready for your AI readiness evaluation type 'yes' to get started. (Please note: refreshing the browser will cause our conversation to be lost)", sender: "bot" }
  ]);
  const [predefinedOptions, setPredefinedOptions] = useState([""])
  const [userInput, setUserInput] = useState("");
  const [questionIndex, setQuestionIndex] = useState(null);

  // Function to send data to n8n
  const sendToN8N = async (data) => {
    const response = await fetch("https://liamalbrecht.app.n8n.cloud/webhook/d0cfdecc-b7a5-4938-b299-e6bd10a980cd", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return response.json();
  };

  // Handle user input
  const handleSend = async () => {
    if (!userInput.trim()) return;
    
    setMessages((prev) => [...prev, { text: userInput, sender: "user" }]);
    
    if (userInput.toLowerCase().includes("yes") && questionIndex === null) {
      const data = await sendToN8N({ questionIndex: 1 });
      setQuestionIndex(1);
      setMessages((prev) => [...prev, { text: data.question, sender: "bot" }]);
      setPredefinedOptions(data.answers)
      console.log("workflow triggered")
    }else { if(questionIndex === null) {
        setMessages((prev) => [
          ...prev, { text: "Let me know when you're ready, type 'yes' to proceed.", sender: "bot" }
        ])
      }else {
        setMessages((prev) => [
          ...prev, {text: prev[prev.length - 1] + "(Hey.. psst.. please pick an answer from the list!)", sender: "bot"}
        ])
      }
    }
    
    setUserInput("");
  };

  // Handle predefined answer selection
  const handleAnswerSelect = async (answer) => {
    setMessages((prev) => [...prev, { text: answer, sender: "user" }]);
    
    const nextIndex = questionIndex + 1;
    const data = await sendToN8N({ questionIndex: nextIndex, answer });
    
    if (data.question) {
      setMessages((prev) => [...prev, { text: data.question, sender: "bot" }]);
      setQuestionIndex(nextIndex);
      setPredefinedOptions(data.answers)
    }
  };

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white shadow-lg rounded-xl p-4">
        <div className="h-96 overflow-y-auto space-y-2">
          {messages.map((msg, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-2 rounded-lg max-w-xs ${
                msg.sender === "bot" ? "bg-blue-500 text-white" : "bg-gray-300 ml-auto"
              }`}
            >
              {msg.text}
            </motion.div>
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          {questionIndex !== null && messages[messages.length - 1].sender === "bot" && (
            predefinedOptions?.map((option, index) => (
              <button
                key={index}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg"
                onClick={() => handleAnswerSelect(option)}
              >
                {option}
              </button>
            ))
          )}
        </div>
        <div className="mt-4 flex">
          <input
            type="text"
            className="flex-1 border p-2 rounded-l-lg"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Type here..."
          />
          <button className="bg-blue-500 text-white px-4 py-2 rounded-r-lg" onClick={handleSend}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
