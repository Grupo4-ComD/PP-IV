import ChatbotReglamento from "@/components/ChatbotReglamento";

export default function VecinoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <ChatbotReglamento />
    </>
  );
}
