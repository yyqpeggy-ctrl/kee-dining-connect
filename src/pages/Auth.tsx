import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, LogIn, UserPlus, KeyRound } from "lucide-react";
import LanguageSwitcher from "@/components/LanguageSwitcher";

const Auth = () => {
  const { i18n } = useTranslation();
  const isZh = i18n.language === "zh";
  const navigate = useNavigate();
  const { toast } = useToast();

  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast({ title: isZh ? "登录失败" : "Login Failed", description: error.message, variant: "destructive" });
    } else {
      navigate("/");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    if (password.length < 6) {
      toast({ title: isZh ? "密码太短" : "Password too short", description: isZh ? "密码至少6位" : "Minimum 6 characters", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) {
      toast({ title: isZh ? "注册失败" : "Sign Up Failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: isZh ? "注册成功" : "Signed Up", description: isZh ? "已自动登录" : "Auto logged in" });
      navigate("/");
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast({ title: isZh ? "发送失败" : "Failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: isZh ? "邮件已发送" : "Email Sent", description: isZh ? "请查看邮箱中的重置链接" : "Check your inbox for reset link" });
      setMode("login");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-foreground">
            {mode === "login" ? (isZh ? "登录" : "Sign In") : mode === "register" ? (isZh ? "注册" : "Sign Up") : (isZh ? "重置密码" : "Reset Password")}
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {isZh ? "餐厅管理系统" : "Restaurant Management System"}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={mode === "login" ? handleLogin : mode === "register" ? handleRegister : handleForgotPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{isZh ? "邮箱" : "Email"}</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
            </div>
            {mode !== "forgot" && (
              <div className="space-y-2">
                <Label htmlFor="password">{isZh ? "密码" : "Password"}</Label>
                <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={isZh ? "至少6位" : "Min 6 chars"} required minLength={6} />
              </div>
            )}
            <Button type="submit" className="w-full gap-2" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : mode === "login" ? <LogIn className="w-4 h-4" /> : mode === "register" ? <UserPlus className="w-4 h-4" /> : <KeyRound className="w-4 h-4" />}
              {mode === "login" ? (isZh ? "登录" : "Sign In") : mode === "register" ? (isZh ? "注册" : "Sign Up") : (isZh ? "发送重置链接" : "Send Reset Link")}
            </Button>
          </form>
          <div className="mt-4 text-center space-y-2">
            {mode === "login" && (
              <>
                <Button variant="link" className="text-xs" onClick={() => setMode("register")}>{isZh ? "没有账号？注册" : "No account? Sign Up"}</Button>
                <br />
                <Button variant="link" className="text-xs" onClick={() => setMode("forgot")}>{isZh ? "忘记密码？" : "Forgot password?"}</Button>
              </>
            )}
            {mode === "register" && (
              <Button variant="link" className="text-xs" onClick={() => setMode("login")}>{isZh ? "已有账号？登录" : "Have account? Sign In"}</Button>
            )}
            {mode === "forgot" && (
              <Button variant="link" className="text-xs" onClick={() => setMode("login")}>{isZh ? "返回登录" : "Back to Sign In"}</Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
