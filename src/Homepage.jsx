import React, { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
// Animated hero sentences — defined outside to avoid exhaustive-deps warning
const SENTENCES = [
  "Smart Hospital Management System",
  "Connecting Patients with the Best Doctors",
  "Your Health, Our Priority — 24/7 Care",
  "Streamlined Appointments & Digital Records",
  "Quality Healthcare at Your Fingertips",
];

function Homepage() {
  const [sentenceIdx, setSentenceIdx]   = useState(0);
  const [displayed,   setDisplayed]     = useState("");
  const [isDeleting,  setIsDeleting]    = useState(false);
  const [charIdx,     setCharIdx]       = useState(0);

  useEffect(() => {
    const current = SENTENCES[sentenceIdx];
    let timeout;
    if (!isDeleting && charIdx <= current.length) {
      timeout = setTimeout(() => {
        setDisplayed(current.slice(0, charIdx));
        setCharIdx(c => c + 1);
      }, 60);
    } else if (!isDeleting && charIdx > current.length) {
      // Pause then start deleting
      timeout = setTimeout(() => setIsDeleting(true), 1800);
    } else if (isDeleting && charIdx >= 0) {
      timeout = setTimeout(() => {
        setDisplayed(current.slice(0, charIdx));
        setCharIdx(c => c - 1);
      }, 35);
    } else {
      // Move to next sentence
      setIsDeleting(false);
      setSentenceIdx(i => (i + 1) % SENTENCES.length);
      setCharIdx(0);
    }
    return () => clearTimeout(timeout);
  }, [charIdx, isDeleting, sentenceIdx]); // eslint-disable-line react-hooks/exhaustive-deps

  const [appointmentData, setAppointmentData] = useState({
  fullname: "",
  email: "",
  phone: "",
  department: "",
  date: "",
  time: "",
  problem: "",
});

const handleChange = (e) => {
  setAppointmentData({
    ...appointmentData,
    [e.target.name]: e.target.value,
  });
};

const handleSubmit = (e) => {
  e.preventDefault();

  localStorage.setItem(
    "appointmentData",
    JSON.stringify(appointmentData)
  );

  sessionStorage.setItem(
    "appointmentData",
    JSON.stringify(appointmentData)
  );

  alert("Appointment Saved Successfully");

  setAppointmentData({
    fullname: "",
    email: "",
    phone: "",
    department: "",
    date: "",
    time: "",
    problem: "",
  });
};

const [feedbackData, setFeedbackData] = useState({
  name: "",
  email: "",
  rating: "",
  feedback: "",
});

const handleFeedbackChange = (e) => {
  setFeedbackData({
    ...feedbackData,
    [e.target.name]: e.target.value,
  });
};

const handleFeedbackSubmit = (e) => {
  e.preventDefault();

  localStorage.setItem(
    "feedbackData",
    JSON.stringify(feedbackData)
  );

  sessionStorage.setItem(
    "feedbackData",
    JSON.stringify(feedbackData)
  );

  alert("Feedback Submitted Successfully");

  setFeedbackData({
    name: "",
    email: "",
    rating: "",
    feedback: "",
  });
};
  return (
    <>

    <style>{`
      @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
    `}</style>
    <nav>

<div className="logo">
<img src="/logo.png" alt="MedCare Logo" />
<h2>MedCare</h2>
</div>

<ul>
<li><a href="/">Home</a></li>
<li><a href="#about">About</a></li>
<li><a href="#modules">Features</a></li>
<li><a href="#departments">Departments</a></li>
<li><a href="#booking">Book Meeting</a></li>
<li>
  <Link to="/login">Login</Link>
</li>
</ul>

</nav>


      <div className="announcement-bar" role="status" aria-live="polite">
        🚑 24/7 Emergency Services Available |
        💜 Free Health Checkup Camp This Sunday |
        📞 Emergency Contact : +91 9876543210 |
        🩺 Expert Doctors Available Across All Departments |
        💊 Special Offers Also Available
      </div>

      <section className="hero">
        <div className="hero-content">
          <div className="hero-text">
            <h1 style={{ minHeight: "3.2rem" }}>
              {displayed}
              <span style={{
                display: "inline-block",
                width: 3,
                height: "1em",
                background: "#7c3aed",
                marginLeft: 2,
                verticalAlign: "text-bottom",
                animation: "blink 0.8s step-end infinite",
              }} />
            </h1>
            <p>
              Modern healthcare platform to manage patients, doctors,
              appointments, billing, pharmacy and hospital operations efficiently.
            </p>
            <button>Get Started</button>
          </div>
          <div className="hero-image">
            <img
              src="https://img.magnific.com/free-photo/copy-space-stethoscope-pills_23-2148550954.jpg"
              alt="Stethoscope and pills on a desk"
            />
          </div>
        </div>
      </section>

      <section className="about-section" id="about">
        <div className="about-container">
          <div className="about-text">
            <h2>About Us</h2>
            <p>
              Founded with a vision to provide quality healthcare services,
              our hospital management system helps hospitals streamline patient care,
              doctor management, appointments, pharmacy, billing and diagnostics efficiently.
              We focus on modern healthcare technology, patient satisfaction and seamless
              hospital operations.
            </p>
          </div>
          <div className="about-cards">
            <div className="about-card">
              <h1>25+</h1>
              <h3>Years Experience</h3>
              <p>Providing trusted healthcare management solutions with advanced technology.</p>
            </div>
            <div className="about-card">
              <h1>150+</h1>
              <h3>Doctors</h3>
              <p>Experienced doctors and specialists available across multiple departments.</p>
            </div>
            <div className="about-card">
              <h1>5000+</h1>
              <h3>Happy Patients</h3>
              <p>Thousands of patients successfully treated with quality care and support.</p>
            </div>
            <div className="about-card">
              <h1>24/7</h1>
              <h3>Emergency Support</h3>
              <p>Round-the-clock emergency healthcare and patient assistance services.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="modules" id="modules">
        <h2 className="section-title">Hospital Features</h2>
        <div className="card-container">
          <div className="card">
            <h3>Patient Module</h3>
            <p>Manage patient records and treatment details.</p>
          </div>
          <div className="card">
            <h3>Doctor Module</h3>
            <p>Manage doctor profiles and schedules.</p>
          </div>
          <div className="card">
            <h3>Appointment Module</h3>
            <p>Book and manage patient appointments.</p>
          </div>
          <div className="card">
            <h3>Billing Module</h3>
            <p>Generate invoices and payment reports.</p>
          </div>
          <div className="card">
            <h3>Pharmacy Module</h3>
            <p>Maintain medicines and prescriptions.</p>
          </div>
          <div className="card">
            <h3>Lab Module</h3>
            <p>Store laboratory tests and diagnostics.</p>
          </div>
          <div className="card">
            <h3>Emergency Module</h3>
            <p>Treat patient with first priority when its emergency.</p>
          </div>
        </div>
      </section>

      <section className="departments" id="departments">
        <h2 className="section-title">Hospital Departments</h2>
        <div className="card-container">
          <div className="card">
            <h3>Neurology</h3>
            <p>Specialists for brain, nerves and neurological disorders.</p>
          </div>
          <div className="card">
            <h3>Pediatrics</h3>
            <p>Healthcare services for infants, children and teenagers.</p>
          </div>
          <div className="card">
            <h3>Cardiology</h3>
            <p>Treatment and diagnosis for heart related diseases.</p>
          </div>
          <div className="card">
            <h3>Orthopedics</h3>
            <p>Bone, joint and muscle treatment specialists.</p>
          </div>
          <div className="card">
            <h3>Dermatology</h3>
            <p>Skin, hair and nail care treatments.</p>
          </div>
          <div className="card">
            <h3>Gynecology</h3>
            <p>Women reproductive health and maternity care.</p>
          </div>
          <div className="card">
            <h3>ENT</h3>
            <p>Ear, nose and throat specialist department.</p>
          </div>
          <div className="card">
            <h3>Radiology</h3>
            <p>Medical imaging and scan services department.</p>
          </div>
          <div className="card">
            <h3>Oncology</h3>
            <p>Cancer diagnosis and treatment specialists.</p>
          </div>
          <div className="card">
            <h3>Psychiatry</h3>
            <p>Mental health and counseling support department.</p>
          </div>
          <div className="card">
            <h3>Urology</h3>
            <p>Treatment for urinary tract and kidney conditions.</p>
          </div>
          <div className="card">
            <h3>General Medicine</h3>
            <p>Primary healthcare and overall medical treatment.</p>
          </div>
        </div>
      </section>

      <section id="booking">
  <h2 className="section-title">Book a Meeting</h2>

  <div className="booking-container">

    <form
      className="booking-form"
      onSubmit={handleSubmit}
    >

      <input
        type="text"
        name="fullname"
        placeholder="Enter Full Name"
        value={appointmentData.fullname}
        onChange={handleChange}
        required
      />

      <input
        type="email"
        name="email"
        placeholder="Enter Email Address"
        value={appointmentData.email}
        onChange={handleChange}
        required
      />

      <input
        type="tel"
        name="phone"
        placeholder="Enter Phone Number"
        value={appointmentData.phone}
        onChange={handleChange}
        required
      />

      <select
        name="department"
        value={appointmentData.department}
        onChange={handleChange}
        required
      >
        <option value="">Select Department</option>
        <option>Cardiology</option>
        <option>Neurology</option>
        <option>Pediatrics</option>
        <option>Orthopedics</option>
        <option>Dermatology</option>
        <option>Gynecology</option>
        <option>ENT</option>
        <option>Radiology</option>
        <option>Oncology</option>
        <option>Psychiatry</option>
        <option>Urology</option>
        <option>General Medicine</option>
      </select>

      <input
        type="date"
        name="date"
        value={appointmentData.date}
        onChange={handleChange}
        required
      />

      <input
        type="time"
        name="time"
        value={appointmentData.time}
        onChange={handleChange}
        required
      />

      <textarea
        rows="5"
        name="problem"
        placeholder="Describe Your Problem"
        value={appointmentData.problem}
        onChange={handleChange}
      ></textarea>

      <button type="submit">
        Book Appointment
      </button>

    </form>

  </div>
</section>

      <section className="doctors-section">
        <h2 className="section-title">Our Specialists</h2>
        <div className="card-container">
          <div className="card">
            <h3>Dr. Ramesh Kumar</h3>
            <p>Cardiologist</p>
          </div>
          <div className="card">
            <h3>Dr. Priya Sharma</h3>
            <p>Neurologist</p>
          </div>
          <div className="card">
            <h3>Dr. Arun Prakash</h3>
            <p>Orthopedic Specialist</p>
          </div>
          <div className="card">
            <h3>Dr. Kavya Devi</h3>
            <p>Dermatologist</p>
          </div>
          <div className="card">
            <h3>Dr. Nithya Raj</h3>
            <p>Pediatrician</p>
          </div>
          <div className="card">
            <h3>Dr. Harish Kumar</h3>
            <p>General Physician</p>
          </div>
        </div>
      </section>

      <section className="reviews">
        <h2 className="section-title">Patient Reviews</h2>
        <div className="review-container">
          <div className="review-card">
            <h4>Arun</h4>
            <p>Excellent hospital service with smooth appointment booking and quick support.</p>
          </div>
          <div className="review-card">
            <h4>Priya</h4>
            <p>Doctors are professional and the consultation process is very easy.</p>
          </div>
          <div className="review-card">
            <h4>Rahul</h4>
            <p>Billing and pharmacy services are well managed and fast.</p>
          </div>
        </div>
      </section>

      <section className="feedback-section">

  <h2 className="section-title">
    Patient Feedback
  </h2>

  <div className="booking-container">

    <form
      className="booking-form"
      onSubmit={handleFeedbackSubmit}
    >

      <input
        type="text"
        name="name"
        placeholder="Enter Name"
        value={feedbackData.name}
        onChange={handleFeedbackChange}
        required
      />

      <input
        type="email"
        name="email"
        placeholder="Enter Email"
        value={feedbackData.email}
        onChange={handleFeedbackChange}
        required
      />

      <select
        name="rating"
        value={feedbackData.rating}
        onChange={handleFeedbackChange}
        required
      >
        <option value="">
          Rate Our Service
        </option>

        <option value="Excellent">
          Excellent
        </option>

        <option value = "Very Good">Very Good</option>

        <option value="Good">
          Good
        </option>

        <option value="Average">
          Average
        </option>

        <option value="Poor">
          Poor
        </option>

      </select>

      <textarea
        rows="5"
        name="feedback"
        placeholder="Write Your Feedback"
        value={feedbackData.feedback}
        onChange={handleFeedbackChange}
      ></textarea>

      <button type="submit">
        Submit Feedback
      </button>

    </form>

  </div>

</section>

      <section id="faq" className="faq-section">
        <h2 className="section-title">Frequently Asked Questions</h2>
        <div className="faq-box">
          <div className="faq-item">
            <h4>How can I book an appointment?</h4>
            <p>You can book appointments through our online appointment booking system.</p>
          </div>
          <div className="faq-item">
            <h4>Can I access my medical reports online?</h4>
            <p>Yes. Patients can securely access reports through their dashboard.</p>
          </div>
          <div className="faq-item">
            <h4>Is emergency service available 24/7?</h4>
            <p>Yes. Emergency and ambulance services are available round the clock.</p>
          </div>
          <div className="faq-item">
            <h4>Can I cancel an appointment?</h4>
            <p>Yes. Appointments can be cancelled or rescheduled based on availability.</p>
          </div>
        </div>
      </section>

      <section id="privacy" className="privacy-section">
        <h2 className="section-title">Privacy Policy</h2>
        <div className="policy-container">
          <p>We are committed to protecting patient information and maintaining confidentiality.</p>
          <p>Personal data including medical records, appointment details, prescriptions and reports are stored securely.</p>
          <p>Patient information will never be shared with third parties without proper authorization except where legally required.</p>
          <p>All healthcare records are protected using secure hospital management practices.</p>
        </div>
      </section>

      <section id="terms" className="terms-section">
        <h2 className="section-title">Terms & Conditions</h2>
        <div className="policy-container">
          <p>Patients must provide accurate personal and medical information.</p>
          <p>Appointments are subject to doctor availability and hospital schedules.</p>
          <p>Emergency cases may receive priority treatment over scheduled appointments.</p>
          <p>Unauthorized access, misuse or modification of hospital data is strictly prohibited.</p>
          <p>Hospital management reserves the right to update policies whenever necessary.</p>
        </div>
      </section>

      <footer>
        <div className="footer-container">

          <div className="footer-logo">
            {/* Replace the src below with your actual logo import or a public URL */}
            <img src="/logo.png" alt="MedCare Logo" />
            <div className="social-icons">
              <a href="/">Facebook</a>
              <a href="/">Instagram</a>
              <a href="/">LinkedIn</a>
              <a href="/">YouTube</a>
              <a href="/">WhatsApp</a>
            </div>
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3920.9214938728173!2d77.00530347767985!3d10.663201662350483!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ba8382aa12c47c7%3A0x3125acac566855d0!2sSiva%20Meds%20Multispeciality%20Hospital!5e0!3m2!1sen!2sin!4v1779901487034!5m2!1sen!2sin"
              width="250"
              height="250"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              title="Hospital Location Map"
            ></iframe>
          </div>

          <div>
            <h2 className="footer-heading">Get in Touch</h2>
            <div className="footer-contact">
              <p>
                <strong>MedCare Hospital</strong><br />
                Pollachi, Tamil Nadu - 642001<br />
                India
              </p>
              <p>
                Email : medcarehospital@gmail.com<br />
                support@medcare.com
              </p>
              <p>
                Phone : +91 9876543210<br />
                +91 9876543211
              </p>
              <p>Emergency Helpline: +91 9999999999</p>
              <p>Facebook : medcarehospital</p>
              <p>Instagram : @medcarehospital</p>
              <p>Linkedin : medcarehospital</p>
              <p>Youtube : medcarehospital</p>
              <p>WhatsApp : +91 9876543210</p>
              <p>Twitter : medcarehospital</p>
            </div>
          </div>

          <div>
            <h2 className="footer-heading">Quick Links</h2>
            <ul className="footer-links">
              <li><a href="/">Hospital Directory</a></li>
              <li><a href="/">Patient Rights</a></li>
              <li><a href="/">Hospital Tariff</a></li>
              <li><a href="/">Health Packages</a></li>
              <li><a href="/">Patient Education</a></li>
              <li><a href="/">Medical Services</a></li>
              <li><a href="/">Departments</a></li>
              <li><a href="/">Emergency Care</a></li>
              <li><a href="/">FAQ</a></li>
              <li><a href="/">Contact Us</a></li>
            </ul>
          </div>

        </div>

        <div className="footer-bottom">
          <div>© 2026 MedCare Hospital. All Rights Reserved.</div>
          <div>
            <a href="#privacy">Privacy Policy</a> |
            <a href="#privacy">Disclaimer</a> |
            <a href="#terms" onClick={(e) => {
              e.preventDefault();
              const el = document.getElementById("terms");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }} style={{ cursor: "pointer" }}>Terms & Condition</a>
          </div>
        </div>
      </footer>

    </>
  );
}

export default Homepage;
