import { useState } from "react";
import PropTypes from "prop-types";

const ReviewAnswersPopup = ({ messages, answers, email, updateAnswers, fixedMessages }) => {
  const [selectedQuestion, setSelectedQuestion] = useState("");
  const [editedAnswer, setEditedAnswer] = useState("");
  const [originalAnswer, setOriginalAnswer] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [showSaveButton, setShowSaveButton] = useState(false);

  // Extract relevant bot questions and map them to answers
  const botQuestions = messages
    .filter(msg => msg.sender === "bot")
    .filter((_, index) => index > 1)
    .filter((_, index) => index < Object.values(answers).length - 1)
    .map((msg, index) => ({
      question: msg.text,
      answer: Object.values(answers)[index + 1],
      index: index + 1 // Question index starts from 1
    }));

  // Handle selecting a question
  const handleSelectChange = (event) => {
    const questionIndex = parseInt(event.target.value, 10);
    
    // ✅ Ensure we use the updated answers from state
    const updatedAnswer = answers[questionIndex + 1] || "";
  
    const selected = botQuestions.find(q => q.index === questionIndex);
    if (selected) {
      setSelectedQuestion({
        ...selected,
        answer: updatedAnswer
      });
      setEditedAnswer(updatedAnswer);
      setOriginalAnswer(updatedAnswer);
      setShowSaveButton(false);
    }
  };
  

  // Handle answer change
  const handleAnswerChange = (event) => {
    setEditedAnswer(event.target.value);
    setShowSaveButton(event.target.value !== originalAnswer);
  };

  // Handle saving the answer
  const handleSave = async () => {
    if (!selectedQuestion) return;
  
    const payload = {
      questionIndex: selectedQuestion.index,
      newAnswer: editedAnswer,
      email: email
    };
  
    try {
      const response = await fetch("https://liamalbrecht.app.n8n.cloud/webhook/6ce58298-46c7-4a4c-83a3-22b6375d7af9", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
  
      const data = await response.json();
      if (data.message) {
        alert(data.message);
  
        // ✅ Update the `answers` state immediately
        updateAnswers(prevAnswers => {
          const updatedAnswers = {
            ...prevAnswers,
            [selectedQuestion.index]: editedAnswer
          };
  
          // ✅ Ensure `selectedQuestion.answer` also updates
          setSelectedQuestion(prev => ({
            ...prev,
            answer: editedAnswer
          }));
  
          return updatedAnswers;
        });
  
        setShowSaveButton(false);
      } else {
        alert("Failed to save answer. Try again.");
      }
    } catch (error) {
      alert("Error saving answer. Error message: " + error);
    }
  };
  
  return (
    <>
      <button 
        className="bg-blue-500 text-white px-4 py-2 rounded-lg"
        onClick={() => setShowPopup(true)}
      >
        Review Answers
      </button>

      {showPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-lg font-semibold mb-4">Review Your Answers</h2>

            <label className="block mb-2">Select a Question:</label>
            <select 
              className="w-full p-2 border rounded-lg mb-4"
              onChange={handleSelectChange}
            >
              <option value="">-- Choose a Question --</option>
              {botQuestions.map(q => (
                <option key={q.index} value={q.index}>
                  {q.question}
                </option>
              ))}
            </select>

            {selectedQuestion && (
              <>
                <p className="mb-2 font-semibold">Question:</p>
                <p className="mb-4">{selectedQuestion.question}</p>

                <label className="block mb-2">Your Answer:</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded-lg"
                  value={editedAnswer}
                  onChange={handleAnswerChange}
                />

                {showSaveButton && (
                  <button 
                    className="bg-green-500 text-white px-4 py-2 mt-4 rounded-lg"
                    onClick={handleSave}
                  >
                    Save Changes
                  </button>
                )}
              </>
            )}

            <button 
              className="bg-gray-500 text-white px-4 py-2 mt-4 rounded-lg w-full"
              onClick={() => {
                setShowPopup(false);
                setSelectedQuestion(""); // ✅ Clear selected question
                setEditedAnswer(""); // ✅ Clear answer input
                setOriginalAnswer(""); // ✅ Reset original answer
                setShowSaveButton(false); // ✅ Hide save button
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};

ReviewAnswersPopup.propTypes = {
  messages: PropTypes.arrayOf(
    PropTypes.shape({
      text: PropTypes.string.isRequired,
      sender: PropTypes.string.isRequired
    })
  ).isRequired,
  answers: PropTypes.object.isRequired,
  email: PropTypes.string.isRequired,
  updateAnswers: PropTypes.func.isRequired,
  fixedMessages: PropTypes.array.isRequired
};

export default ReviewAnswersPopup;