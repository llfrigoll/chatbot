import { useState } from "react";
import PropTypes from "prop-types";

const ReviewAnswersPopup = ({ answers, email, updateAnswers, fixedMessages }) => {
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [editedAnswer, setEditedAnswer] = useState("");
  const [originalAnswer, setOriginalAnswer] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [showSaveButton, setShowSaveButton] = useState(false);

  // Handle selecting a question
  const handleSelectChange = (event) => {
    const questionIndex = parseInt(event.target.value, 10);
  
    if (fixedMessages[questionIndex + 1]) {
      const updatedAnswer = answers[questionIndex + 2] || ""; // ✅ Correct +2 offset
  
      setSelectedQuestion({
        question: fixedMessages[questionIndex + 1].text, // ✅ Offset to match dropdown list
        index: questionIndex + 1, // ✅ Adjust index
      });
  
      // ✅ Wait for state updates before setting values
      setTimeout(() => {
        setEditedAnswer(updatedAnswer);
        setOriginalAnswer(updatedAnswer);
      }, 100);
      
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
      email: email,
    };
  
    try {
      const response = await fetch("https://liamalbrecht.app.n8n.cloud/webhook/6ce58298-46c7-4a4c-83a3-22b6375d7af9", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
  
      const data = await response.json();
      if (data.message) {
        alert(data.message);
  
        // ✅ Ensure answers state updates correctly
        updateAnswers((prevAnswers) => {
          const updatedAnswers = {
            ...prevAnswers,
            [selectedQuestion.index + 1]: editedAnswer, // ✅ Ensure correct offset
          };
          return updatedAnswers;
        });
  
        setOriginalAnswer(editedAnswer); // ✅ Ensure input field updates
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
              {fixedMessages.slice(1).map((question, index) => (
                <option key={index} value={index}>
                  {question.text}
                </option>
              ))}
            </select>

            {selectedQuestion && (
              <>
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
              className="bg-blue-500 text-white px-4 py-2 mt-4 rounded-lg w-full"
              onClick={() => {
                setShowPopup(false);
                setSelectedQuestion(null);
                setEditedAnswer("");
                setOriginalAnswer("");
                setShowSaveButton(false);
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
  answers: PropTypes.object.isRequired,
  email: PropTypes.string.isRequired,
  updateAnswers: PropTypes.func.isRequired,
  fixedMessages: PropTypes.array.isRequired
};

export default ReviewAnswersPopup;
