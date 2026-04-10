import { LoginForm } from "@/components/login-form";
import Image from "next/image";

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      {/* Mobile Layout */}
      <div className="md:hidden relative min-h-screen bg-white">
        {/* HEADER PREMIUM (Seção de Destaque) */}
        <div className="relative h-[380px] w-full bg-gradient-to-bl from-[#0F2872] to-[#0E3D8A] rounded-bl-[100px] flex flex-col items-center justify-center px-8 shadow-portal-mobile overflow-hidden">
          {/* Círculos Decorativos */}
          <div className="absolute -top-[60px] -right-[40px] w-[280px] h-[280px] rounded-full bg-white opacity-[0.04]" />
          <div className="absolute bottom-[20px] right-[40px] w-[60px] h-[60px] rounded-full bg-[#FECC00] opacity-[0.10]" />
          
          {/* Bloco do Logo Flutuante */}
          <div className="bg-white p-7 rounded-[32px] shadow-[0_15px_30px_rgba(0,0,0,0.15)] mb-6 z-10">
            <Image
              src="/logo_cometa.png"
              alt="Cometa Logo"
              width={200}
              height={120}
              priority
              className="h-[120px] w-auto object-contain"
            />
          </div>

          {/* Textos de Boas-vindas */}
          <div className="text-center z-10">
            <h1 className="text-white text-[36px] font-[900] tracking-[-1.0px] drop-shadow-[0_2px_2px_rgba(0,0,0,0.26)] leading-none">
              Bem-vindo!
            </h1>
            <p className="text-white/70 text-[16px] font-[500] leading-[1.3] mt-2 max-w-[220px] mx-auto">
              Acesse sua conta para gerenciar <br/> seus checklists.
            </p>
          </div>
        </div>

        {/* Formulário de Login */}
        <div className="px-8 pt-10 pb-12">
          <LoginForm />
        </div>
      </div>

      {/* Desktop Layout (Split Screen) */}
      <div className="hidden md:flex min-h-screen">
        {/* Left Side (60%) */}
        <div className="w-[60%] flex flex-col items-center justify-center p-16 text-center bg-[#0F2872] relative overflow-hidden">
          {/* Layer 1: Image Overlay with Opacity */}
          <div className="absolute inset-0 opacity-60">
            <Image
              src="/login_bg.png"
              alt="Login Background"
              fill
              className="object-cover"
              priority
            />
          </div>
          
          {/* Layer 2: Gradient Contrast Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0F2872]/80 to-black/40" />
          
          {/* Content Over Overlays */}
          <div className="relative z-10 flex flex-col items-center group">
            <div className="bg-white p-10 rounded-[40px] shadow-logo-premium mb-14 transition-transform duration-500 group-hover:scale-105">
              <Image
                src="/logo_cometa.png"
                alt="Cometa Logo"
                width={300}
                height={180}
                className="object-contain h-[180px] w-auto"
              />
            </div>
            
            <h1 className="text-white text-[48px] font-black leading-[1.1] tracking-[-1.5px] uppercase mb-8">
              Gestão de Laudos e <br /> Conformidade Cometa
            </h1>
            
            <div className="yellow-trace-horizontal bg-secondary mb-8" />
            
            <p className="text-white/70 text-[20px] font-medium max-w-[500px]">
              Eficiência operacional em tempo real para o Cometa Supermercados.
            </p>
          </div>
        </div>

        {/* Right Side (40%) */}
        <div className="w-[40%] bg-white flex items-center justify-center p-12">
          <div className="w-full max-w-[400px] flex flex-col">
            <div className="mb-[48px]">
              <h2 className="text-[32px] font-[800] tracking-[-0.5px] text-foreground mb-[12px]">
                Acessar Sistema
              </h2>
              <p className="text-[15px] font-[500] text-muted-foreground">
                Insira suas credenciais abaixo
              </p>
            </div>
            <LoginForm />
          </div>
        </div>
      </div>
    </main>
  );
}
