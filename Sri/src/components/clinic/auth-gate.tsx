import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Lock,
  Smartphone,
  Mail,
  User,
  ArrowRight,
  Languages,
  Loader2,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { ClinicUser } from "@/lib/types/clinic-types";
import { savePatientProfile, findClinicProfile } from "@/lib/clinic.functions";
import { getStoredUsers, saveUser, setActiveUser } from "@/lib/clinic-auth";

interface AuthGateProps {
  onAuthenticated: (user: ClinicUser) => void;
  locale: "en" | "ta";
  onToggleLocale: () => void;
}

export function AuthGate({ onAuthenticated, locale, onToggleLocale }: AuthGateProps) {
  const isTa = locale === "ta";

  const saveProfileFn = useServerFn(savePatientProfile);
  const findProfileFn = useServerFn(findClinicProfile);

  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const [activeTab, setActiveTab] = useState<"signin" | "register">("signin");

  // Sign in state
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register state
  const [regName, setRegName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");

  // Handle direct password sign in with loader
  async function handlePasswordSignIn(e: React.FormEvent) {
    e.preventDefault();
    const cleanId = loginIdentifier.trim().toLowerCase();
    if (!cleanId || !loginPassword.trim()) {
      toast.error(
        isTa
          ? "கைபேசி எண் / மின்னஞ்சல் மற்றும் கடவுச்சொல்லை உள்ளிடவும்."
          : "Please enter your Mobile / Email and Password."
      );
      return;
    }

    setIsLoggingIn(true);
    try {
      // Smooth feedback delay
      await new Promise((resolve) => setTimeout(resolve, 350));
      const users = getStoredUsers();
      const digitsOnly = (s: string) => s.replace(/\D/g, "");
      const cleanDigits = digitsOnly(cleanId);

      let found = users.find(
        (u) =>
          u.email.toLowerCase() === cleanId ||
          (cleanDigits.length >= 10 && digitsOnly(u.phone).endsWith(cleanDigits.slice(-10)))
      );

      // If not in localStorage, look up in MySQL database
      if (!found) {
        try {
          const dbResult = await findProfileFn({
            data: { identifier: cleanId, password: loginPassword.trim() },
          });
          if (dbResult?.error === "invalid_password") {
            toast.error(
              isTa
                ? "தவறான கடவுச்சொல். தயவுசெய்து மீண்டும் சரிபார்க்கவும்."
                : "Incorrect password. Please verify and try again."
            );
            return;
          }
          if (dbResult?.profile) {
            found = dbResult.profile;
            saveUser(found);
          }
        } catch (dbErr) {
          console.warn("[MySQL Profile Lookup Error]:", dbErr);
        }
      }

      if (!found) {
        toast.error(
          isTa
            ? "பயனர் கணக்கு காணப்படவில்லை. புதிய கணக்கு பதிவு செய்யவும்."
            : "No registered account found with that email or phone. Please register."
        );
        return;
      }

      setActiveUser(found);
      toast.success(isTa ? `வரவேற்கிறோம், ${found.name}!` : `Welcome back, ${found.name}!`);
      onAuthenticated(found);
    } finally {
      setIsLoggingIn(false);
    }
  }

  // Handle direct patient registration with spinner + "Registering…"
  async function handleRegisterSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!regName.trim() || !regPhone.trim() || !regPassword.trim()) {
      toast.error(
        isTa
          ? "முழுப் பெயர், கைபேசி எண் மற்றும் கடவுச்சொல் கட்டாயம்."
          : "Full Name, Mobile Number, and Password are required."
      );
      return;
    }

    const digits = regPhone.replace(/\D/g, "");
    if (digits.length < 10) {
      toast.error(
        isTa
          ? "சரியான 10-இலக்க கைபேசி எண்ணை உள்ளிடவும்."
          : "Please enter a valid 10-digit mobile number."
      );
      return;
    }

    if (regPassword.length < 6) {
      toast.error(
        isTa
          ? "கடவுச்சொல் குறைந்தபட்சம் 6 எழுத்துகள் இருக்க வேண்டும்."
          : "Password must be at least 6 characters."
      );
      return;
    }

    setIsRegistering(true);
    try {
      // Smooth responsive delay so loader is clearly visible
      await new Promise((resolve) => setTimeout(resolve, 500));

      const cleanPhone = `+91${digits.slice(-10)}`;
      const cleanEmail = regEmail.trim().toLowerCase();

      const newUser: ClinicUser = {
        id: `pat-${Date.now()}`,
        name: regName.trim(),
        phone: cleanPhone,
        email: cleanEmail || `${digits.slice(-10)}@patient.srihomoeocare.com`,
        role: "patient",
        isVerified: true,
        createdAt: new Date().toISOString(),
      };

      try {
        await saveProfileFn({
          data: {
            id: newUser.id,
            fullName: newUser.name,
            phone: newUser.phone,
            email: cleanEmail || undefined,
            password: regPassword.trim(),
            role: "patient",
          },
        });
      } catch (dbErr) {
        console.warn("[MySQL Profile Audit Warning]:", dbErr);
      }

      saveUser(newUser);
      setActiveUser(newUser);

      toast.success(
        isTa
          ? `பதிவு வெற்றிகரமானது! வரவேற்கிறோம், ${newUser.name}.`
          : `Registration successful! Welcome to Sri Homoeo Care, ${newUser.name}.`
      );

      onAuthenticated(newUser);
    } catch (err: any) {
      toast.error(
        isTa
          ? `பதிவு செய்ய முடியவில்லை: ${err?.message || "மீண்டும் முயற்சிக்கவும்"}`
          : `Registration failed: ${err?.message || "Please try again"}`
      );
    } finally {
      setIsRegistering(false);
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 bg-mesh-aurora text-foreground overflow-hidden">
      {/* Ambient mesh glows */}
      <div className="absolute top-1/4 -left-24 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none animate-float-slow" />
      <div className="absolute bottom-1/4 -right-24 w-96 h-96 bg-[oklch(0.82_0.12_85)]/8 rounded-full blur-3xl pointer-events-none animate-float" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <Card className="relative z-10 w-full max-w-md liquid-glass p-6 sm:p-8 animate-pop-in depth-3 border-primary/25 shadow-2xl">
        {/* Header & Logo */}
        <div className="flex items-center justify-between border-b border-border/50 pb-5 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full border-2 border-[oklch(0.82_0.12_85)]/50 bg-white p-1 flex items-center justify-center shadow-lg glow-gold">
              <img src="/sri-homeo-care-logo.png" alt="Sri Homoeo Care" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="font-display text-lg font-bold tracking-tight text-foreground">Sri Homoeo Care</h1>
              <p className="text-xs text-[oklch(0.82_0.12_85)] font-medium">{isTa ? "வேரிலிருந்து முழுமையான குணம்" : "Cure at the Core"}</p>
            </div>
          </div>
          <Button
            type="button"
            variant="glass"
            size="sm"
            onClick={onToggleLocale}
            className="text-xs text-primary"
          >
            <Languages className="w-3.5 h-3.5 mr-1" />
            {isTa ? "EN" : "தமிழ்"}
          </Button>
        </div>

        {/* Doctor Credential Mini-Banner */}
        <div className="rounded-xl glass-subtle px-3.5 py-2.5 mb-6 text-xs text-muted-foreground flex items-center justify-between">
          <div>
            <span className="font-semibold text-primary">Dr. Sriindhuja C</span> · BHMS, MSc (Psychology)
            <div className="text-[11px] text-[oklch(0.82_0.12_85)]/90 font-mono">Reg. No: 5397 · Tirupattur, TN</div>
          </div>
          <span className="text-[11px] px-2.5 py-1 rounded-full bg-primary/15 text-primary border border-primary/30 font-medium">
            6–8 PM IST
          </span>
        </div>

        {/* Main Sign In / Register Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "signin" | "register")}>
          <TabsList className="grid grid-cols-2 bg-secondary/80 border border-border p-1 mb-6 rounded-xl">
            <TabsTrigger value="signin" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold text-xs py-2">
              {isTa ? "உள்நுழை (Sign In)" : "Sign In"}
            </TabsTrigger>
            <TabsTrigger value="register" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold text-xs py-2">
              {isTa ? "பதிவு செய் (Register)" : "Register"}
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: SIGN IN */}
          <TabsContent value="signin" className="space-y-4">
            <form onSubmit={handlePasswordSignIn} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="id" className="text-xs text-muted-foreground">
                  {isTa ? "கைபேசி எண் அல்லது மின்னஞ்சல் *" : "Mobile Number or Email *"}
                </Label>
                <div className="relative">
                  <Smartphone className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                  <Input
                    id="id"
                    required
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="+91 98765 43210 or email"
                    className="pl-9 bg-background/60 border-border text-foreground focus-visible:ring-primary h-10 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="pass" className="text-xs text-muted-foreground">
                    {isTa ? "கடவுச்சொல்" : "Password"}
                  </Label>
                  <span className="text-[11px] text-[oklch(0.82_0.12_85)] hover:underline cursor-pointer">
                    {isTa ? "கடவுச்சொல் மறந்ததா?" : "Forgot Password?"}
                  </span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                  <Input
                    id="pass"
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-9 bg-background/60 border-border text-foreground focus-visible:ring-primary h-10 text-sm"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoggingIn}
                className="w-full h-11 bg-primary text-primary-foreground font-semibold shadow-md shadow-primary/20 hover:bg-primary/90"
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isTa ? "உள்நுழைகிறது..." : "Signing In..."}
                  </>
                ) : (
                  <>
                    {isTa ? "கடவுச்சொல் மூலம் உள்நுழைக" : "Sign In with Password"}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </form>
          </TabsContent>

          {/* TAB 2: REGISTER */}
          <TabsContent value="register">
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div className="space-y-1">
                <Label htmlFor="name" className="text-xs text-muted-foreground">
                  {isTa ? "முழுப் பெயர் *" : "Patient Full Name *"}
                </Label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                  <Input
                    id="name"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. Patient Name"
                    className="pl-9 bg-background/60 border-border text-foreground focus-visible:ring-primary h-9 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="phone" className="text-xs text-muted-foreground">
                  {isTa ? "கைபேசி எண் (+91) *" : "Mobile Number (+91) *"}
                </Label>
                <div className="relative">
                  <Smartphone className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    required
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="98765 43210"
                    className="pl-9 bg-background/60 border-border text-foreground focus-visible:ring-primary h-9 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="email" className="text-xs text-muted-foreground">
                  {isTa ? "மின்னஞ்சல் முகவரி (விருப்பம்)" : "Email Address (Optional)"}
                </Label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="patient@example.com"
                    className="pl-9 bg-background/60 border-border text-foreground focus-visible:ring-primary h-9 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="regpass" className="text-xs text-muted-foreground">
                  {isTa ? "புதிய கடவுச்சொல் *" : "Create Password *"}
                </Label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                  <Input
                    id="regpass"
                    type="password"
                    required
                    minLength={6}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-9 bg-background/60 border-border text-foreground focus-visible:ring-primary h-9 text-sm"
                  />
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                disabled={isRegistering}
                className="w-full mt-3 font-semibold bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90 h-11"
              >
                {isRegistering ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isTa ? "பதிவு செய்யப்படுகிறது..." : "Registering…"}
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    {isTa ? "பதிவு செய்க" : "Register"}
                  </>
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}