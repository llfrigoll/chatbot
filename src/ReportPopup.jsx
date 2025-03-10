import { useState } from "react";
import PropTypes from "prop-types";
import "./ReportPopup.css";

const ReportPopup = ({ reportData, onClose }) => {
  const [showPopup, setShowPopup] = useState(true);

  const handleClose = () => {
    setShowPopup(false);
    onClose(); // Clear report data in parent component
  };

  // Extract agents, overall rating, and summary from reportData
  const agents = reportData.filter((item) => item.agent).map((item) => item.agent);
  const overallRating = reportData.find((item) => item.overall_rating)?.overall_rating || 0;
  const summaryText = reportData.find((item) => item.summary_text)?.summary_text || "";

  return (
    <>
      {showPopup && (
        <div className="popup_container">
          <div className="popup_box">
            <h2 className="popup_title">Your AI Opportunity Report</h2>

            <div className="report_content">
              {/* Top row with 4 agent bubbles */}
              <div className="agent_bubbles">
                {agents.map((agent, index) => (
                  <div key={index} className="agent_bubble">
                    <div className="agent_name">{agent.name}</div>
                    <div className="agent_rating">{agent.rating}</div>
                  </div>
                ))}
              </div>

              {/* Centered overall rating bubble */}
              <div className="overall_bubble">
                <div className="overall_rating">{overallRating}</div>
                <div className="metric_label">Overall AI Potential</div>
              </div>

              {/* Summary text below */}
              <div className="summary_text">{summaryText}</div>
            </div>

            <button className="close_button" onClick={handleClose}>
              Close
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