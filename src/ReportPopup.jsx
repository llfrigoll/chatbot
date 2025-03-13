import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import "./ReportPopup.css";

const ReportPopup = ({ reportData, onClose }) => {
  const [showPopup, setShowPopup] = useState(true);
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true); // Trigger exit animation
  };

  useEffect(() => {
    if (isClosing) {
      const timer = setTimeout(() => {
        setShowPopup(false);
        onClose(); // Clear report data in parent component after animation
      }, 300); // Match the animation duration (0.3s)
      return () => clearTimeout(timer);
    }
  }, [isClosing, onClose]);

  const agents = reportData.filter((item) => item.agent).map((item) => item.agent);
  const overallRating = reportData.find((item) => item.overall_rating)?.overall_rating || 0;
  const summaryText = reportData.find((item) => item.summary_text)?.summary_text || "";

  return (
    <>
      {showPopup && (
        <div className={`popup_container ${isClosing ? "fadeOut" : ""}`}>
          <div className={`popup_box ${isClosing ? "popupOut" : ""}`}>
            <h2 className="popup_title_report">YOUR AI OPPORTUNITY REPORT</h2>

            <div className="report_content">
              <div className="agent_bubbles">
                {agents.map((agent, index) => (
                  <div key={index} className="agent_bubble">
                    <div className="agent_name">{agent.name}</div>
                    <div className="agent_rating">{agent.rating}</div>
                  </div>
                ))}
              </div>

              <div className="overall_bubble">
                <div className="overall_rating">{overallRating}</div>
                <div className="metric_label">Overall AI Potential</div>
              </div>

              <div className="summary_text">{summaryText}</div>
            </div>

            <button className="close_button" onClick={handleClose}>
              CLOSE
            </button>
          </div>
        </div>
      )}
    </>
  );
};

ReportPopup.propTypes = {
  reportData: PropTypes.array.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default ReportPopup;