import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "DeveloPet Friendly 🐾 — Consorcio Calle 425",
    description:
        "Plataforma integral de gestión residencial para el Consorcio Calle 425.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="es">
            <body>{children}</body>
        </html>
    );
}
