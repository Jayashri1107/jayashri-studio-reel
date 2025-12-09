import React, { useState, useEffect } from "react";
import SellerLogin from "../Seller/SellerLogin";
import InfluencerLogin from "../Influencer/InfluencerLogin";
import SellerApplyForReels from "../Seller/SellerApplyForReels";
import InfluencerApplyForReels from "../Influencer/InfluencerApplyForReels";
import { useNavigate, useLocation } from "react-router-dom";
import { Typewriter } from "react-simple-typewriter";

const StudioLanding = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("");
  const [pendingApprovalMessage, setPendingApprovalMessage] = useState("");

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const message = queryParams.get("message");

    if (message === "pending_approval") {
      setPendingApprovalMessage(
        "Your profile is under review. Please wait for admin approval."
      );
      navigate("/studio", { replace: true });
    }
  }, [location, navigate]);

  // Listen for custom event to open login modal
  useEffect(() => {
    const handleOpenLoginModal = (event) => {
      setModalType(event.detail);
      setShowModal(true);
    };

    window.addEventListener('openLoginModal', handleOpenLoginModal);
    
    return () => {
      window.removeEventListener('openLoginModal', handleOpenLoginModal);
    };
  }, []);

  const openModal = (type) => {
    setModalType(type);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalType("");
  };

  const switchToSellerRegister = () => setModalType("seller-apply-for-reels");
  const switchToInfluencerRegister = () => setModalType("influencer-apply-for-reels");

  return (
    <div
      className="main-content"
      style={{
        minHeight: "100vh",
        background:
          'linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.6)), url("https://plus.unsplash.com/premium_photo-1683288295814-84a199da83d9?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D")',
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div className="text-center text-white">
        {/* ---------- TYPING EFFECT HEADING ---------- */}
        <h1 className="display-3 fw-bold mb-4" style={{ 
          color: "white",
          textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
          animation: "fadeInUp 1s ease-out"
        }}>
          <i className="fas fa-film me-3"></i>
          <span>
            <Typewriter
              words={["IP Shopy Studio..."]}
              cursor
              cursorStyle="_"
              typeSpeed={70}
              loop={false}
            />
          </span>
        </h1>

        {/* ---------- TYPING EFFECT PARAGRAPH ---------- */}
        <p className="lead mb-5 fs-4" style={{
          color: "white",
          textShadow: "1px 1px 2px rgba(0,0,0,0.5)",
          animation: "fadeInUp 1s ease-out 0.3s both"
        }}>
          <b>
            <Typewriter
              words={[
                "Professional platform for sellers and influencers to manage reels.",
              ]}
              cursor
              cursorStyle="_"
              typeSpeed={20}
              loop={false}
            />
          </b>
        </p>
        
        {pendingApprovalMessage && (
          <div
            className="alert alert-warning mx-auto mb-4"
            style={{ maxWidth: "500px" }}
          >
            <i className="fas fa-exclamation-circle me-2"></i>
            {pendingApprovalMessage}
          </div>
        )}

        <div className="mb-5">
          <h2 className="display-6 fw-bold mb-4" style={{
            color: "white",
            textShadow: "1px 1px 2px rgba(0,0,0,0.5)",
            animation: "fadeInUp 1s ease-out 0.6s both"
          }}>
            <u>
              <i>Choose Your Role</i>
            </u>
          </h2>
          <div className="d-flex flex-wrap justify-content-center gap-4">
            <div className="d-flex flex-column align-items-center">
              <button
                className="btn btn-lg px-5 py-3 mb-3 text-white fw-semibold"
                onClick={() => openModal("seller-login")}
                style={{
                  background: "linear-gradient(135deg, #667eea, #5564d4)",
                  border: "none",
                  fontSize: "1.2rem",
                  transition: "all 0.3s ease",
                  boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
                  animation: "fadeInUp 1s ease-out 0.9s both"
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = "scale(1.05)";
                  e.target.style.boxShadow = "0 6px 20px rgba(0,0,0,0.3)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = "scale(1)";
                  e.target.style.boxShadow = "0 4px 15px rgba(0,0,0,0.2)";
                }}
              >
                <i className="fas fa-store me-2"></i>
                Seller Login
              </button>
            </div>

            <div className="d-flex flex-column align-items-center">
              <button
                className="btn btn-lg px-5 py-3 mb-3 text-white fw-semibold"
                onClick={() => openModal("influencer-login")}
                style={{
                  background: "linear-gradient(135deg, #a24b8e, #764ba2)",
                  border: "none",
                  fontSize: "1.2rem",
                  transition: "all 0.3s ease",
                  boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
                  animation: "fadeInUp 1s ease-out 0.9s both"
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = "scale(1.05)";
                  e.target.style.boxShadow = "0 6px 20px rgba(0,0,0,0.3)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = "scale(1)";
                  e.target.style.boxShadow = "0 4px 15px rgba(0,0,0,0.2)";
                }}
              >
                <i className="fas fa-user-friends me-2"></i>
                Influencer Login
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add CSS animations */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translate3d(0, 20px, 0);
          }
          to {
            opacity: 1;
            transform: translate3d(0, 0, 0);
          }
        }
      `}</style>

      {/* --------- MODAL --------- */}
      {showModal && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {modalType === "seller-login" && "Seller Login"}
                  {modalType === "influencer-login" && "Influencer Login"}
                  {modalType === "seller-apply-for-reels" && "Apply for Seller Reels"}
                  {modalType === "influencer-apply-for-reels" && "Apply for Influencer Reels"}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeModal}
                ></button>
              </div>

              <div className="modal-body">
                {modalType === "seller-login" && (
                  <div>
                    <SellerLogin onClose={closeModal} />
                    <div className="text-center mt-3">
                      <p className="small mb-0">
                        Don't have an account?{" "}
                        <button
                          className="btn btn-link p-0 text-decoration-underline align-middle"
                          onClick={switchToSellerRegister}
                        >
                          Apply for Reels
                        </button>
                      </p>
                    </div>
                  </div>
                )}

                {modalType === "influencer-login" && (
                  <div>
                    <InfluencerLogin onClose={closeModal} />
                    <div className="text-center mt-3">
                      <p className="small mb-0">
                        Don't have an account?{" "}
                        <button
                          className="btn btn-link p-0 text-decoration-underline align-middle"
                          onClick={switchToInfluencerRegister}
                        >
                          Apply for Reels
                        </button>
                      </p>
                    </div>
                  </div>
                )}
                
                {modalType === "seller-apply-for-reels" && (
                  <div>
                    <SellerApplyForReels onClose={closeModal} />
                  </div>
                )}
                
                {modalType === "influencer-apply-for-reels" && (
                  <div>
                    <InfluencerApplyForReels onClose={closeModal} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudioLanding;
