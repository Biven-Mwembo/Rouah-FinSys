import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "./SignUp.css";

export default function SignUp() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    surname: "",
    dob: "",
    email: "",
    address: "",
    password: "",
    photo: null,
  });

  const [photoPreview, setPhotoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");         // ✅ new state
  const [messageType, setMessageType] = useState(""); // ✅ success or error

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData({
      ...formData,
      [name]: files ? files[0] : value,
    });

    if (name === "photo" && files && files[0]) {
      setPhotoPreview(URL.createObjectURL(files[0]));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = new FormData();
      payload.append("name", formData.name);
      payload.append("surname", formData.surname);

      if (formData.dob) {
        payload.append("dob", new Date(formData.dob).toISOString());
      }

      payload.append("email", formData.email);
      payload.append("address", formData.address);
      payload.append("password", formData.password);

      if (formData.photo) payload.append("photo", formData.photo);

      const response = await axios.post(
        "https://finsys.onrender.com/api/Users",
        payload,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      setMessage("User created successfully!");
      setMessageType("success");
      console.log(response.data);

      setFormData({
        name: "",
        surname: "",
        dob: "",
        email: "",
        address: "",
        password: "",
        photo: null,
      });
      setPhotoPreview(null);

      // Redirect after 2 seconds
      setTimeout(() => {
        navigate("/");
      }, 2000);

    } catch (error) {
      console.error(error);
      setMessage("Error creating user. Please try again.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-card">
        <h2 className="signup-title">Sign Up</h2>

        {/* ✅ Popup message banner */}
        {message && (
          <div className={`banner ${messageType}`}>
            {message}
          </div>
        )}

        <form className="signup-form" onSubmit={handleSubmit}>
          {["name", "surname", "dob", "email", "address"].map((field) => (
            <div className="form-group" key={field}>
              <input
                type={
                  field === "dob"
                    ? "date"
                    : field === "email"
                    ? "email"
                    : "text"
                }
                name={field}
                value={formData[field]}
                onChange={handleChange}
                required={field === "name" || field === "surname"}
                className="form-input"
                placeholder=" "
              />
              <label className="form-label">
                {field === "dob"
                  ? "Date of Birth"
                  : field.charAt(0).toUpperCase() + field.slice(1)}
              </label>
            </div>
          ))}

          {/* ✅ New password field */}
          <div className="form-group">
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="form-input"
              placeholder=" "
            />
            <label className="form-label">Password</label>
          </div>

          <div className="form-group">
            <label className="form-label">Profile Photo</label>
            <input
              type="file"
              name="photo"
              accept="image/*"
              onChange={handleChange}
              className="file-input"
            />
            {photoPreview && (
              <img src={photoPreview} alt="Preview" className="photo-preview" />
            )}
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? "Submitting..." : "Sign Up"}
          </button>
        </form>

        <p className="login-link">
          Already have an account? <Link to="/">Login</Link>
        </p>
      </div>
    </div>
  );
}
