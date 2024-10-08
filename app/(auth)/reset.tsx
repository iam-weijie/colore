import { useSignIn } from "@clerk/clerk-expo";
import { useState } from "react";

const PwReset = () => {
  const { signIn, setActive } = useSignIn();
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [verification, setVerification] = useState({
    state: "default",
    code: "",
  });

  // Request a password reset code by email
  const onRequestReset = async () => {
    try {
      await signIn!.create({
        strategy: "reset_password_email_code",
        identifier: form.email,
      });
      setVerification({ ...verification, state: "pending" });
    } catch (err: any) {
      alert(err.errors[0].message);
    }
  };

  // Reset the password with the code and the new password
  const onReset = async () => {
    try {
      const result = await signIn!.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code: verification.code,
        password: form.password,
      });
      alert("Password reset successfully");

      // Set the user session active, which will log in the user automatically
      await setActive!({ session: result.createdSessionId });
      setVerification({ ...verification, state: "success" });
    } catch (err: any) {
      alert(err.errors[0].message);
    }
  };
};

export default PwReset;
