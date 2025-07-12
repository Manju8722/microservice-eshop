"use client";
import { useMutation } from "@tanstack/react-query";

import axios, { AxiosError } from "axios";
import toast, { Toaster } from "react-hot-toast";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useRef, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";

type FormData = {
  email: string;
  password: string;
};

const login = () => {
  const [step, setStep] = useState<"email" | "otp" | "reset">("email");
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [userEmail, setUserEamil] = useState<string | null>(null);
  const [caResend, setCanResend] = useState(true);
  const [timer, setTimer] = useState(60);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);

  const router = useRouter();
  function startResendTimer() {
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  const requestOtpMuatation = useMutation({
    mutationFn: async ({ email }: { email: string }) => {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URI}/api/forgot-password`,
        { email },
        {
          withCredentials: true,
        }
      );
      return response.data;
    },
    onSuccess: (_, { email }) => {
      setUserEamil(email);
      setStep("otp");
      setServerError(null);
      setCanResend(false);
      startResendTimer();
    },
    onError: (error: AxiosError) => {
      const errorMessage =
        (error.response?.data as { message?: string })?.message ||
        "Invalid OTP . TRY again";
      setServerError(errorMessage);
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: async () => {
      if (!userEmail) return;
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URI}/api/verify-forgot-password-otp`,
        { email: userEmail, otp: otp.join("") },
        {
          withCredentials: true,
        }
      );
      return response.data;
    },
    onSuccess: () => {
      setStep("reset");
      setServerError(null);
    },
    onError: (error: AxiosError) => {
      const errorMessage =
        (error.response?.data as { message?: string })?.message ||
        "Invalid OTP . TRY again";
      setServerError(errorMessage);
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ password }: { password: string }) => {
      if (!password) return;
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URI}/api/reset-password-user`,
        { email: userEmail, newPassword: password },
        {
          withCredentials: true,
        }
      );
      return response.data;
    },
    onSuccess: () => {
      setStep("email");
      setServerError(null);
      toast.success(
        "Password Reset succesfully please login with your email now!"
      );
      router.push("/");
    },
    onError: (error: AxiosError) => {
      const errorMessage =
        (error.response?.data as { message?: string })?.message ||
        "Invalid OTP . TRY again";
      setServerError(errorMessage);
    },
  });

  function handleOtpChange(index: number, value: string) {
    if (!/^[0-9]?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < inputRefs.current.length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleOtpKeydown(
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  const onSubmitEmail = ({ email }: { email: string }) => {
    requestOtpMuatation.mutate({ email });
  };

  const onSubmitPassword = ({ password }: { password: string }) => {
    resetPasswordMutation.mutate({ password });
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();

  //   const onSubmit = (data: FormData) => {};
  return (
    <div className="w-full py-10 min-h-[85vh] bg-[#f1f1f1]">
      <h1 className="text-4xl font-Poppins font-semibold text-black text-center">
        Forgot password
      </h1>
      <p className="text-center text-lg font-medium py-3 text[#00000019]">
        Home .Forgot password
      </p>
      <div className="w-full flex justify-center">
        <div className="md-w-[480px] p-8 bg-white shadow rounded-lg">
          {step === "email" && (
            <>
              <h3 className="text-3xl font-semibold text-center mb-2">
                login to Eshop
              </h3>
              <p className=" text-center text-gray-500 mb-y">
                Go back to login ?
                <Link href={"/login"} className="text-blue-500">
                  login
                </Link>
              </p>

              <form onSubmit={handleSubmit(onSubmitEmail)}>
                <label className="block text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  placeholder="support@bcodemy.com"
                  className="w-full p-2 border border-gray-300 outline-0 rounded mb-1"
                  {...register("email", {
                    required: "Email Required",
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: "Invalid eamil address",
                    },
                  })}
                />
                {errors.email && (
                  <p className="text-red-50 text-sm">
                    {String(errors.email.message)}
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full text-lg cursor-pointer bg-gray-400  py-2 rounded-lg"
                  disabled={requestOtpMuatation.isPending}
                >
                  {requestOtpMuatation.isPending ? "Senidng Otp" : "Submit"}
                </button>
                {serverError && (
                  <p className="text-red-500 text-sm">{String(serverError)}</p>
                )}
              </form>
            </>
          )}
          {step === "otp" && (
            <>
              <h3 className="text-xl font-semibold text-center mb-4">
                Enter Otp
              </h3>
              <div className="flex justify-center gap-6">
                {otp?.map((digit, index) => (
                  <input
                    type="text"
                    key={index}
                    ref={(el) => {
                      if (el) inputRefs.current[index] = el;
                    }}
                    maxLength={1}
                    className="w-12 h-12 text-center border border-gray-300 outline-none !rounded"
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeydown(index, e)}
                  />
                ))}
              </div>
              <button
                disabled={verifyOtpMutation.isPending}
                onClick={() => verifyOtpMutation.mutate()}
                className="w-full py-2 rounded-lg shadow-md mt-4 text-lg cursor-pointer bg-blue-500 text-white"
              >
                {verifyOtpMutation?.isPending
                  ? "Verifying otp....!"
                  : "Verify OTP"}
              </button>
              <p className="text-center text-sm mt-4">
                {caResend ? (
                  <button
                    onClick={() =>
                      requestOtpMuatation.mutate({ email: userEmail! })
                    }
                    className="text-blue-500 cursor-pointer"
                  >
                    Resend OTP
                  </button>
                ) : (
                  `Resend OTP in ${timer}`
                )}
              </p>
              {serverError && (
                <p className="text-red-500 text-sm mt-2">{serverError}</p>
              )}
            </>
          )}
          {step === "reset" && (
            <>
              <h3 className="text-xl font-semibold text-center mb-4">
                Reset Password
              </h3>
              <form onSubmit={handleSubmit(onSubmitPassword)}>
                <label className="block text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  placeholder="*****"
                  className="w-full p-2 border border-gray-300 outline-0 rounded mb-1"
                  {...register("password", {
                    required: "Password Required",
                    minLength: {
                      value: 6,
                      message: "Password must be at least 6 digit long",
                    },
                  })}
                />
                {errors.password && (
                  <p className="text-red-50 text-sm">
                    {String(errors.password.message)}
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full text-lg cursor-pointer bg-gray-400  py-2 rounded-lg"
                  disabled={resetPasswordMutation.isPending}
                >
                  {resetPasswordMutation.isPending
                    ? "Resetting password"
                    : "Reset Password"}
                </button>
                {serverError && (
                  <p className="text-red-500 text-sm">{String(serverError)}</p>
                )}
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default login;
