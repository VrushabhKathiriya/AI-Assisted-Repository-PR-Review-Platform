import { useState } from "react";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { login } from "../../api/auth.api.js";
import useAuthStore from "../../store/auth.store.js";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import Button from "../common/Button.jsx";
import Input from "../common/Input.jsx";

const LoginForm = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const { setUser, setToken } = useAuthStore();
  const navigate = useNavigate();

  const { mutate, isPending } = useMutation({
    mutationFn: login,
    onSuccess: (res) => {
      const { user, accessToken } = res.data.data;
      setUser(user);
      setToken(accessToken);
      toast.success(`Welcome back, ${user.username}!`);
      navigate("/dashboard");
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Login failed");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      toast.error("Please fill in all fields");
      return;
    }
    mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="relative">
        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          id="login-email"
          type="email"
          placeholder="Email address"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full bg-[#0d1117] border border-[#30363d] hover:border-[#6e7681] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-md pl-10 pr-4 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none transition-colors"
          required
        />
      </div>

      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          id="login-password"
          type={showPassword ? "text" : "password"}
          placeholder="Password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          className="w-full bg-[#0d1117] border border-[#30363d] hover:border-[#6e7681] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-md pl-10 pr-10 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none transition-colors"
          required
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
        >
          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>

      <div className="flex justify-end">
        <Link
          to="/forgot-password"
          className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
        >
          Forgot password?
        </Link>
      </div>

      <Button
        type="submit"
        variant="primary"
        size="md"
        loading={isPending}
        disabled={isPending}
        className="w-full"
      >
        Sign in
      </Button>

      <p className="text-center text-sm text-gray-500">
        Don&apos;t have an account?{" "}
        <Link to="/register" className="text-blue-400 hover:text-blue-300 transition-colors">
          Sign up
        </Link>
      </p>
    </form>
  );
};

export default LoginForm;
