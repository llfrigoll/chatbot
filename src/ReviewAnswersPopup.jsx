import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import "./ReviewAnswersPopup.css";

const ReviewAnswersPopup = ({ answers, email, updateEmail, updateAnswers, fixedMessages, onFirstClose }) => {
  const [editedAnswers, setEditedAnswers] = useState({ ...answers });
  const [editedEmail, setEditedEmail] = useState(email);
  const [isVisible, setIsVisible] = useState(false); // Controls visibility
  const [isAnimatingOut, setIsAnimatingOut] = useState(false); // Controls exit animation
  const [changedQuestions, setChangedQuestions] = useState({});
  const [changedEmail, setChangedEmail] = useState(false);
  const [hasBeenClosed, setHasBeenClosed] = useState(false);

  // Handle opening the popup
  const handleOpen = () => {
    setIsVisible(true);
    setIsAnimatingOut(false);
  };

  // Handle closing the popup with animation
  const handleClose = () => {
    setIsAnimatingOut(true);
  };

  // Effect to handle cleanup after exit animation
  useEffect(() => {
    if (isAnimatingOut) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setEditedAnswers({ ...answers });
        setEditedEmail(email);
        setChangedQuestions({});
        setChangedEmail(null);

        if (!hasBeenClosed) {
          setHasBeenClosed(true);
          onFirstClose();
        }
      }, 300); // Match this with your animation duration (0.3s)
      return () => clearTimeout(timer);
    }
  }, [isAnimatingOut, answers, email, hasBeenClosed, onFirstClose]);

  // Handle answer change for a specific question
  const handleAnswerChange = (questionIndex, newValue) => {
    setEditedAnswers((prev) => ({
      ...prev,
      [questionIndex]: newValue,
    }));
    setChangedQuestions((prev) => ({
      ...prev,
      [questionIndex]: newValue !== answers[questionIndex],
    }));
  };

  const handleEmailChange = (newEmail) => {
    setEditedEmail(newEmail);
    setChangedEmail(newEmail !== email);
  };

  // Handle saving the edited answer
  const handleSave = async (questionIndex) => {
    const payload = {
      questionIndex,
      newAnswer: editedAnswers[questionIndex],
      email,
    };

    try {
      const response = await fetch(
        "https://liamalbrecht.app.n8n.cloud/webhook/6ce58298-46c7-4a4c-83a3-22b6375d7af9",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();
      if (data.message) {
        alert(data.message);
        updateAnswers((prevAnswers) => ({
          ...prevAnswers,
          [questionIndex]: editedAnswers[questionIndex],
        }));
        setChangedQuestions((prev) => ({
          ...prev,
          [questionIndex]: false,
        }));
      } else {
        alert("Failed to save answer. Try again.");
      }
    } catch (error) {
      alert("Error saving answer. Error message: " + error);
    }
  };

  const handleEmailSave = async () => {
    const payload = {
      newEmail: editedEmail,
      oldEmail: email,
    };

    try {
      const response = await fetch(
        "https://liamalbrecht.app.n8n.cloud/webhook/ca107f30-2d8b-44ce-b02a-f9f1f711651a",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();
      if (data.message) {
        alert(data.message);
        updateEmail(editedEmail);
        setChangedEmail(false);
      } else {
        alert("Failed to save email. Try again.");
      }
    } catch (error) {
      alert("Error saving email. Error message: " + error);
    }
  };

  return (
    <>
      <button className="review_answers_button" onClick={handleOpen}>
        REVIEW ANSWERS<img src="/Group 2.png" alt="Arrow" className="arrow-icon2"/>
      </button>

      {isVisible && (
        <div className={`popup_container_review ${isAnimatingOut ? 'fade-out' : ''}`}>
          <div className={`popup_box_review ${isAnimatingOut ? 'popup_exit' : 'popup_enter'}`}>
            <h2 className="popup_title_review">Review Your Answers</h2>

            <div className="questions_list">
              <div key={1} className="question_item">
                <div className="question_text">Change your email:</div>
                <div className="answer_container">
                  <input
                    type="text"
                    className="answer_input"
                    value={editedEmail}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    placeholder="Your answer..."
                  />
                  {changedEmail && (
                    <button
                      className="save_button"
                      onClick={() => handleEmailSave()}
                    >
                      Save
                    </button>
                  )}
                </div>
              </div>

              {fixedMessages.filter((_, index) => index + 1 !== fixedMessages.length).map((question, index) => {
                const questionIndex = index + 2;
                const answer = editedAnswers[questionIndex] || "";
                const isChanged = changedQuestions[questionIndex];

                return (
                  <div key={index + 1} className="question_item">
                    <div className="question_text">{question.text}</div>
                    <div className="answer_container">
                      <input
                        type="text"
                        className="answer_input"
                        value={answer}
                        onChange={(e) =>
                          handleAnswerChange(questionIndex, e.target.value)
                        }
                        placeholder="Your answer..."
                      />
                      {isChanged && (
                        <button
                          className="save_button"
                          onClick={() => handleSave(questionIndex)}
                        >
                          Save
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <button className="close_button_review" onClick={handleClose}>
              CLOSE
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
  updateEmail: PropTypes.func.isRequired,
  fixedMessages: PropTypes.array.isRequired,
  onFirstClose: PropTypes.func.isRequired,
};

export default ReviewAnswersPopup;