import { useState } from "react";
import { Eye, EyeOff, User, Mail, Lock } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { register } from "../../api/auth.api.js";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import Button from "../common/Button.jsx";

const RegisterForm = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const { mutate, isPending } = useMutation({
    mutationFn: register,
    onSuccess: () => {
      toast.success("Account created! Please verify your email.");
      navigate("/verify-otp", { state: { email: formData.email } });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Registration failed");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.username || !formData.email || !formData.password) {
      toast.error("Please fill in all fields");
      return;
    }
    mutate(formData);
  };

  const field = (key, Icon, type = "text", placeholder) => (
    <div className="relative">
      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
      <input
        id={`reg-${key}`}
        type={type === "password" && showPassword ? "text" : type}
        placeholder={placeholder}
        value={formData[key]}
        onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
        className="w-full bg-[#0d1117] border border-[#30363d] hover:border-[#6e7681] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-md pl-10 pr-4 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none transition-colors"
        required
      />
      {type === "password" && (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
        >
          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      )}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {field("username", User, "text", "Username")}
      {field("email", Mail, "email", "Email address")}
      {field("password", Lock, "password", "Password")}

      <Button
        type="submit"
        variant="primary"
        size="md"
        loading={isPending}
        disabled={isPending}
        className="w-full"
      >
        Create account
      </Button>

      <p className="text-center text-sm text-gray-500">
        Already have an account?{" "}
        <Link to="/login" className="text-blue-400 hover:text-blue-300 transition-colors">
          Sign in
        </Link>
      </p>
    </form>
  );
};

export default RegisterForm;
