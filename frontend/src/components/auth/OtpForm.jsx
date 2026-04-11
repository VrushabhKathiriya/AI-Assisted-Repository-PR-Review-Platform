import { useState, useRef } from "react";
import { KeyRound } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { verifyOtp } from "../../api/auth.api.js";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import Button from "../common/Button.jsx";

const OtpForm = () => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const refs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "";

  const { mutate, isPending } = useMutation({
    mutationFn: verifyOtp,
    onSuccess: () => {
      toast.success("Email verified! You can now log in.");
      navigate("/login");
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Invalid OTP");
    },
  });

  const handleChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) refs[index + 1].current?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      refs[index - 1].current?.focus();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length !== 6) {
      toast.error("Please enter the full 6-digit OTP");
      return;
    }
    mutate({ email, otp: code });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex justify-center gap-2">
        {otp.map((digit, i) => (
          <input
            key={i}
            ref={refs[i]}
            id={`otp-${i}`}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            className="w-12 h-12 text-center text-xl font-bold bg-[#0d1117] border border-[#30363d] hover:border-[#6e7681] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-md text-gray-200 focus:outline-none transition-colors"
          />
        ))}
      </div>

      <Button
        type="submit"
        variant="primary"
        size="md"
        loading={isPending}
        disabled={isPending}
        className="w-full"
      >
        <KeyRound className="w-4 h-4" />
        Verify OTP
      </Button>
    </form>
  );
};

export default OtpForm;
